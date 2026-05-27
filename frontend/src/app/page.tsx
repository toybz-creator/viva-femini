'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  HeartPulse,
  Megaphone,
  Settings,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Article, DashboardSummary, Log, Symptom, User } from '@viva-femini/shared';
import { cn } from '@/lib/utils';

const fallbackArticles: Article[] = [
  {
    id: 'fallback-hydration',
    title: 'Hydration for Better Cycle Comfort',
    content: 'Sip water steadily through the day to support circulation, reduce bloating, and help your muscles relax.',
    phase: 'general',
    category: 'Wellness',
  },
  {
    id: 'fallback-movement',
    title: 'Gentle Movement on Heavy Days',
    content: 'Light stretching, short walks, or restorative yoga can ease discomfort without adding pressure to your body.',
    phase: 'general',
    category: 'Movement',
  },
  {
    id: 'fallback-nutrition',
    title: 'Nourish Your Energy Naturally',
    content: 'Pair iron-rich foods with vitamin C and choose steady meals to keep your energy more balanced during your cycle.',
    phase: 'general',
    category: 'Nutrition',
  },
  {
    id: 'fallback-sleep',
    title: 'Protect Your Evening Wind-Down',
    content: 'A cooler room, fewer screens, and a predictable bedtime routine can help your body settle before sleep.',
    phase: 'general',
    category: 'Rest',
  },
];

