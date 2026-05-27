const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;
const LUTEAL_PHASE_LENGTH = 14;
const CLEAR_NON_PERIOD_DAYS_BEFORE_NEW_CYCLE = 2;

export interface PeriodSegment {
  startDate: Date;
  endDate: Date;
  duration: number;
}

export interface CycleState {
  currentCycleStartDate: Date;
  cycleDay: number;
  phase: string;
  nextPeriodStartDate: Date;
  ovulationDayDate: Date;
  ovulationWindowStartDate: Date;
  ovulationWindowEndDate: Date;
  fertileWindowStartDate: Date;
  fertileWindowEndDate: Date;
}

export function normalizeToLocalDay(date: Date | string): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function addCalendarDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

export function differenceInCalendarDays(later: Date, earlier: Date): number {
  return Math.floor(
    (normalizeToLocalDay(later).getTime() -
      normalizeToLocalDay(earlier).getTime()) /
      MS_PER_DAY,
  );
}

export function buildPeriodSegments(
  periodLogDates: Array<Date | string>,
): PeriodSegment[] {
  const uniqueDayTimes = Array.from(
    new Set(periodLogDates.map((date) => normalizeToLocalDay(date).getTime())),
  ).sort((a, b) => a - b);

  const periodDays = uniqueDayTimes.map((time) => new Date(time));
  const segments: PeriodSegment[] = [];
  let currentStart: Date | null = null;
  let currentEnd: Date | null = null;

  periodDays.forEach((periodDay) => {
    if (!currentStart || !currentEnd) {
      currentStart = periodDay;
      currentEnd = periodDay;
      return;
    }

    const daysSinceLastPeriodLog = differenceInCalendarDays(
      periodDay,
      currentEnd,
    );
    if (daysSinceLastPeriodLog <= CLEAR_NON_PERIOD_DAYS_BEFORE_NEW_CYCLE) {
      currentEnd = periodDay;
      return;
    }

    segments.push(createPeriodSegment(currentStart, currentEnd));
    currentStart = periodDay;
    currentEnd = periodDay;
  });

  if (currentStart && currentEnd) {
    segments.push(createPeriodSegment(currentStart, currentEnd));
  }

  return segments;
}

export function calculateCycleState(input: {
  lastPeriodStartDate?: Date | string | null;
  averageCycleLength?: number;
  averagePeriodLength?: number;
  periodLogDates?: Array<Date | string>;
  today?: Date | string;
}): CycleState {
  const today = normalizeToLocalDay(input.today ?? new Date());
  const averageCycleLength = input.averageCycleLength || DEFAULT_CYCLE_LENGTH;
  const averagePeriodLength =
    input.averagePeriodLength || DEFAULT_PERIOD_LENGTH;
  const inferredPeriodSegments = buildPeriodSegments(
    input.periodLogDates ?? [],
  );
  const latestLoggedPeriodStart = inferredPeriodSegments
    .filter((segment) => segment.startDate <= today)
    .map((segment) => segment.startDate)
    .reduce<Date | null>(
      (latest, startDate) =>
        !latest || startDate > latest ? startDate : latest,
      null,
    );
  const userLastPeriodStart = input.lastPeriodStartDate
    ? normalizeToLocalDay(input.lastPeriodStartDate)
    : (latestLoggedPeriodStart ?? today);
  const baselinePeriodStart = Number.isNaN(userLastPeriodStart.getTime())
    ? (latestLoggedPeriodStart ?? today)
    : userLastPeriodStart;

  const currentCycleStartDate =
    latestLoggedPeriodStart && latestLoggedPeriodStart > baselinePeriodStart
      ? latestLoggedPeriodStart
      : baselinePeriodStart;
  const cycleDay = Math.max(
    1,
    differenceInCalendarDays(today, currentCycleStartDate) + 1,
  );
  const nextPeriodStartDate = addCalendarDays(
    currentCycleStartDate,
    averageCycleLength,
  );
  const ovulationCycleDay = Math.max(
    1,
    averageCycleLength - LUTEAL_PHASE_LENGTH,
  );
  const ovulationDayDate = addCalendarDays(
    currentCycleStartDate,
    ovulationCycleDay - 1,
  );
  const fertileWindowStartDate = addCalendarDays(ovulationDayDate, -5);
  const fertileWindowEndDate = new Date(ovulationDayDate.getTime());
  const ovulationWindowStartDate = addCalendarDays(ovulationDayDate, -1);
  const ovulationWindowEndDate = addCalendarDays(ovulationDayDate, 1);

  return {
    currentCycleStartDate,
    cycleDay,
    phase: getCyclePhase(cycleDay, averagePeriodLength, ovulationCycleDay),
    nextPeriodStartDate,
    ovulationDayDate,
    ovulationWindowStartDate,
    ovulationWindowEndDate,
    fertileWindowStartDate,
    fertileWindowEndDate,
  };
}

function createPeriodSegment(startDate: Date, endDate: Date): PeriodSegment {
  return {
    startDate,
    endDate,
    duration: Math.max(1, differenceInCalendarDays(endDate, startDate) + 1),
  };
}

function getCyclePhase(
  cycleDay: number,
  averagePeriodLength: number,
  ovulationCycleDay: number,
): string {
  if (cycleDay <= averagePeriodLength) return 'menstrual';
  if (cycleDay < ovulationCycleDay - 1) return 'follicular';
  if (cycleDay <= ovulationCycleDay + 1) return 'ovulatory';
  return 'luteal';
}
