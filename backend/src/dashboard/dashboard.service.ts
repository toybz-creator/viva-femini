import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Log } from '../tracking/schemas/log.schema';
import { Article } from './schemas/article.schema';
import { Tip } from './schemas/tip.schema';
import Redis from 'ioredis';
import { serializeMongoRecord } from '../common/utils/serializers';
import { calculateCycleState } from '../common/utils/cycle-calculations';

export interface DashboardSummary {
  cycleDay: number;
  phase: string;
  todayLog: Log | null;
  recommendedArticles: Article[];
  dailyTip: Tip | null;
  nextPeriodStartDate: Date;
  fertileWindowStartDate: Date;
  fertileWindowEndDate: Date;
  trendWatch: {
    topSymptom: string;
    countThisWeek: number;
    intensityChange: string;
  };
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Log.name) private logModel: Model<Log>,
    @InjectModel(Article.name) private articleModel: Model<Article>,
    @InjectModel(Tip.name) private tipModel: Model<Tip>,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async getSummary(userId: string): Promise<DashboardSummary> {
    const cacheKey = `dashboard:${userId}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const summary = JSON.parse(cached) as DashboardSummary;
        if ((summary.recommendedArticles?.length || 0) >= 4) return summary;
      }
    } catch (err) {
      this.logger.warn('Failed to read dashboard cache', err as Error);
    }

    const user = await this.userModel
      .findById(new Types.ObjectId(userId))
      .lean()
      .exec();
    if (!user) throw new Error('User not found');

    const today = new Date();
    const periodLogs = await this.logModel
      .find({
        userId: user._id,
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

    // Retrieve today's log (normalized to current local date bounds)
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const todayLog = await this.logModel
      .findOne({
        userId: user._id,
        date: {
          $gte: startOfToday,
          $lt: endOfToday,
        },
      })
      .populate('symptoms')
      .lean()
      .exec();

    // Fetch articles & daily tip based on cycle phase
    const recommendedArticles = await this.articleModel
      .find({ phase: cycleState.phase })
      .limit(4)
      .lean()
      .exec();

    const dailyTip = await this.tipModel
      .findOne({ phase: cycleState.phase })
      .lean()
      .exec();

    // Calculate Trend Watch (F2.4 / symptoms intensity changes)
    const trendWatch = await this.calculateTrendWatch(userId);

    const summary: DashboardSummary = {
      cycleDay: cycleState.cycleDay,
      phase: cycleState.phase,
      todayLog: todayLog ? this.serializeLog(todayLog) : null,
      recommendedArticles: recommendedArticles.map((article) =>
        serializeMongoRecord(article),
      ) as unknown as Article[],
      dailyTip: dailyTip
        ? (serializeMongoRecord(dailyTip) as unknown as Tip)
        : null,
      nextPeriodStartDate: cycleState.nextPeriodStartDate,
      fertileWindowStartDate: cycleState.fertileWindowStartDate,
      fertileWindowEndDate: cycleState.fertileWindowEndDate,
      trendWatch,
    };

    try {
      await this.redis.set(cacheKey, JSON.stringify(summary), 'EX', 3600);
    } catch (err) {
      this.logger.warn('Failed to write dashboard cache', err as Error);
    }
    return summary;
  }

  private async calculateTrendWatch(userId: string) {
    const today = new Date();

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Fetch all logs in the past 14 days
    const logs14Days = await this.logModel
      .find({
        userId: new Types.ObjectId(userId),
        date: { $gte: fourteenDaysAgo },
      })
      .populate('symptoms')
      .lean()
      .exec();

    const thisWeekLogs = logs14Days.filter(
      (log) => new Date(log.date) >= sevenDaysAgo,
    );
    const lastWeekLogs = logs14Days.filter(
      (log) => new Date(log.date) < sevenDaysAgo,
    );

    // Count symptom occurrences over the past 14 days
    const symptomFrequency: Record<
      string,
      { thisWeek: number; lastWeek: number }
    > = {};

    const processLog = (log: any, isThisWeek: boolean) => {
      if (log.symptoms) {
        log.symptoms.forEach((symptom: any) => {
          const name = symptom.name || symptom.toString();
          if (!symptomFrequency[name]) {
            symptomFrequency[name] = { thisWeek: 0, lastWeek: 0 };
          }
          if (isThisWeek) {
            symptomFrequency[name].thisWeek += 1;
          } else {
            symptomFrequency[name].lastWeek += 1;
          }
        });
      }
    };

    thisWeekLogs.forEach((log) => processLog(log, true));
    lastWeekLogs.forEach((log) => processLog(log, false));

    // Find the most frequent symptom overall in 14 days
    let topSymptom = 'None';
    let maxFrequency = 0;

    Object.entries(symptomFrequency).forEach(([name, counts]) => {
      const total = counts.thisWeek + counts.lastWeek;
      if (total > maxFrequency) {
        maxFrequency = total;
        topSymptom = name;
      }
    });

    if (topSymptom === 'None') {
      return {
        topSymptom: 'None',
        countThisWeek: 0,
        intensityChange: 'No symptoms tracked in the past 2 weeks.',
      };
    }

    const counts = symptomFrequency[topSymptom];
    const diff = counts.thisWeek - counts.lastWeek;
    let intensityChange = '';

    if (diff > 0) {
      const percent =
        counts.lastWeek > 0
          ? ` (+${Math.round((diff / counts.lastWeek) * 100)}%)`
          : '';
      intensityChange = `Increased by ${diff} occurrences${percent} compared to last week.`;
    } else if (diff < 0) {
      const percent =
        counts.lastWeek > 0
          ? ` (-${Math.round((Math.abs(diff) / counts.lastWeek) * 100)}%)`
          : '';
      intensityChange = `Decreased by ${Math.abs(diff)} occurrences${percent} compared to last week.`;
    } else {
      intensityChange =
        counts.thisWeek > 0
          ? `Stable: tracked ${counts.thisWeek} times this week (same as last week).`
          : `Not tracked this week (same as last week).`;
    }

    return {
      topSymptom,
      countThisWeek: counts.thisWeek,
      intensityChange,
    };
  }

  private serializeLog(log: object) {
    const serialized = serializeMongoRecord(log) as Record<string, unknown> & {
      id: string;
    };
    const symptoms = Array.isArray(serialized.symptoms)
      ? serialized.symptoms.map((symptom) =>
          symptom && typeof symptom === 'object'
            ? serializeMongoRecord(symptom as Record<string, unknown>)
            : symptom,
        )
      : [];

    return {
      ...serialized,
      symptoms,
      userId:
        serialized.userId instanceof Types.ObjectId
          ? serialized.userId.toHexString()
          : serialized.userId,
    } as unknown as Log;
  }
}
