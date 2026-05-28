export interface User {
    id: string;
    name: string;
    email: string;
    avgCycleLength: number;
    avgPeriodLength: number;
    lastPeriodDate: Date | string;
}
export interface Symptom {
    id: string;
    name: string;
    category: "physical" | "emotional" | "other" | string;
    icon?: string;
}
export interface Log {
    id: string;
    userId: string;
    date: Date | string;
    symptoms: string[] | Symptom[];
    flowIntensity?: number;
    mood?: string;
    sexualHealth?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface Article {
    id: string;
    title: string;
    content: string;
    phase: "menstrual" | "follicular" | "ovulatory" | "luteal" | string;
    category?: string;
    imageUrl?: string;
}
export interface Tip {
    id: string;
    title: string;
    content: string;
    phase: "menstrual" | "follicular" | "ovulatory" | "luteal" | string;
    icon?: string;
    hashTag?: string;
}
export interface DashboardSummary {
    cycleDay: number;
    phase: "menstrual" | "follicular" | "ovulatory" | "luteal" | string;
    todayLog: Log | null;
    recommendedArticles: Article[];
    dailyTip: Tip | null;
    nextPeriodStartDate?: string | Date;
    fertileWindowStartDate?: string | Date;
    fertileWindowEndDate?: string | Date;
    trendWatch?: {
        topSymptom: string;
        countThisWeek: number;
        intensityChange: string;
    };
}
export interface PredictionsResponse {
    nextPeriodStartDate: string | Date;
    ovulationWindowStartDate: string | Date;
    ovulationWindowEndDate: string | Date;
}
export interface CreateLogRequest {
    date?: string | Date;
    symptoms?: string[];
    mood?: string;
    flowIntensity?: number;
    notes?: string;
    userId?: string;
}
export interface CycleHistoryItem {
    month: string;
    startDate?: string | Date;
    length: number;
    periodDays: number;
}
export interface AnalyticsData {
    symptomFrequency: Record<string, number>;
    cycleHistory: CycleHistoryItem[];
}
