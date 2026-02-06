'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Hammer, 
  Scale, 
  Trophy,
  Brain
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/worker', label: 'Worker', icon: Hammer },
  { href: '/evaluator', label: 'Evaluator', icon: Scale },
  { href: '/reputation', label: 'Reputation', icon: Trophy },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-400" />
            <span className="text-xl font-bold text-slate-100">MegaBrain</span>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-100">AlphaWorker</p>
              <p className="text-xs text-slate-400">Worker Score: 95</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-sm font-medium text-purple-400">A</span>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile navigation */}
      <div className="md:hidden border-t border-slate-800">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                  pathname === item.href
                    ? 'text-purple-400'
                    : 'text-slate-400 hover:text-slate-100'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}