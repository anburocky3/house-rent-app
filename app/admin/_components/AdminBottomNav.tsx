"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconProps = { className?: string };

const HomeIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M3 11.5 12 4l9 7.5M5 10.5V20h14v-9.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PeopleIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M3.5 19c.8-3.2 2.6-4.8 5.5-4.8s4.7 1.6 5.5 4.8M16 5.5a3 3 0 0 1 0 5.8M16.5 14.4c2.1.4 3.4 1.9 4 4.6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const HomeStackIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="m4 10 6-5 6 5v8H4zM8 18v2h12v-8l-3-2.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

const ComplaintIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M5 5h14v11H9l-4 3z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M9 9h6M9 12h4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const SettingsIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9 7 7m10 10 2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const navItems = [
  { href: "/admin", label: "Home", Icon: HomeIcon },
  { href: "/admin/tenants", label: "Tenants", Icon: PeopleIcon },
  { href: "/admin/properties", label: "Homes", Icon: HomeStackIcon },
  { href: "/admin/complaints", label: "Complaints", Icon: ComplaintIcon },
  { href: "/admin/settings", label: "More", Icon: SettingsIcon },
];

export default function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d7e2f0] bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(37,99,166,0.08)] backdrop-blur-xl dark:border-[#29435e] dark:bg-[#102337]/95">
      <ul className="mx-auto grid w-full max-w-md grid-cols-5 gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-h-12 flex-col items-center justify-center rounded-xl px-1 text-center transition ${
                  isActive
                    ? "bg-[#eaf3fc] text-[#2563a6] dark:bg-[#173452] dark:text-[#a7d1ff]"
                    : "text-[#68809a] hover:bg-[#f1f6fb] dark:text-[#9bb7d1] dark:hover:bg-[#172d46]"
                }`}
              >
                <item.Icon className="h-5 w-5" />
                <span className="mt-0.5 text-[11px] font-semibold">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
