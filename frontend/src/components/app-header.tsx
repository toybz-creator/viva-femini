'use client';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { HeartPulse, Home, Stethoscope } from 'lucide-react';

type CurrentUser = {
  name: string;
};

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Tracking', href: '/tracking', icon: HeartPulse },
  { label: 'Health Report', href: '/report', icon: Stethoscope },
];

export default function AppHeader() {
  const pathname = usePathname();

  const { data: user } = useQuery<CurrentUser>({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data;
    },
  });

  return (
    <header className="hidden md:block">
      <div className="mx-auto flex max-w-[1100px] items-center gap-6 px-8 pt-8">
        <div className="flex items-center gap-3">
          <div className="size-12 overflow-hidden rounded-full bg-zinc-200 ring-2 ring-white">
            <Image
              src="/images/default-user-headshot.png"
              alt={user?.name ? `${user.name} profile photo` : 'Default user profile photo'}
              width={48}
              height={48}
              className="size-full object-cover"
              priority
            />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Good Morning 🌤️</p>
            <p className="text-sm font-extrabold text-slate-950">{user?.name || 'User'}</p>
          </div>
        </div>

        <div className="flex flex-1 justify-center">
          <nav className="rounded-full bg-[#F1F1F3] p-2">
            <ul className="grid grid-cols-3 items-center gap-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex min-w-[132px] flex-col items-center justify-center gap-1 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors',
                        isActive ? 'bg-[#C01B79] text-white shadow-sm' : 'bg-white text-slate-900 hover:bg-zinc-50'
                      )}
                    >
                      <Icon size={21} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="w-[180px]" />
      </div>
    </header>
  );
}
