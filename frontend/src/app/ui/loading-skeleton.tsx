// src/app/ui/loading-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string; // e.g., 'w-full', 'w-1/2'
  height?: string; // e.g., 'h-4', 'h-8'
}

export const LoadingSkeleton = ({ className, variant = 'rect', width = 'w-full', height = 'h-4' }: LoadingSkeletonProps) => {
  const base = cn('animate-pulse bg-gray-200 dark:bg-gray-700', className);
  if (variant === 'text') {
    return <Skeleton className={cn(base, width, height)} />;
  }
  if (variant === 'circle') {
    return <Skeleton className={cn(base, 'rounded-full', width, height)} />;
  }
  // rectangle default
  return <Skeleton className={cn(base, width, height)} />;
};

export default LoadingSkeleton;
