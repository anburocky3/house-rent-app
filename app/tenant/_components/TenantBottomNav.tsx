"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavIconProps = {
  className?: string;
};

const HomeIcon = ({ className }: NavIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M3 11.5 12 4l9 7.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 10.5V20h14v-9.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const HistoryIcon = ({ className }: NavIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M4 12a8 8 0 1 0 2.3-5.7" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 5v4h4" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 8.5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const ComplaintsIcon = ({ className }: NavIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="4"
      y="4"
      width="16"
      height="13"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path d="M8 8h8M8 11h8M8 14h5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9 17v3l3-2h8" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const OwnerIcon = ({ className }: NavIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M4 20c2.5-3.5 13.5-3.5 16 0"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

const SettingsIcon = ({ className }: NavIconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 2v4m0 12v4M2 12h4m12 0h4"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

const items = [
  { href: "/tenant", label: "Home", Icon: HomeIcon },
  { href: "/tenant/history", label: "History", Icon: HistoryIcon },
  { href: "/tenant/complaints", label: "Complaints", Icon: ComplaintsIcon },
  { href: "/tenant/owner", label: "Owner", Icon: OwnerIcon },
  { href: "/tenant/settings", label: "Settings", Icon: SettingsIcon },
];

export default function TenantBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-3 left-1/2 z-30 w-[min(94%,460px)] -translate-x-1/2">
      <div className="grid grid-cols-5 gap-1 rounded-2xl border border-zinc-300 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 transition ${
                active
                  ? "bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
