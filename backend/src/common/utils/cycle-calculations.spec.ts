import { buildPeriodSegments, calculateCycleState } from './cycle-calculations';

describe('cycle calculations', () => {
  it('counts cycle day from the current period start inclusively', () => {
    const state = calculateCycleState({
      lastPeriodStartDate: '2026-05-01T12:00:00.000Z',
      averageCycleLength: 28,
      averagePeriodLength: 5,
      today: '2026-05-10T09:00:00.000Z',
    });

    expect(state.cycleDay).toBe(10);
    expect(toIsoDate(state.nextPeriodStartDate)).toBe('2026-05-29');
  });

  it('infers an early cycle reset after two previous days without period data', () => {
    const state = calculateCycleState({
      lastPeriodStartDate: '2026-05-01T00:00:00.000Z',
      averageCycleLength: 28,
      averagePeriodLength: 5,
      periodLogDates: [
        '2026-05-01T08:00:00.000Z',
        '2026-05-02T08:00:00.000Z',
        '2026-05-18T08:00:00.000Z',
      ],
      today: '2026-05-18T12:00:00.000Z',
    });

    expect(toIsoDate(state.currentCycleStartDate)).toBe('2026-05-18');
    expect(state.cycleDay).toBe(1);
    expect(toIsoDate(state.nextPeriodStartDate)).toBe('2026-06-15');
  });

  it('keeps nearby bleeding logs in one period segment and calculates duration inclusively', () => {
    const segments = buildPeriodSegments([
      '2026-05-01T08:00:00.000Z',
      '2026-05-02T08:00:00.000Z',
      '2026-05-04T08:00:00.000Z',
      '2026-06-01T08:00:00.000Z',
    ]);

    expect(segments).toHaveLength(2);
    expect(segments[0].duration).toBe(4);
    expect(toIsoDate(segments[1].startDate)).toBe('2026-06-01');
  });

  it('uses cycle length to estimate ovulation and the five-day fertile window before it', () => {
    const state = calculateCycleState({
      lastPeriodStartDate: '2026-05-01T00:00:00.000Z',
      averageCycleLength: 28,
      averagePeriodLength: 5,
      today: '2026-05-10T00:00:00.000Z',
    });

    expect(toIsoDate(state.ovulationDayDate)).toBe('2026-05-14');
    expect(toIsoDate(state.fertileWindowStartDate)).toBe('2026-05-09');
    expect(toIsoDate(state.fertileWindowEndDate)).toBe('2026-05-14');
    expect(toIsoDate(state.ovulationWindowStartDate)).toBe('2026-05-13');
    expect(toIsoDate(state.ovulationWindowEndDate)).toBe('2026-05-15');
  });

  it('falls back to latest period log when the profile period start is missing', () => {
    const state = calculateCycleState({
      lastPeriodStartDate: null,
      averageCycleLength: 28,
      averagePeriodLength: 5,
      periodLogDates: ['2026-05-18T08:00:00.000Z'],
      today: '2026-05-20T12:00:00.000Z',
    });

    expect(toIsoDate(state.currentCycleStartDate)).toBe('2026-05-18');
    expect(state.cycleDay).toBe(3);
  });
});

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