function getDashboardArticles(articles: Article[] = []) {
  const seen = new Set<string>();
  return [...articles, ...fallbackArticles].filter((article) => {
    const key = article.id || article.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getWeekDays(anchorDate: Date) {
  const start = startOfWeek(anchorDate, { weekStartsOn: 0 });
  return Array.from({ length: 7 }).map((_, index) => addDays(start, index));
}

function getMonthGrid(monthDate: Date) {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
  const end = endOfMonth(monthDate);
  const total = differenceInCalendarDays(end, start) + 1;
  const weeks = Math.ceil(total / 7);

  return Array.from({ length: weeks }).map((_, weekIndex) =>
    Array.from({ length: 7 }).map((__, dayIndex) => addDays(start, weekIndex * 7 + dayIndex)),
  );
}

function getSymptomName(input: string | Symptom) {
  return typeof input === 'string' ? input : input.name;
}

function DashboardSkeleton() {
  return (
    <main className="mx-auto max-w-[1100px] px-4 pb-8 pt-5 md:h-[calc(100vh-140px)] md:px-8 md:pt-6 lg:overflow-hidden">
      <div className="grid h-full gap-5 lg:grid-cols-[400px_1fr]">
        <div className="space-y-4 lg:overflow-hidden">
          <Skeleton className="h-[405px] rounded-[22px]" />
          <Skeleton className="h-24 rounded-[22px]" />
          <Skeleton className="h-56 rounded-[22px]" />
        </div>
        <div className="space-y-4 lg:overflow-hidden">
          <Skeleton className="h-[380px] rounded-[22px]" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-32 rounded-[22px]" />
            <Skeleton className="h-32 rounded-[22px]" />
          </div>
          <Skeleton className="h-64 rounded-[22px]" />
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data } = await api.get<User>('/users/me');
      return data;
    },
  });

  const { data: summary, isLoading: isLoadingSummary } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await api.get<DashboardSummary>('/dashboard/summary');
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

  const today = new Date();
  const monthDate = startOfMonth(today);
  const todayLog = summary?.todayLog;
  const cycleDay = summary?.cycleDay || 1;
  const avgCycle = user?.avgCycleLength || 28;
  const avgPeriod = user?.avgPeriodLength || 5;
  const nextPeriodStart = summary?.nextPeriodStartDate ? new Date(summary.nextPeriodStartDate) : null;
  const fertileStart = summary?.fertileWindowStartDate ? new Date(summary.fertileWindowStartDate) : null;
  const fertileEnd = summary?.fertileWindowEndDate ? new Date(summary.fertileWindowEndDate) : null;
  const daysUntilNextPeriod = nextPeriodStart ? Math.max(0, differenceInCalendarDays(nextPeriodStart, today)) : null;

  const periodDates = useMemo(
    () =>
      new Set(
        (logsData || [])
          .filter((log) => typeof log.flowIntensity === 'number' && log.flowIntensity > 0)
          .map((log) => format(new Date(log.date), 'yyyy-MM-dd')),
      ),
    [logsData],
  );

  const highlightCards = useMemo(() => {
    const dashboardArticles = getDashboardArticles(summary?.recommendedArticles);
    const tipCard = summary?.dailyTip
      ? [
          {
            id: summary.dailyTip.id || summary.dailyTip.title,
            title: summary.dailyTip.title,
            content: summary.dailyTip.content,
            badge: 'Listen to your body',
            tone: 'bg-[#FFE7F0]',
            emoji: '🥗',
            featured: true,
          },
        ]
      : [];

    const articleCards = dashboardArticles.slice(0, 4).map((article, index) => ({
      id: article.id || article.title,
      title: article.title,
      content: article.content,
      badge: ['8 glasses daily', 'Gentle movement', 'Energy support', 'Wind down'][index] || 'Wellness tip',
      tone: ['bg-[#DFFFFF]', 'bg-[#FFF0D9]', 'bg-[#FFE7F0]', 'bg-[#EAF7FF]'][index] || 'bg-[#FFF0D9]',
      emoji: ['💧', '🧘‍♀️', '🥗', '🌙'][index] || '💜',
      featured: false,
    }));

    return [...articleCards.slice(0, 1), ...tipCard, ...articleCards.slice(1)].slice(0, 5);
  }, [summary]);

  const isPeriodDay = (date: Date) => periodDates.has(format(date, 'yyyy-MM-dd'));
  const isPredictedDay = (date: Date) => {
    if (!nextPeriodStart) return false;
    const start = new Date(nextPeriodStart);
    start.setHours(0, 0, 0, 0);
    const end = addDays(start, Math.max(0, avgPeriod - 1));
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  };
  const isFertileDay = (date: Date) => {
    if (!fertileStart || !fertileEnd) return false;
    const start = new Date(fertileStart);
    const end = new Date(fertileEnd);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  };

  if (isLoadingSummary || isLoadingLogs || isLoadingUser) return <DashboardSkeleton />;

  const todaysSymptoms = todayLog?.symptoms?.map(getSymptomName).filter(Boolean) || [];
  const recommendedArticles = getDashboardArticles(summary?.recommendedArticles);

  return (
    <main className="mx-auto max-w-[1100px] bg-white px-3 pb-8 pt-0 md:h-[calc(100vh-140px)] md:px-8 md:pt-6 lg:overflow-hidden">
      <div className="flex items-center justify-between bg-white px-2 py-4 md:hidden">
        <div className="flex items-center gap-3">
          <Image
            src="/images/default-user-headshot.png"
            alt={user?.name ? `${user.name} profile photo` : 'Default user profile photo'}
            width={40}
            height={40}
            className="size-10 rounded-full object-cover ring-2 ring-white"
            priority
          />
          <div>
            <p className="text-[11px] font-medium text-slate-400">Good Morning 🌤️</p>
            <p className="text-sm font-extrabold text-slate-950">{user?.name || 'User'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <button type="button" aria-label="Notifications" className="relative">
            <Bell size={22} />
            <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-[8px] font-bold text-white">24</span>
          </button>
          <button type="button" aria-label="Settings">
            <Settings size={22} />
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:h-full lg:grid-cols-[400px_1fr]">
        <section className="space-y-4 lg:h-full lg:overflow-y-auto lg:pr-2 custom-scrollbar">
          <div className="overflow-hidden rounded-[22px] bg-gradient-to-b from-[#FA2B79] to-[#FDA6CA] text-white shadow-sm">
            <div className="px-5 pb-8 pt-6 text-center">
              <p className="text-xs font-medium">Today, {format(today, 'MMMM d')}</p>
              <button
                type="button"
                onClick={() => setCalendarOpen(true)}
                className="mt-2 inline-flex items-center gap-2 text-lg font-extrabold"
              >
                <CalendarDays size={15} />
                {format(monthDate, 'MMMM yyyy')}
                <ChevronDown size={18} />
              </button>

              <div className="mt-6 grid grid-cols-7 gap-2 text-[10px] font-medium uppercase opacity-95">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-7 gap-2">
                {getWeekDays(today).map((date) => {
                  const active = isSameDay(date, today);
                  return (
                    <div
                      key={date.toISOString()}
                      className={cn(
                        'flex size-12 items-center justify-center rounded-full border border-white/65 text-sm font-extrabold',
                        active && 'border-[#EF2C78] bg-[#EF2C78] text-white',
                        isPredictedDay(date) && !active && 'bg-white/10',
                        isPeriodDay(date) && !active && 'bg-[#EF2C78]/45',
                      )}
                    >
                      {format(date, 'd')}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative mx-4 -mt-1 mb-6 overflow-hidden rounded-[32px] bg-white px-5 py-7 text-center text-slate-700">
              <div className="pointer-events-none absolute -left-12 top-5 size-40 rounded-full bg-[#FDA6CA]/50" />
              <div className="pointer-events-none absolute -right-12 top-4 size-40 rounded-full bg-[#FDA6CA]/50" />
              <p className="relative text-sm font-bold text-slate-500">Today is Cycle Day</p>
              <div className="relative mx-auto mt-4 flex size-20 items-center justify-center rounded-[28px] bg-[#FA2B79] text-4xl font-black text-white shadow-sm">
                {cycleDay}
              </div>
              <div className="relative mt-4 flex items-center justify-center gap-2 text-xs">
                <span className="font-extrabold">Avg. Cycle: {avgCycle} Days</span>
                <span className="text-slate-400">Currently: {Math.min(100, Math.round((cycleDay / avgCycle) * 100))}% of 100</span>
              </div>
              <div className="relative mt-3">
                <span className="inline-flex rounded-lg border border-[#FA2B79] px-7 py-2 text-xs font-bold text-[#FA2B79]">
                  {nextPeriodStart && daysUntilNextPeriod !== null
                    ? `Next Period: ${format(nextPeriodStart, 'MMM d')} (${daysUntilNextPeriod} Days)`
                    : 'Next Period: Not available'}
                </span>
              </div>
              <p className="relative mt-3 text-xs font-medium text-slate-400">
                {fertileStart ? `Fertile window starts ${format(fertileStart, 'MMM d')}` : 'Fertile window not available'}
              </p>
            </div>
          </div>

          <div className="rounded-[18px] border-8 border-[#E4E5EA] bg-white p-4 md:p-5">
            <div className="relative rounded-2xl bg-white p-1">
              <button type="button" aria-label="Dismiss referral" className="absolute right-0 top-0 text-slate-400">
                <X size={18} />
              </button>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold text-slate-950">Refer your friends to VivaFemini 💕💐</p>
                  <p className="mt-1 text-xs text-slate-500">Gift your friend 30 days of free Premium to help them thrive</p>
                </div>
                <Megaphone className="shrink-0 text-[#C01B79]" size={36} />
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold text-slate-950">Hi! Did you take your pregnancy test?</p>
                <button type="button" aria-label="Dismiss pregnancy test" className="rounded-full bg-slate-300 p-1 text-white">
                  <X size={14} />
                </button>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2 text-center text-[11px] font-medium text-slate-800">
                {["Didn't take test", 'Positive', 'Faint line', 'Negative'].map((label) => (
                  <button type="button" key={label} className="space-y-2 rounded-2xl p-2 hover:bg-slate-50">
                    <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#C01B79] text-white">
                      ▰▮
                    </span>
                    <span className="block">{label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-center">
                <button type="button" className="rounded-full bg-slate-200 px-10 py-2 text-xs font-bold text-slate-400">
                  Apply
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className="px-2 text-sm font-extrabold text-[#FA2B79]">Quick Action</p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  { label: 'Log symptoms', href: '/tracking', icon: HeartPulse },
                  { label: 'Log period', href: '/tracking', icon: Sparkles },
                  { label: 'Health Report', href: '/report', icon: Stethoscope },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      href={item.href}
                      key={item.label}
                      className="flex items-center justify-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-800"
                    >
                      <span className="flex size-7 items-center justify-center rounded-full bg-[#C01B79] text-white">
                        <Icon size={14} />
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 lg:h-full lg:overflow-y-auto lg:pr-2 custom-scrollbar">
          <div className="rounded-[22px] bg-[#F3F4F6] p-3 md:bg-[#E5E5EA]">
            <div className="rounded-[18px] bg-white px-4 py-7 text-center md:px-6">
              <p className="text-xl font-bold leading-7 text-[#FA2B79]">Cycle Highlight</p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-5 text-slate-900">Understand your cycle and take care during peak days</p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FFF0F6] px-5 py-3 text-xs font-extrabold text-[#FA2B79]">
                <CalendarDays size={14} />
                Day {cycleDay} Tip
              </span>

              <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 p-3 text-left">
                <div className="flex snap-x gap-3 overflow-x-auto pb-1 custom-scrollbar">
                  {highlightCards.map((card) => (
                    <article
                      key={card.id}
                      className={cn(
                        'min-w-[230px] snap-center rounded-2xl border border-pink-100 p-5 md:min-w-[255px] lg:min-w-[300px]',
                        card.featured ? 'bg-[#FFE7F0]' : card.tone,
                      )}
                    >
                      <div className="text-4xl">{card.emoji}</div>
                      <p className="mt-4 text-base font-bold leading-6 text-slate-950 md:text-lg">{card.title}</p>
                      <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-700">{card.content}</p>
                      <span className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-xs font-medium text-slate-700">
                        💜 {card.badge}
                      </span>
                    </article>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex justify-center gap-1.5 md:hidden">
                <span className="size-2 rounded-full bg-slate-300" />
                <span className="size-2 rounded-full bg-[#FA2B79]" />
                <span className="size-2 rounded-full bg-slate-300" />
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setCategoryOpen(true)}
                className="rounded-[18px] bg-white p-5 text-left"
              >
                <p className="text-lg font-black text-slate-950">Daily Check-Offs</p>
                <div className="mt-4 space-y-4 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span>Symptoms</span>
                    <span className="max-w-[190px] truncate font-extrabold text-[#FA2B79]">
                      {todaysSymptoms.length ? todaysSymptoms.slice(0, 2).join(', ') : 'Not logged'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Health Report</span>
                    <span className="font-extrabold text-emerald-600">{logsData?.length ? 'Logged' : '—'}</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCategoryOpen(true)}
                className="rounded-[18px] bg-white p-5 text-left"
              >
                <p className="text-lg font-black text-slate-950">📊 Trend Watch</p>
                <div className="mt-4 space-y-4 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span>Most Frequent Symptom</span>
                    <span className="rounded-full bg-[#FFF0F6] px-4 py-2 font-extrabold text-[#FA2B79]">
                      {summary?.trendWatch?.topSymptom || 'None'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Symptom Intensity Change</span>
                    <span className="rounded-full bg-cyan-100 px-4 py-2 font-extrabold text-emerald-500">
                      {summary?.trendWatch?.countThisWeek ? 'Stable 😊' : 'No data'}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="rounded-[22px] bg-[#F3F4F6] p-4 md:bg-[#E5E5EA]">
            <p className="px-1 text-lg font-black text-[#FA2B79]">Recommended for You</p>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {recommendedArticles.slice(0, 4).map((article: Article) => (
                <article key={article.id} className="min-w-[220px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 md:min-w-[240px]">
                  <div
                    className="h-[116px] rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 bg-cover bg-center"
                    style={article.imageUrl ? { backgroundImage: `url(${article.imageUrl})` } : undefined}
                    aria-hidden="true"
                  />
                  <div className="px-1 py-3">
                    <p className="line-clamp-2 text-sm font-black leading-5 text-slate-950">{article.title}</p>
                    <Link href="/report" className="mt-3 inline-flex text-sm font-bold text-[#C01B79]">
                      Read more →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-[26px] p-5 md:max-w-xl">
          <div className="flex items-center justify-between">
            <p className="text-base font-black text-slate-950">{format(monthDate, 'MMMM yyyy')}</p>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-[#FA2B79]" />
                Period
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-[#2F6BFF]" />
                Fertile
              </span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {getMonthGrid(monthDate).map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {week.map((date) => (
                  <div
                    key={date.toISOString()}
                    className={cn(
                      'flex size-10 items-center justify-center rounded-full text-sm font-bold',
                      date.getMonth() !== monthDate.getMonth() && 'opacity-30',
                      isSameDay(date, today) && 'bg-[#FA2B79] text-white',
                      !isSameDay(date, today) && isPeriodDay(date) && 'bg-[#FA2B79]/80 text-white',
                      !isSameDay(date, today) && isFertileDay(date) && 'bg-[#2F6BFF] text-white',
                      !isSameDay(date, today) && isPredictedDay(date) && 'bg-[#FFF0F6] text-[#FA2B79]',
                    )}
                  >
                    {format(date, 'd')}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-[26px] p-5 md:max-w-md">
          <p className="text-lg font-black text-slate-950">What would you like to track?</p>
          <p className="mt-1 text-sm text-slate-500">Choose a category to continue your daily check-in.</p>
          <div className="mt-5 grid gap-3">
            <Link href="/tracking" className="rounded-2xl bg-[#FA2B79] px-5 py-4 text-sm font-bold text-white">
              Log menstrual symptoms
            </Link>
            <Link href="/report" className="rounded-2xl bg-slate-100 px-5 py-4 text-sm font-bold text-slate-900">
              View health report
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
