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
                  <span
                    className={`text-xs font-semibold uppercase ${entry.payment_status === "paid" ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}
                    title={
                      entry.paid_at
                        ? `Paid on ${entry.paid_at
                            .toDate?.()
                            .toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}  (${entry.paid_at
                            .toDate?.()
                            ?.toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })})`
                        : undefined
                    }
                  >
                    {entry.payment_status || "pending"}
                  </span>
                </div>
                <div className="mt-3 text-sm text-zinc-800 dark:text-zinc-200">
                  <table className="w-full border-collapse">
                    <tbody className="font-semibold">
                      <tr className="">
                        <td className="py-2 pr-2">Rent:</td>
                        <td className="py-2 text-right">
                          {formatINR.format(rentAmount)}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="py-2 pr-2">Water:</td>
                        <td className="py-2 text-right">
                          {formatINR.format(waterCost)}
                        </td>
                      </tr>
                      <tr className="">
                        <td className="py-2 pr-2">Current charge:</td>
                        <td className="py-2 text-right">
                          {formatINR.format(currentCharge)} <br />
                          <small className="text-xs text-zinc-500 dark:text-zinc-400">
                            {consumedUnits} units
                          </small>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="h-1"></td>
                      </tr>
                      <tr className="bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40 rounded-lg">
                        <td className="py-0.5 px-2 font-bold text-blue-900 dark:text-blue-200">
                          Total Due:
                        </td>
                        <td className="py-1 text-right font-bold text-lg text-blue-600 dark:text-blue-400 pr-2">
                          {formatINR.format(
                            rentAmount + waterCost + currentCharge,
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <p>
                      Due date (around): {getDueDateLabel(entry.month_year)}
                      {entry.payment_status === "paid" && entry.paid_at ? (
                        <span>
                          {" | Paid on "}
                          {entry.paid_at
                            ?.toDate?.()
                            .toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          {" at "}
                          {entry.paid_at
                            ?.toDate?.()
                            .toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                        </span>
                      ) : null}
                    </p>
                  </div>
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
