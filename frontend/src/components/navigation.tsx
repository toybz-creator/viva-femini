'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HeartPulse, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Tracking', href: '/tracking', icon: HeartPulse },
  { label: 'Health Report', href: '/report', icon: Stethoscope },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-5 pt-3 md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-3 items-center gap-2 rounded-full bg-white p-2 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex min-h-11 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors',
                  isActive ? 'bg-[#C01B79] text-white shadow-sm' : 'text-zinc-700 hover:bg-zinc-100'
                )}
              >
                <Icon size={18} />
                <span>{item.label === 'Health Report' ? 'Health' : item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
