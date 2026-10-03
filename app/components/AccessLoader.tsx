type AccessLoaderProps = {
  label?: string;
};

export default function AccessLoader({
  label = "Securing your session",
}: AccessLoaderProps) {
  return (
    <main className="app-surface flex min-h-screen items-center justify-center px-6">
      <section className="flex w-full max-w-xs flex-col items-center text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span className="access-loader-orbit absolute inset-0 rounded-full border border-[#b9d9fb] dark:border-[#31516e]" />
          <span className="access-loader-orbit access-loader-orbit-delayed absolute inset-2 rounded-full border border-[#d8eaff] dark:border-[#416887]" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2f80ed] text-white shadow-[0_10px_26px_rgba(47,128,237,0.28)]">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m4 11 8-6 8 6v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M9 20v-5h6v5M8 11h.01M12 11h.01M16 11h.01"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </div>
        <p className="mt-6 text-sm font-bold tracking-tight text-[#122030] dark:text-[#f0f7ff]">
          {label}
        </p>
        <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
          <span className="access-loader-dot" />
          <span className="access-loader-dot access-loader-dot-delay-1" />
          <span className="access-loader-dot access-loader-dot-delay-2" />
        </div>
      </section>
    </main>
  );
}
