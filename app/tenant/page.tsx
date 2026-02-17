import LogoutButton from "../components/LogoutButton";

export default function TenantDashboard() {
  return (
    <div className="relative min-h-screen font-sans">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pb-28 pt-14">
        <section className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200">
              Tenant Dashboard
            </div>
            <LogoutButton />
          </div>
          <div className="space-y-5">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl dark:text-zinc-50">
              Welcome to House Rent App
            </h1>
            <p className="max-w-2xl text-base text-zinc-600 sm:text-lg dark:text-zinc-300">
              Track payments, manage lease activity, and review your rental
              history in a single, high-contrast interface that looks great on
              mobile.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Next payment",
              value: "$1,480",
              detail: "Due Feb 28",
            },
            {
              title: "Balance",
              value: "$0",
              detail: "All caught up",
            },
            {
              title: "Lease term",
              value: "12 months",
              detail: "Ends Dec 2026",
            },
            {
              title: "Support",
              value: "24/7",
              detail: "Tap to reach us",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                {card.title}
              </p>
              <div className="mt-3 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                {card.value}
              </div>
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {card.detail}
              </div>
            </div>
          ))}
        </section>
      </main>

      <nav className="fixed bottom-4 left-1/2 z-20 w-[min(92%,420px)] -translate-x-1/2">
        <div className="grid grid-cols-4 items-center rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-xs font-medium text-zinc-600 shadow-2xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300">
          <button
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-zinc-950 transition hover:bg-zinc-900/5 dark:text-zinc-50 dark:hover:bg-zinc-50/10"
            aria-current="page"
          >
            <span className="flex h-6 w-6 items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M3 11.5 12 4l9 7.5" />
                <path d="M5 10.5V20h14v-9.5" />
              </svg>
            </span>
            Home
          </button>
          <button className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition hover:bg-zinc-900/5 dark:hover:bg-zinc-50/10">
            <span className="flex h-6 w-6 items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="5" y="4" width="14" height="16" rx="2" />
                <path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
            </span>
            Payments
          </button>
          <button className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition hover:bg-zinc-900/5 dark:hover:bg-zinc-50/10">
            <span className="flex h-6 w-6 items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 12h6l2 3 3-6 2 3h3" />
                <path d="M4 19h16" />
              </svg>
            </span>
            History
          </button>
          <button className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition hover:bg-zinc-900/5 dark:hover:bg-zinc-50/10">
            <span className="flex h-6 w-6 items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c2.5-3.5 13.5-3.5 16 0" />
              </svg>
            </span>
            Profile
          </button>
        </div>
      </nav>
    </div>
  );
}
