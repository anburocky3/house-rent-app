"use client";

import LogoutButton from "../../components/LogoutButton";
import TenantBottomNav from "../_components/TenantBottomNav";
import { useTenantDashboardData } from "../_hooks/useTenantDashboardData";

export default function TenantHistoryPage() {
  const { isAllowed, isCheckingAccess, ledgers, propertyDetails, formatINR } =
    useTenantDashboardData();

  if (isCheckingAccess || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-sm text-zinc-600 dark:text-zinc-300">
        Verifying access...
      </div>
    );
  }

  const rentAmount = propertyDetails?.rent_amount ?? 0;
  const waterCost = propertyDetails?.water_charge ?? 0;
  const unitPrice = propertyDetails?.electricity_rate ?? 0;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getDueDateLabel = (monthYear?: string) => {
    if (!monthYear) {
      return "Around 3rd of every month";
    }

    const [monthName, yearValue] = monthYear.split(" ");
    const monthIndex = monthNames.findIndex((item) => item === monthName);
    const parsedYear = Number(yearValue);

    if (monthIndex < 0 || Number.isNaN(parsedYear)) {
      return "Around 3rd of every month";
    }

    const dueMonthIndex = (monthIndex + 1) % 12;
    const dueYear = monthIndex === 11 ? parsedYear + 1 : parsedYear;
    return `03 ${monthNames[dueMonthIndex]} ${dueYear}`;
  };

  const history = [...ledgers].sort((first, second) => {
    const firstTime = first.updated_at?.toDate?.()?.getTime() ?? 0;
    const secondTime = second.updated_at?.toDate?.()?.getTime() ?? 0;
    return secondTime - firstTime;
  });

  return (
    <div className="min-h-screen bg-zinc-100 px-4 pb-24 pt-6 font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4">
        <section className="rounded-3xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-semibold tracking-tight">
              Rent history
            </p>
            <LogoutButton />
          </div>
          <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Monthly payment records with rent, water, and current charges.
          </p>
        </section>

        {history.length === 0 ? (
          <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              No history available yet.
            </p>
          </section>
        ) : (
          history.map((entry, index) => {
            const previousUnit = entry.prev_meter_reading ?? 0;
            const currentUnit = entry.current_meter_reading ?? 0;
            const consumedUnits = Math.max(currentUnit - previousUnit, 0);
            const currentCharge =
              consumedUnits > 0
                ? consumedUnits * unitPrice
                : (entry.electricity_total ?? 0);

            return (
              <section
                key={`${entry.month_year || "month"}-${entry.updated_at?.toDate?.()?.toISOString?.() || index}`}
                className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                    {entry.month_year || "Billing month"}
                  </p>
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {entry.payment_status || "pending"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  <p>Rent: {formatINR.format(rentAmount)}</p>
                  <p>Water: {formatINR.format(waterCost)}</p>
                  <p>
                    Current charge: {formatINR.format(currentCharge)} (
                    {consumedUnits} units)
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Due date (around): {getDueDateLabel(entry.month_year)}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Payment date:{" "}
                    {entry.paid_at?.toDate?.()?.toLocaleDateString() ||
                      "Not paid yet"}
                  </p>
                </div>
              </section>
            );
          })
        )}
      </main>
      <TenantBottomNav />
    </div>
  );
}
