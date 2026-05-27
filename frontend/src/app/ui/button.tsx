// src/app/ui/button.tsx
import { Button as ShadButton, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Button = ({ className, ...props }: ButtonProps) => {
  return <ShadButton className={cn('transition-colors hover:shadow-lg', className)} {...props} />;
};

export default Button;
