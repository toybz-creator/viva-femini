import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Log } from '../schemas/log.schema';
import { Symptom } from '../schemas/symptom.schema';
import { CreateLogDto } from './dto/create-log.dto';
import Redis from 'ioredis';
import {
  serializeMongoRecord,
  serializeMongoRecords,
} from '../common/utils/serializers';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectModel(Log.name) private logModel: Model<Log>,
    @InjectModel(Symptom.name) private symptomModel: Model<Symptom>,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async createLog(userId: string, data: CreateLogDto) {
    const finalFlowIntensity =
      data.flowIntensity !== undefined
        ? data.flowIntensity
        : data.flow !== undefined
          ? data.flow
          : 0;

    const entryDate = data.date ? new Date(data.date) : new Date();
    const startOfDay = new Date(entryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(entryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const savedLog = await this.logModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          date: { $gte: startOfDay, $lte: endOfDay },
        },
        {
          $set: {
            date: entryDate,
            symptoms: data.symptoms
              ? data.symptoms.map((symptomId) => new Types.ObjectId(symptomId))
              : [],
            mood: data.mood,
            flowIntensity: finalFlowIntensity,
            sexualHealth: data.sexualHealth,
            notes: data.notes,
          },
          $setOnInsert: {
            userId: new Types.ObjectId(userId),
          },
        },
        { new: true, upsert: true },
      )
      .populate('symptoms')
      .lean()
      .exec();

    try {
      const cacheKey = `dashboard:${userId}`;
      await this.redis.del(cacheKey);
    } catch (err) {
      this.logger.warn('Failed to invalidate redis cache', err as Error);
    }

    return this.serializeLog(savedLog);
  }

  async getLogs(userId: string, filters?: {
    startDate?: string;
    endDate?: string;
    flow?: string;
    mood?: string;
    sexualHealth?: string;
    limit?: number;
    skip?: number;
  }) {
    const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    const limit = Math.min(Math.max(filters?.limit ?? 1000, 1), 5000);
    const skip = Math.max(filters?.skip ?? 0, 0);

    if (filters) {
      const { startDate, endDate, flow, mood, sexualHealth } = filters;

      if (startDate || endDate) {
        const dateFilter: Record<string, Date> = {};
        if (startDate) {
          dateFilter.$gte = new Date(startDate);
        }
        if (endDate) {
          dateFilter.$lte = new Date(endDate);
        }
        query.date = dateFilter;
      }

      if (flow === 'true') {
        query.flowIntensity = { $gt: 0 };
      }
      if (mood === 'true') {
        query.mood = { $exists: true, $ne: '' };
      }
      if (sexualHealth === 'true') {
        query.sexualHealth = { $exists: true, $ne: '' };
      }
    }

    const logs = await this.logModel
      .find(query)
      .populate('symptoms')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return logs.map((log) => this.serializeLog(log));
  }


  async getSymptoms() {
    const symptoms = await this.symptomModel.find().lean().exec();
    return serializeMongoRecords(symptoms);
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
    };
  }
}
