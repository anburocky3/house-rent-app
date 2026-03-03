"use client";

import { useState } from "react";
import LogoutButton from "../components/LogoutButton";
import CopyValueButton from "../components/CopyValueButton";
import PushNotificationSetup from "../components/PushNotificationSetup";
import TenantBottomNav from "./_components/TenantBottomNav";
import { useTenantDashboardData } from "./_hooks/useTenantDashboardData";
import { initiateUPIPayment } from "@/lib/upiPayment";
import { useToast } from "../components/Toast";

export default function TenantDashboard() {
  const {
    isAllowed,
    isCheckingAccess,
    tenantName,
    propertyDetails,
    ledgers,
    pendingLedger,
    tenants,
    ownerProfile,
    formatINR,
    toTelHref,
  } = useTenantDashboardData();

  const [paymentStatusMessage, setPaymentStatusMessage] = useState<
    string | null
  >(null);
  const toast = useToast();

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
  const initialMeterReading = propertyDetails?.initial_meter_reading ?? 0;
  const currentMeterReading = pendingLedger?.current_meter_reading ?? 0;
  const consumedUnits =
    currentMeterReading > 0 ? currentMeterReading - initialMeterReading : 0;
  const currentUnitCost = consumedUnits > 0 ? consumedUnits * unitPrice : 0;
  const hasCurrentReading =
    typeof pendingLedger?.current_meter_reading === "number" &&
    pendingLedger.current_meter_reading > 0;
  const hasElectricityTotal =
    typeof pendingLedger?.electricity_total === "number" &&
    pendingLedger.electricity_total > 0;
  const isElectricityBillNotAdded = !hasCurrentReading && !hasElectricityTotal;

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

  const getDueDateInfo = (monthYear?: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buildDaysText = (dueDate: Date) => {
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      const differenceInMs = due.getTime() - today.getTime();
      const dayCount = Math.ceil(differenceInMs / (1000 * 60 * 60 * 24));

      if (dayCount > 0) {
        return `${dayCount} day${dayCount === 1 ? "" : "s"} left`;
      }

      if (dayCount === 0) {
        return "Due today";
      }

      const overdueDays = Math.abs(dayCount);
      return `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`;
    };

    if (!monthYear) {
      const fallbackDueDate =
        today.getDate() <= 3
          ? new Date(today.getFullYear(), today.getMonth(), 3)
          : new Date(today.getFullYear(), today.getMonth() + 1, 3);

      return {
        label: "Due around 3rd of every month",
        daysText: buildDaysText(fallbackDueDate),
      };
    }

    const [monthName, yearValue] = monthYear.split(" ");
    const monthIndex = monthNames.findIndex((item) => item === monthName);
    const parsedYear = Number(yearValue);

    if (monthIndex < 0 || Number.isNaN(parsedYear)) {
      const fallbackDueDate =
        today.getDate() <= 3
          ? new Date(today.getFullYear(), today.getMonth(), 3)
          : new Date(today.getFullYear(), today.getMonth() + 1, 3);

      return {
        label: "Due around 3rd of every month",
        daysText: buildDaysText(fallbackDueDate),
      };
    }

    const dueMonthIndex = (monthIndex + 1) % 12;
    const dueYear = monthIndex === 11 ? parsedYear + 1 : parsedYear;
    const dueDate = new Date(dueYear, dueMonthIndex, 3);

    return {
      label: `Due on 03 ${monthNames[dueMonthIndex]} ${dueYear}`,
      daysText: buildDaysText(dueDate),
    };
  };

  const dueDateInfo = getDueDateInfo(pendingLedger?.month_year);
  const amountOwed = rentAmount + waterCost + currentUnitCost;
  const supportPhone =
    ownerProfile?.phone_number || ownerProfile?.emergency_contact?.phone;
  const today = new Date();
  const isUpiPaymentWindow = today.getDate() >= 1 && today.getDate() <= 3;
  const upiDaysLeft = isUpiPaymentWindow ? 3 - today.getDate() : null;
  const ownerUpiId =
    ownerProfile?.upi_id || process.env.NEXT_PUBLIC_OWNER_UPI_ID || "";

  // when we're outside the window, how many days until 1st of next available window
  const daysUntilWindow = !isUpiPaymentWindow
    ? today.getDate() > 3
      ? Math.ceil(
          (new Date(today.getFullYear(), today.getMonth() + 1, 1).getTime() -
            today.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 1 - today.getDate()
    : 0;

  // visual helpers
  const isOverdue = dueDateInfo.daysText.includes("overdue");
  const dueTextClass = isOverdue
    ? "text-red-600 dark:text-red-400"
    : dueDateInfo.daysText === "Due today"
      ? "text-orange-600 dark:text-orange-300"
      : "text-zinc-700 dark:text-zinc-200";
  const amountCardExtras = isOverdue
    ? "border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20"
    : "";

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-100 px-4 pb-24 pt-6 font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4">
        <section className="rounded-3xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-semibold tracking-tight">
              Hi, {tenantName}
            </p>
            <LogoutButton />
          </div>
          <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Know your rent details, payment history, and owner info.
          </p>
        </section>

        <section
          className={`rounded-3xl border p-5 text-zinc-50 shadow-lg dark:text-zinc-950 ${amountCardExtras} border-zinc-900 bg-zinc-950 dark:border-zinc-100 dark:bg-zinc-50`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
            Amount Owed
          </p>
          <p className="mt-3 text-5xl font-extrabold leading-none sm:text-6xl">
            {formatINR.format(amountOwed)}
          </p>
          <p
            className={`mt-3 wrap-break-word text-sm opacity-90 ${dueTextClass}`}
          >
            <span className="font-semibold ">{dueDateInfo.label}</span>{" "}
            <span>({dueDateInfo.daysText})</span>
          </p>
          {isUpiPaymentWindow && (
            <div className="mt-3 flex flex-col items-start gap-2 transition-opacity duration-300">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-600">
                  UPI ID:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-zinc-900 dark:text-zinc-500">
                    {ownerUpiId || "-"}
                  </span>
                  {ownerUpiId ? (
                    <CopyValueButton value={ownerUpiId} label="Owner UPI ID" />
                  ) : null}
                </div>
              </div>

              {upiDaysLeft !== null && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {upiDaysLeft === 0
                    ? "Last day to pay"
                    : `Ends in ${upiDaysLeft} day${upiDaysLeft > 1 ? "s" : ""}`}
                </p>
              )}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {isUpiPaymentWindow && ownerUpiId ? (
              <button
                type="button"
                onClick={() => {
                  setPaymentStatusMessage("Opening UPI app...");
                  toast.show("Redirecting to payment app…");
                  initiateUPIPayment({
                    upiAddress: ownerUpiId,
                    payeeName: ownerProfile?.full_name || "Owner",
                    amount: amountOwed,
                    transactionRef: `rent_${pendingLedger?.month_year?.replace(/\s+/g, "_") || "payment"}`,
                    description: "House rent payment",
                  });
                  setTimeout(() => setPaymentStatusMessage(null), 2500);
                }}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-zinc-50 px-4 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 hover:scale-[1.02] active:scale-95 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                Pay with UPI
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-zinc-400/50 px-4 text-sm font-bold text-zinc-300/90 opacity-70 dark:border-zinc-600 dark:text-zinc-500"
              >
                Pay with UPI
              </button>
            )}
            <div className="inline-flex min-h-12 items-center justify-center rounded-xl border border-zinc-300/50 px-4 text-center text-xs font-semibold leading-tight text-zinc-100 dark:border-zinc-700 dark:text-zinc-900">
              Cash payment can be marked by owner in app.
            </div>
          </div>

          {paymentStatusMessage && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {paymentStatusMessage}
            </p>
          )}

          {!isUpiPaymentWindow ? (
            <p className="mt-2 text-xs font-semibold opacity-80">
              UPI payment window is from 1st to 3rd of each month.
              {daysUntilWindow > 0
                ? ` (opens in ${daysUntilWindow} day${
                    daysUntilWindow > 1 ? "s" : ""
                  })`
                : ""}
            </p>
          ) : null}
        </section>

        <section className="grid grid-cols-1 gap-3">
          {isElectricityBillNotAdded ? (
            <article className="rounded-2xl border border-zinc-900 bg-zinc-50 p-4 shadow-sm dark:border-zinc-100 dark:bg-zinc-900">
              <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-zinc-950 dark:text-zinc-50">
                ⚠️ Eletricity bill is not added
              </p>
              <p className="mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Units are entered at month end. Payment can be made after that,
                with due date around the 3rd.
              </p>
            </article>
          ) : null}

          <article className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
              Rent due
            </p>
            <p className="mt-2 text-3xl font-extrabold text-zinc-950 dark:text-zinc-50">
              {formatINR.format(rentAmount)}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Monthly rent
            </p>
          </article>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                title: "Water cost",
                value: formatINR.format(waterCost),
                detail: "Fixed monthly charge",
              },
              {
                title: "Current unit cost",
                value: formatINR.format(currentUnitCost),
                detail: `${consumedUnits} units × ${formatINR.format(unitPrice)} / unit`,
              },
            ].map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
                  {card.title}
                </p>
                <p className="mt-2 text-2xl font-extrabold text-zinc-950 dark:text-zinc-50">
                  {card.value}
                </p>
                <p className="mt-1 wrap-break-word text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {card.detail}
                </p>
              </article>
            ))}
          </div>

          <article className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
              Electricity meter
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
                  Current reading
                </p>
                <p className="mt-2 text-2xl font-extrabold text-zinc-950 dark:text-zinc-50">
                  {currentMeterReading > 0 ? currentMeterReading : "—"}
                </p>
                <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Units
                </p>
              </div>
              <div className="rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
                  Units consumed
                </p>
                <p className="mt-2 text-2xl font-extrabold text-zinc-950 dark:text-zinc-50">
                  {consumedUnits > 0 ? consumedUnits : "—"}
                </p>
                <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  This month
                </p>
              </div>
            </div>
          </article>

          {ledgers.length > 0 ? (
            <article className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
                Meter history
              </p>
              <div className="mt-3 space-y-2">
                {ledgers
                  .filter(
                    (ledger) =>
                      ledger.current_meter_reading &&
                      ledger.current_meter_reading > 0,
                  )
                  .sort(
                    (a, b) =>
                      (b.updated_at?.toDate?.()?.getTime() ?? 0) -
                      (a.updated_at?.toDate?.()?.getTime() ?? 0),
                  )
                  .slice(0, 6)
                  .map((ledger) => {
                    const cur = ledger.current_meter_reading ?? 0;
                    const prev =
                      typeof ledger.prev_meter_reading === "number"
                        ? ledger.prev_meter_reading
                        : Math.max(0, cur - (ledger.units_consumed ?? 0));
                    const units =
                      typeof ledger.units_consumed === "number"
                        ? ledger.units_consumed
                        : Math.max(0, cur - prev);
                    const ledgerCost = units * unitPrice;

                    return (
                      <div
                        key={ledger.month_year}
                        className="flex items-center justify-between rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            {ledger.month_year}
                          </p>
                          <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            {`${prev} - ${cur} = ${units}`}
                          </p>
                        </div>
                        <div className="ml-2 text-right">
                          <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                            {formatINR.format(ledgerCost)}
                          </p>
                          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            for {units} unit{units === 1 ? "" : "s"}
                          </p>
                          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            {ledger.payment_status === "paid"
                              ? "✓ Paid"
                              : "Pending"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </article>
          ) : null}
        </section>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
            Tenant team
          </p>
          <div className="mt-3 grid gap-3">
            {tenants.length > 0 ? (
              tenants.map((tenant) => {
                const displayName = tenant.full_name || tenant.name || "Tenant";
                const tenantPhone = tenant.phone_number || "";
                const tenantAddress = `${tenant.permanent_address || ""}${tenant.pincode ? `, ${tenant.pincode}` : ""}`;
                return (
                  <article
                    key={tenant.uid || displayName}
                    className="rounded-2xl border border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <p className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                      {displayName}
                    </p>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {tenant.is_primary_tenant
                        ? "Primary tenant"
                        : "Co-tenant"}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                        <span aria-hidden="true">📞</span>
                        {tenantPhone ? (
                          <>
                            <a
                              href={`tel:${tenantPhone}`}
                              className="min-w-0 flex-1 truncate"
                            >
                              {tenantPhone}
                            </a>
                            <CopyValueButton
                              value={tenantPhone}
                              label={`${displayName} phone number`}
                            />
                          </>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                        <span aria-hidden="true">📅</span>
                        <span>
                          Entered on{" "}
                          {tenant.tenant_entered
                            ?.toDate?.()
                            ?.toLocaleDateString() || "-"}
                        </span>
                      </div>
                      <div className="col-span-2 flex min-w-0 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                        <span aria-hidden="true">🏠</span>
                        <span className="min-w-0 flex-1 truncate">
                          {tenantAddress || "-"}
                        </span>
                        {tenantAddress ? (
                          <CopyValueButton
                            value={tenantAddress}
                            label={`${displayName} address`}
                          />
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                No tenant records found for this property.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
            Owner support
          </p>
          <p className="mt-2 text-lg font-bold text-zinc-950 dark:text-zinc-50">
            {ownerProfile?.full_name || "Owner"}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <a
              href={supportPhone ? toTelHref(supportPhone) : "#"}
              aria-label="Call support"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-zinc-900 bg-zinc-950 px-4 text-base font-bold text-zinc-50 shadow-sm transition hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              📞 Call support
            </a>
            <a
              href={
                ownerProfile?.emergency_contact?.phone
                  ? toTelHref(ownerProfile.emergency_contact.phone)
                  : "#"
              }
              aria-label="Call emergency support"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 text-base font-bold text-zinc-950 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              ⚠️ Other help
            </a>
          </div>
          <div className="mt-3 space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
              <span aria-hidden="true">📞</span>
              <span className="min-w-0 flex-1 truncate">
                {supportPhone || "-"}
              </span>
              {supportPhone ? (
                <CopyValueButton
                  value={supportPhone}
                  label="owner support phone"
                />
              ) : null}
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
              <span aria-hidden="true">🏠</span>
              <span className="min-w-0 flex-1 truncate">
                {ownerProfile?.permanent_address || "-"}
              </span>
              {ownerProfile?.permanent_address ? (
                <CopyValueButton
                  value={ownerProfile.permanent_address}
                  label="owner address"
                />
              ) : null}
            </div>
          </div>
        </section>
      </main>
      <PushNotificationSetup />
      <TenantBottomNav />
    </div>
  );
}
