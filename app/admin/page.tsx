import LogoutButton from "../components/LogoutButton";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen px-6 pb-24 pt-14">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Admin dashboard
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-zinc-950 dark:text-zinc-50">
              Landlord overview
            </h1>
            <p className="mt-3 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
              Track rent collection, review tenant activity, and manage property
              alerts from one place.
            </p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
