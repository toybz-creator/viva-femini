import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Log } from '../schemas/log.schema';
import { User } from '../schemas/user.schema';
import { CycleHistoryItem, AnalyticsData } from '@viva-femini/shared';
import {
  buildPeriodSegments,
  calculateCycleState,
  differenceInCalendarDays,
} from '../common/utils/cycle-calculations';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Log.name) private logModel: Model<Log>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getCycleHistory(userId: string): Promise<AnalyticsData> {
    const symptomFrequency: Record<string, number> = {};
    const symptomFrequencyAgg = await this.logModel.aggregate<{
      _id: string;
      count: number;
    }>([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $unwind: '$symptoms' },
      {
        $lookup: {
          from: 'symptoms',
          localField: 'symptoms',
          foreignField: '_id',
          as: 'symptom',
        },
      },
      { $unwind: '$symptom' },
      { $group: { _id: '$symptom.name', count: { $sum: 1 } } },
    ]);
    symptomFrequencyAgg.forEach((row) => {
      symptomFrequency[row._id] = row.count;
    });

    const user = await this.userModel
      .findById(new Types.ObjectId(userId))
      .exec();

    // Find all logs with flowIntensity > 0, ordered by date ascending to build real cycle history
    const periodLogs = await this.logModel
      .find({ userId: new Types.ObjectId(userId), flowIntensity: { $gt: 0 } })
      .sort({ date: 1 })
      .select({ date: 1 })
      .lean()
      .exec();

    const periods = buildPeriodSegments(periodLogs.map((log) => log.date));

    const cycleHistory: CycleHistoryItem[] = [];
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    for (let i = 0; i < periods.length; i++) {
      const p = periods[i];
      const pStart = p.startDate;
      let cycleLength = user?.avgCycleLength || 28;
      if (i > 0) {
        const prevP = periods[i - 1];
        const prevStart = prevP.startDate;
        cycleLength = Math.max(1, differenceInCalendarDays(pStart, prevStart));
      }

      cycleHistory.push({
        month: monthNames[pStart.getMonth()] + ' ' + pStart.getFullYear(),
        startDate: pStart.toISOString(),
        length: cycleLength,
        periodDays: p.duration,
      });
    }

    cycleHistory.reverse();

    if (cycleHistory.length === 0) {
      const base = new Date();
      for (let i = 0; i < 3; i++) {
        const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
        cycleHistory.push({
          month: monthNames[d.getMonth()] + ' ' + d.getFullYear(),
          startDate: d.toISOString(),
          length: user?.avgCycleLength || 28,
          periodDays: user?.avgPeriodLength || 5,
        });
      }
    }

    return {
      symptomFrequency,
      cycleHistory,
    };
  }

  async getPredictions(userId: string) {
    const user = await this.userModel
      .findById(new Types.ObjectId(userId))
      .exec();
    if (!user) throw new Error('User not found');

    const today = new Date();
    const periodLogs = await this.logModel
      .find({
        userId: new Types.ObjectId(userId),
        flowIntensity: { $gt: 0 },
        date: { $lte: today },
      })
      .sort({ date: 1 })
      .select({ date: 1 })
      .lean()
      .exec();
    const cycleState = calculateCycleState({
      lastPeriodStartDate: user.lastPeriodDate,
      averageCycleLength: user.avgCycleLength,
      averagePeriodLength: user.avgPeriodLength,
      periodLogDates: periodLogs.map((log) => log.date),
      today,
    });

    return {
      nextPeriodStartDate: cycleState.nextPeriodStartDate,
      ovulationWindowStartDate: cycleState.ovulationWindowStartDate,
      ovulationWindowEndDate: cycleState.ovulationWindowEndDate,
    };
  }
}
