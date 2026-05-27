// src/app/ui/modal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const Modal = ({ open, onOpenChange, title, description, children }: ModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={cn('rounded-2xl bg-white dark:bg-zinc-900')}>
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      {children}
    </DialogContent>
  </Dialog>
);

export default Modal;
