"use client";

import { useState } from "react";
import LogoutButton from "../../components/LogoutButton";
import AdminBottomNav from "../_components/AdminBottomNav";
import { useAdminDashboardData } from "../_hooks/useAdminData";
import type {
  BillingLedgerSummary,
  PropertySummary,
} from "../_hooks/useAdminData";

export default function AdminPaymentsPage() {
  const {
    isAllowed,
    isCheckingAccess,
    isLoadingData,
    properties,
    latestLedgerByProperty,
    markPaymentAsPaid,
  } = useAdminDashboardData();

  const [markingPaymentId, setMarkingPaymentId] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  if (isCheckingAccess || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-sm text-zinc-600 dark:text-zinc-300">
        Verifying access...
      </div>
    );
  }

  const handleMarkAsPaid = async (
    ledgerId: string,
    paymentMethod: "online" | "offline",
  ) => {
    setMarkingPaymentId(ledgerId);
    const result = await markPaymentAsPaid(ledgerId, paymentMethod);
    setStatusMessage({
      type: result.success ? "success" : "error",
      message: result.message,
    });
    setMarkingPaymentId("");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Group ledgers by property and filter for pending payments
  const paymentsByProperty = properties.reduce(
    (acc, property) => {
      const ledger = latestLedgerByProperty[property.id];
      if (ledger && ledger.payment_status !== "paid") {
        if (!acc[property.id]) {
          acc[property.id] = { property, ledgers: [] };
        }
        acc[property.id].ledgers.push(ledger);
      }
      return acc;
    },
    {} as Record<
      string,
      {
        property: PropertySummary;
        ledgers: BillingLedgerSummary[];
      }
    >,
  );

  const pendingPaymentsCount = Object.values(paymentsByProperty).reduce(
    (total, item) => total + item.ledgers.length,
    0,
  );

  return (
    <div className="min-h-screen bg-zinc-100 px-4 pb-24 pt-6 font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4">
        <section className="rounded-3xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Manage Payments
              </p>
              <p className="mt-2 text-base font-semibold tracking-tight">
                Mark payments as received
              </p>
            </div>
            <LogoutButton />
          </div>
          <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            When tenants pay offline or via UPI, mark them as received here to
            notify the tenant.
          </p>
        </section>

        {statusMessage && (
          <div
            className={`rounded-2xl border p-3 text-sm font-semibold ${
              statusMessage.type === "success"
                ? "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300"
                : "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300"
            }`}
          >
            {statusMessage.type === "success" ? "✓ " : "✗ "}
            {statusMessage.message}
          </div>
        )}

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
              Pending Payments
            </p>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              {pendingPaymentsCount}
            </span>
          </div>

          {isLoadingData ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
              Loading payments...
            </p>
          ) : pendingPaymentsCount === 0 ? (
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              All payments are marked as received! ✓
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {Object.values(paymentsByProperty).map(({ property, ledgers }) =>
                ledgers.map((ledger) => (
                  <article
                    key={ledger.id}
                    className="rounded-2xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {property.property_nickname || property.id}
                        </p>
                        <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          {ledger.month_year || "Billing month unknown"}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Status:{" "}
                          <span className="text-amber-600 dark:text-amber-400">
                            {ledger.payment_status || "pending"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={markingPaymentId === ledger.id}
                        onClick={() => handleMarkAsPaid(ledger.id, "offline")}
                        className="flex-1 rounded-xl border border-zinc-900 bg-zinc-950 px-3 py-2 text-xs font-bold text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-100 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                      >
                        {markingPaymentId === ledger.id
                          ? "Marking..."
                          : "Mark as Paid (Offline)"}
                      </button>
                      <button
                        type="button"
                        disabled={markingPaymentId === ledger.id}
                        onClick={() => handleMarkAsPaid(ledger.id, "online")}
                        className="flex-1 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                      >
                        {markingPaymentId === ledger.id
                          ? "Marking..."
                          : "Mark as Paid (UPI)"}
                      </button>
                    </div>
                  </article>
                )),
              )}
            </div>
          )}
        </section>
      </main>
      <AdminBottomNav />
    </div>
  );
}
