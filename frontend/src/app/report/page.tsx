'use client';

import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsData, CycleHistoryItem, Log, PredictionsResponse, Symptom, User } from '@viva-femini/shared';
import { CalendarDays, ChevronDown, ChevronLeft, Download, FilePlus2, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addDays, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/toast';

type ApiSymptom = Symptom & {
  _id?: string;
  category: string;
};

const categoryLabels: Record<string, string> = {
  physical: 'Physical Pain',
  emotional: 'Mood & Mental',
  digestion: 'Digestion & Appetite',
  period: 'Period Indicators',
  sexual: 'Sexual Health',
};

const ringItems = [
  { key: 'Physical Pain', color: '#E50914' },
  { key: 'Period Indicators', color: '#D946EF' },
  { key: 'Mood & Mental', color: '#12A150' },
  { key: 'Digestion & Appetite', color: '#F4C414' },
  { key: 'Sexual Health', color: '#EC4899' },
] as const;

function getSymptomName(input: unknown) {
  if (typeof input === 'string') return input;
  if (typeof input === 'object' && input !== null && 'name' in input) {
    const name = (input as { name?: unknown }).name;
    if (typeof name === 'string') return name;
  }
  return '—';
}

function getChartLabel(history: CycleHistoryItem) {
  if (!history.startDate) return history.month.split(' ')[0].slice(0, 3);

  const date = new Date(history.startDate);
  if (Number.isNaN(date.getTime())) return history.month.split(' ')[0].slice(0, 3);

  return format(date, 'yyyy-MM-dd');
}

function ReportSkeleton() {
  return (
    <main className="mx-auto max-w-[1100px] h-full overflow-y-auto px-4 pb-8 pt-5 md:px-8 md:pt-6 custom-scrollbar">
      <div className="rounded-[22px] bg-[#E7E7E8] p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-[190px] rounded-[18px]" />
          <Skeleton className="h-[190px] rounded-[18px]" />
          <Skeleton className="h-[300px] rounded-[18px]" />
          <Skeleton className="h-[300px] rounded-[18px]" />
        </div>
        <Skeleton className="mt-3 h-[460px] rounded-[18px]" />
      </div>
    </main>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const { toast } = useToast();

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsData>('/analytics/cycle-history');
      return data;
    },
  });

  const { data: logsData, isLoading: isLoadingLogs } = useQuery<Log[]>({
    queryKey: ['logs-history'],
    queryFn: async () => {
      const { data } = await api.get<Log[]>('/tracking/logs');
      return data;
    },
  });

  const { data: predictions, isLoading: isLoadingPredictions } = useQuery<PredictionsResponse>({
    queryKey: ['analytics-predictions'],
    queryFn: async () => {
      const { data } = await api.get<PredictionsResponse>('/analytics/predictions');
      return data;
    },
  });

  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data } = await api.get<User>('/users/me');
      return data;
    },
  });

  const { data: symptoms } = useQuery<ApiSymptom[]>({
    queryKey: ['symptoms'],
    queryFn: async () => {
      const { data } = await api.get<ApiSymptom[]>('/tracking/symptoms');
      return data;
    },
  });

  const handleExportPDF = () => {
    toast({ title: 'Preparing PDF', description: 'Use the browser print dialog to save this report as PDF.', variant: 'default' });
    window.print();
  };

  if (isLoadingAnalytics || isLoadingLogs || isLoadingPredictions || isLoadingUser) return <ReportSkeleton />;

  const now = new Date();
  const monthLabel = format(now, 'MMMM yyyy');
  const avgCycleLength = user?.avgCycleLength || analytics?.cycleHistory?.[0]?.length || 28;
  const avgPeriodLength = user?.avgPeriodLength || analytics?.cycleHistory?.[0]?.periodDays || 5;
  const nextPeriodStartDate = predictions?.nextPeriodStartDate ? new Date(predictions.nextPeriodStartDate) : addDays(now, 14);
  const ovulationWindowStartDate = predictions?.ovulationWindowStartDate
    ? new Date(predictions.ovulationWindowStartDate)
    : addDays(now, 11);
  const ovulationWindowEndDate = predictions?.ovulationWindowEndDate ? new Date(predictions.ovulationWindowEndDate) : addDays(now, 15);

  const symptomNameToCategory = new Map<string, string>();
  (symptoms || []).forEach((symptom) => {
    symptomNameToCategory.set(symptom.name.toLowerCase(), categoryLabels[symptom.category] || symptom.category);
  });

  const categoryCounts: Record<string, number> = Object.fromEntries(ringItems.map((ring) => [ring.key, 0]));
  Object.entries(analytics?.symptomFrequency || {}).forEach(([name, count]) => {
    const category = symptomNameToCategory.get(name.toLowerCase());
    if (category && typeof categoryCounts[category] === 'number') categoryCounts[category] += count;
  });
  const categoryTotal = Object.values(categoryCounts).reduce((total, count) => total + count, 0);

  const logs = logsData || [];
  const flowLogs = logs
    .filter((log) => typeof log.flowIntensity === 'number' && !Number.isNaN(log.flowIntensity))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const chartFlowHistory = flowLogs.slice(-8);
  const chartPeriodHistory = [...(analytics?.cycleHistory || [])].reverse().slice(-8);

  const chartWidth = 640;
  const chartHeight = 220;
  const padding = 36;
  const chartMax = 10;
  const chartBase = chartFlowHistory.length ? chartFlowHistory : chartPeriodHistory;
  const chartNodes = chartBase.map((entry, index) => {
    const x = padding + (index * (chartWidth - padding * 2)) / Math.max(1, chartBase.length - 1);
    const value =
      'flowIntensity' in entry
        ? Math.max(0, Math.min(10, Number((entry as Log).flowIntensity ?? 0)))
        : Math.max(0, Math.min(10, Number((entry as CycleHistoryItem).periodDays ?? 0)));
    const y = chartHeight - padding - (value / chartMax) * (chartHeight - padding * 2);
    return {
      x,
      y,
      label:
        'date' in entry
          ? format(new Date((entry as Log).date), 'yyyy-MM-dd')
          : getChartLabel(entry as CycleHistoryItem),
      value,
    };
  });
  const chartPoints = chartNodes.map((node) => `${node.x},${node.y}`).join(' ');

  const radius = 32;
  const circumference = 2 * Math.PI * radius;

  return (
    <main className="mx-auto max-w-[1100px] px-0 pb-8 pt-0 md:h-full md:overflow-y-auto md:px-8 md:pt-6 custom-scrollbar print:max-w-none print:p-0">
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-100 bg-white px-5 py-5 md:hidden print:hidden">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="text-slate-400">
          <ChevronLeft size={26} />
        </button>
        <h1 className="text-base font-black text-slate-950">Menstrual Cycle Tracking</h1>
      </div>

      <div className="bg-[#F3F4F6] p-4 md:rounded-[22px] md:bg-[#E5E5EA] md:p-4 print:bg-white print:p-0">
        <section className="grid gap-3 md:grid-cols-2 print:grid-cols-2">
          <div className="rounded-[18px] bg-white p-5 md:p-7">
            <h2 className="text-lg font-black text-slate-950">Cycle Summary – {monthLabel}</h2>
            <div className="mt-6 flex flex-wrap gap-4">
              {[
                { label: 'Cycle Length:', value: `${avgCycleLength} Days`, color: '#FF6B4A', icon: '↻' },
                { label: 'Period Duration:', value: `${avgPeriodLength} Days`, color: '#FA2B79', icon: '〽' },
                { label: 'Estimated Next Period:', value: format(nextPeriodStartDate, 'MMM d'), color: '#8B35FF', icon: '💧' },
                {
                  label: 'Ovulation Window:',
                  value: `${format(ovulationWindowStartDate, 'MMM d')}–${format(ovulationWindowEndDate, 'd')}`,
                  color: '#2F58FF',
                  icon: '💦',
                },
              ].map((pill) => (
                <div
                  key={pill.label}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-3 text-xs font-medium"
                  style={{ borderColor: pill.color, color: pill.color }}
                >
                  <span>{pill.icon}</span>
                  {pill.label} <strong className="text-slate-950">{pill.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] bg-white p-5 md:p-7">
            <h2 className="text-lg font-black text-slate-950">Flow &amp; Symptom Summary</h2>
            <p className="mt-1 text-xs text-slate-500">Understand your symptoms linked to sleep &amp; activity</p>
            <p className="mt-4 text-sm leading-6 text-slate-950">
              Your average cycle length is {avgCycleLength} days. PMS symptoms were more frequent this month. Flow
              pattern remains within a typical range.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <p className="text-sm font-medium text-[#C01B79]">Tips To Adhere To:</p>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-sm text-slate-950">
              <li>Low sleep nights → higher cramp scores</li>
              <li>Low hydration → increased bloating</li>
            </ul>
          </div>

          <div className="rounded-[18px] bg-white p-5 md:p-7">
            <h2 className="text-base font-black text-slate-950">Period Length</h2>
            <p className="mt-1 text-xs text-slate-500">Monthly period pattern (0–7 days) and flow intensity</p>
            <div className="mt-5 overflow-x-auto">
              {chartNodes.length ? (
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="min-w-[560px]">
                  {[0, 3, 6, 10].map((tick) => {
                    const y = chartHeight - padding - (tick / chartMax) * (chartHeight - padding * 2);
                    return (
                      <g key={tick}>
                        <line x1={padding} x2={chartWidth - padding} y1={y} y2={y} stroke="#E5E7EB" strokeWidth="1" />
                        <text x={padding - 10} y={y + 4} textAnchor="end" className="fill-slate-500 text-[11px]">
                          {tick}
                        </text>
                      </g>
                    );
                  })}
                  <line x1={padding} x2={padding} y1={padding} y2={chartHeight - padding} stroke="#9CA3AF" />
                  <line x1={padding} x2={chartWidth - padding} y1={chartHeight - padding} y2={chartHeight - padding} stroke="#9CA3AF" />
                  <polyline
                    fill="none"
                    stroke="#FA2B79"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="4"
                    points={chartPoints}
                  />
                  {chartNodes.map((node) => (
                    <g key={`${node.label}-${node.x}`}>
                      <circle cx={node.x} cy={node.y} r="7" fill="#fff" stroke="#FA2B79" strokeWidth="4" />
                      <text x={node.x} y={chartHeight - 10} textAnchor="middle" className="fill-slate-500 text-[10px]">
                        {node.label}
                      </text>
                    </g>
                  ))}
                </svg>
              ) : (
                <div className="flex h-[180px] items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
                  Not enough data to chart yet.
                </div>
              )}
            </div>
            <div className="mt-5 border-t border-slate-200 pt-4 text-xs text-slate-500">
              <HelpCircle className="mr-1 inline size-4" />
              Higher peaks indicate stronger symptoms. Flow overlay (pink) shows heavier days.
            </div>
          </div>

          <div className="rounded-[18px] bg-white p-5 md:p-7">
            <h2 className="text-base font-black text-slate-950">Symptom Frequency</h2>
            <p className="mt-1 text-xs text-slate-500">Study your body system &amp; understand your wellbeing</p>
            <div className="mt-6 grid grid-cols-5 gap-4 overflow-x-auto md:grid-cols-3">
              {ringItems.map((ring) => {
                const count = categoryCounts[ring.key] || 0;
                const percent = categoryTotal > 0 ? Math.round((count / categoryTotal) * 100) : 0;
                return (
                  <div key={ring.key} className="min-w-[82px] rounded-2xl text-center md:min-w-0 md:border md:border-slate-100 md:p-4">
                    <div className="relative mx-auto flex size-[82px] items-center justify-center">
                      <svg width="82" height="82" viewBox="0 0 82 82">
                        <circle cx="41" cy="41" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="8" />
                        <circle
                          cx="41"
                          cy="41"
                          r={radius}
                          fill="none"
                          stroke={ring.color}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={circumference - (percent / 100) * circumference}
                          transform="rotate(-90 41 41)"
                        />
                      </svg>
                      <span className="absolute text-sm font-black text-slate-950">{percent}%</span>
                    </div>
                    <p className="mt-3 hidden text-xs text-slate-500 md:block">
                      <span className="mr-1 inline-block size-2 rounded-full" style={{ background: ring.color }} />
                      {ring.key}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500 md:hidden">
              {ringItems.map((ring) => (
                <span key={ring.key} className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-full" style={{ backgroundColor: ring.color }} />
                  {ring.key}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-3 rounded-[18px] bg-white print:mt-4">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <p className="text-sm text-slate-950">Historical Cycle Data</p>
              <button type="button" className="mt-2 inline-flex items-center gap-2 text-base font-black text-slate-950">
                {format(now, 'MMM yyyy')}
                <ChevronDown size={18} />
              </button>
            </div>
            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 rounded-full bg-[#C01B79] px-5 py-3 text-xs font-bold text-white print:hidden"
            >
              <Download size={16} />
              Download PDF
            </button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Top Symptom</TableHead>
                  <TableHead>Total Symptoms</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">
                    <CalendarDays size={16} />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length ? (
                  logs.slice(0, 12).map((log) => {
                    const date = new Date(log.date);
                    const symptomsCount = Array.isArray(log.symptoms) ? log.symptoms.length : 0;
                    const topSymptom = symptomsCount ? getSymptomName(log.symptoms[0]) : '—';
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="text-xs text-slate-950">{format(date, 'MMM do')}</div>
                          <div className="text-[10px] text-slate-500">{format(date, 'p')}</div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-950">{topSymptom}</TableCell>
                        <TableCell className="text-xs text-slate-950">{symptomsCount ? `${symptomsCount}/10` : '—'}</TableCell>
                        <TableCell className="max-w-[220px] truncate text-xs text-slate-950">{log.notes || '—'}</TableCell>
                        <TableCell className="text-right text-slate-400">
                          <FilePlus2 size={16} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-sm text-slate-500">
                      No historical logs yet. Save your first tracking entry to build this report.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <p className="py-7 text-center text-xs text-slate-500 print:py-4">
        VivaFemini Menstrual health report • Generated from your tracked data
      </p>
    </main>
  );
}
