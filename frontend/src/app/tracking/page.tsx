'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Activity,
  AlertCircle,
  Battery,
  Brain,
  ChevronLeft,
  Cloud,
  Cookie,
  Droplet,
  FileText,
  Flame,
  Focus,
  Frown,
  Heart,
  HeartOff,
  Loader2,
  Meh,
  Minus,
  Plus,
  RefreshCcw,
  Smile,
  Utensils,
  Wind,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/toast';
import { Symptom } from '@viva-femini/shared';
import { Skeleton } from '@/components/ui/skeleton';

type ApiSymptom = Symptom & {
  _id?: string;
  category: string;
};

type CategoryConfig = {
  key: string;
  title: string;
  desktopColumn: 'left' | 'right';
};

const categoryConfigs: CategoryConfig[] = [
  { key: 'physical', title: 'Physical Pain', desktopColumn: 'right' },
  { key: 'emotional', title: 'Mood & Mental', desktopColumn: 'right' },
  { key: 'digestion', title: 'Digestion & Appetite', desktopColumn: 'right' },
  { key: 'period', title: 'Period Indicators', desktopColumn: 'left' },
  { key: 'sexual', title: 'Sexual Health', desktopColumn: 'left' },
];

const iconMap = {
  Activity,
  AlertCircle,
  Battery,
  Brain,
  Cloud,
  Cookie,
  Droplet,
  Flame,
  Focus,
  Frown,
  Heart,
  HeartOff,
  Meh,
  Minus,
  Plus,
  RefreshCcw,
  Smile,
  Utensils,
  Wind,
};

const fallbackEmojiByCategory: Record<string, string> = {
  physical: '🩸',
  emotional: '😊',
  digestion: '😌',
  period: '💧',
  sexual: '🙂',
};

function symptomId(symptom: ApiSymptom) {
  return symptom.id || symptom._id || symptom.name;
}

function SymptomIcon({ symptom }: { symptom: ApiSymptom }) {
  const Icon = symptom.icon ? iconMap[symptom.icon as keyof typeof iconMap] : null;
  if (Icon) return <Icon size={15} aria-hidden="true" />;
  return <span aria-hidden="true">{fallbackEmojiByCategory[symptom.category] || '•'}</span>;
}

function TrackingSkeleton() {
  return (
    <main className="mx-auto max-w-[1100px] px-3 pb-8 pt-5 md:px-8 md:pt-6">
      <div className="grid gap-8 md:grid-cols-[400px_1fr]">
        <div className="space-y-5">
          <Skeleton className="h-[360px] rounded-xl" />
          <Skeleton className="h-[270px] rounded-xl" />
        </div>
        <Skeleton className="h-[650px] rounded-xl" />
      </div>
    </main>
  );
}

export default function TrackingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState('');
  const [flow, setFlow] = useState<number[]>([3]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const {
    data: symptoms,
    isLoading: isLoadingSymptoms,
    isError: isSymptomsError,
    refetch: refetchSymptoms,
  } = useQuery<ApiSymptom[]>({
    queryKey: ['symptoms'],
    queryFn: async () => {
      const { data } = await api.get<ApiSymptom[]>('/tracking/symptoms');
      return data;
    },
  });

  const grouped = useMemo(() => {
    const groups: Record<string, ApiSymptom[]> = {};
    (symptoms || []).forEach((symptom) => {
      groups[symptom.category] = groups[symptom.category] || [];
      groups[symptom.category].push(symptom);
    });
    return groups;
  }, [symptoms]);

  const mutation = useMutation({
    mutationFn: async () => {
      const selected = (symptoms || []).filter((symptom) => selectedSymptoms.includes(symptomId(symptom)));
      const sexualHealth = selected
        .filter((symptom) => symptom.category === 'sexual')
        .map((symptom) => symptom.name)
        .join(', ');

      const { data } = await api.post('/tracking/logs', {
        symptoms: selectedSymptoms,
        mood: selectedMood,
        flowIntensity: flow[0],
        sexualHealth,
        notes,
        date: new Date().toISOString(),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['logs-history'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-predictions'] });
      toast({ title: 'Saved', description: 'Your daily log has been saved.', variant: 'default' });
      router.push('/');
    },
    onError: (error: Error) => {
      setFormError(error.message);
      toast({
        title: 'Failed to save',
        description: 'Check your connection and try again.',
        variant: 'error',
      });
    },
  });

  const toggleSymptom = (symptom: ApiSymptom) => {
    const id = symptomId(symptom);
    setFormError('');
    setSelectedSymptoms((previous) => (previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]));
    if (symptom.category === 'emotional') {
      setSelectedMood((previous) => (previous === symptom.name ? '' : symptom.name));
    }
  };

  const renderCategory = (config: CategoryConfig, mobileOnly = false) => {
    const items = grouped[config.key] || [];
    if (!items.length && !isLoadingSymptoms) return null;

    return (
      <section
        key={config.key}
        className={cn(
          'rounded-[18px] bg-white p-4 md:rounded-xl md:p-0',
          mobileOnly ? 'md:hidden' : '',
          config.desktopColumn === 'left' ? 'md:bg-transparent' : 'md:bg-transparent',
        )}
      >
        <h2 className="text-base font-black text-slate-950 md:text-sm">{config.title}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {isLoadingSymptoms
            ? Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-28 rounded-full" />
              ))
            : items.map((symptom) => {
                const id = symptomId(symptom);
                const selected = selectedSymptoms.includes(id);
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => toggleSymptom(symptom)}
                    className={cn(
                      'inline-flex min-h-9 items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors',
                      selected
                        ? 'border-[#FA2B79] bg-[#FA2B79] text-white shadow-sm'
                        : 'border-[#FA2B79] bg-[#FFF7FA] text-slate-900 hover:bg-[#FFF0F6]',
                    )}
                  >
                    <SymptomIcon symptom={symptom} />
                    {symptom.name}
                  </button>
                );
              })}
        </div>
      </section>
    );
  };

  if (isLoadingSymptoms) return <TrackingSkeleton />;

  return (
    <main className="mx-auto max-w-[1100px] h-full overflow-y-auto px-0 pb-8 pt-0 md:px-8 md:pt-6 custom-scrollbar">
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-100 bg-white px-5 py-5 md:hidden">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="text-slate-400">
          <ChevronLeft size={26} />
        </button>
        <h1 className="text-base font-black text-slate-950">Log Menstrual Symptoms</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-[400px_1fr] md:gap-12">
        <aside className="space-y-5 px-3 pt-5 md:px-0 md:pt-0">
          <section className="rounded-none bg-white px-6 py-8 text-center md:flex md:min-h-[360px] md:flex-col md:items-center md:justify-center md:rounded-xl md:border md:border-slate-200">
            <Image
              src="/images/tracking-welcome.png"
              alt=""
              width={210}
              height={175}
              className="mx-auto h-[175px] w-[210px] object-contain"
              priority
            />
            <p className="mt-3 text-xl font-bold text-slate-950">Welcome,</p>
            <p className="mt-1 text-xl font-bold text-slate-500">How are you doing today?</p>
            <p className="mx-auto mt-3 max-w-[270px] text-sm leading-5 text-slate-500">
              Get to track your symptoms daily, to know your state of wellbeing
            </p>
          </section>

          <section className="hidden rounded-xl border border-slate-200 bg-white p-8 md:block">
            <div className="space-y-10">
              {categoryConfigs
                .filter((config) => config.desktopColumn === 'left')
                .map((config) => renderCategory(config))}
            </div>
          </section>
        </aside>

        <section className="space-y-3 bg-[#F3F3F5] px-3 py-3 md:rounded-xl md:border md:border-slate-200 md:bg-white md:p-8">
          {isSymptomsError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <p className="text-sm font-bold text-rose-900">Could not load tracking options.</p>
              <button
                type="button"
                onClick={() => void refetchSymptoms()}
                className="mt-3 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white"
              >
                Retry
              </button>
            </div>
          ) : null}

          <div className="space-y-10 md:space-y-12">
            {categoryConfigs
              .filter((config) => config.desktopColumn === 'right')
              .map((config) => renderCategory(config))}
          </div>

          <section className="rounded-[18px] bg-white p-4 md:rounded-none md:p-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-950 md:text-sm">Flow Intensity</h2>
              <span className="text-sm font-bold text-slate-500">{flow[0]}/10</span>
            </div>
            <p className="mt-4 text-base text-slate-500">How heavy is your flow today?</p>
            <div className="mt-4">
              <Slider
                value={flow}
                onValueChange={(value) => setFlow(Array.isArray(value) ? (value as number[]) : [value as number])}
                min={0}
                max={10}
                step={1}
                className="[&_[data-slot=slider-range]]:bg-[#FA2B79] [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-[#FA2B79] [&_[data-slot=slider-track]]:h-3"
              />
            </div>
            <div className="mt-3 grid grid-cols-3 text-sm text-slate-500">
              <span className="text-center">Light</span>
              <span className="text-center">Medium</span>
              <span className="text-right">Heavy</span>
            </div>
          </section>

          <div className="md:hidden">
            {categoryConfigs
              .filter((config) => config.desktopColumn === 'left')
              .map((config) => renderCategory(config, true))}
          </div>

          <section className="rounded-[18px] bg-white p-4 md:rounded-xl md:border md:border-slate-300">
            <div className="flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-base font-black text-slate-950">
                <FileText className="text-slate-400" size={22} />
                Notes
              </h2>
              <span className="rounded-full bg-slate-100 px-2 text-lg leading-5 text-slate-500">•••</span>
            </div>
            <Textarea
              placeholder="Leave A Note"
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                setFormError('');
              }}
              className="mt-3 min-h-[110px] resize-none border-0 bg-transparent px-3 text-base shadow-none placeholder:text-slate-400 focus-visible:ring-0"
            />
          </section>

          {formError ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="rounded-[18px] bg-white p-3 md:p-0">
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || isSymptomsError}
              className={cn(
                'flex w-full items-center justify-center gap-3 rounded-full bg-[#FA2B79] px-6 py-5 text-lg font-medium text-white shadow-sm transition-colors md:py-7 md:text-xl',
                mutation.isPending || isSymptomsError ? 'opacity-70' : 'hover:bg-[#C01B79]',
              )}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Saving
                </>
              ) : (
                'Save ✓'
              )}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
