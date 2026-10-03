"use client";

import { useState } from "react";
import LogoutButton from "../components/LogoutButton";
import CopyValueButton from "../components/CopyValueButton";
import PushNotificationSetup from "../components/PushNotificationSetup";
import TenantBottomNav from "./_components/TenantBottomNav";
import { useTenantDashboardData } from "./_hooks/useTenantDashboardData";
import { initiateUPIPayment } from "@/lib/upiPayment";
import { useToast } from "../components/Toast";
import Avatar from "../components/Avatar";
import AccessLoader from "../components/AccessLoader";

const MeterIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      <path d="M18.156 16.314c-2.583 2.085-5.177 1.491-6.469 1.491s-1.373.262-2.321 1.27a1.3 1.3 0 0 1-.424.302a1.22 1.22 0 0 1-1.01 0a1.3 1.3 0 0 1-.433-.303l-2.594-2.568a1.3 1.3 0 0 1-.303-.454a1.3 1.3 0 0 1-.101-.514a1.23 1.23 0 0 1 .404-.937c1.009-.947 1.292-1.128 1.292-2.327c0-1.51-.717-4.372 2.24-7.334a7.4 7.4 0 0 1 2.523-1.662a7.5 7.5 0 0 1 3.028-.524a7.47 7.47 0 0 1 5.45 2.61a7.52 7.52 0 0 1 .8 8.662a7.5 7.5 0 0 1-2.051 2.288zm-13.554-.01l-1.514 1.511a1.01 1.01 0 0 0-.202 1.26l2.11 2.014c.282.292.847.172 1.291-.242l1.423-1.52" />
      <path d="m15.248 5.873l-5.063 4.273a.3.3 0 0 0-.094.12a.4.4 0 0 0-.036.155a.3.3 0 0 0 .067.136a.3.3 0 0 0 .134.031l2.913.68l-1.26 3.382a.14.14 0 0 0-.014.063l.052.012l.062.014l5.063-4.273a.22.22 0 0 0 .212-.114a.3.3 0 0 0 .037-.155a.3.3 0 0 0-.067-.136a.3.3 0 0 0-.135-.031l-2.902-.677l1.172-3.338a.07.07 0 0 0 .015-.062l-.063-.014z" />
    </g>
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
    <path
      d="M7 4h3l1.5 4-2 1.5a14 14 0 0 0 5 5L16 12l4 1.5v3c0 1-.8 1.8-1.8 1.8C10.4 18.3 5.7 13.6 5.7 5.8 5.7 4.8 6.3 4 7 4Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
    <rect
      x="4"
      y="5"
      width="16"
      height="15"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <path
      d="M8 3v4m8-4v4M4 9h16"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
    <path
      d="m4 11 8-6 8 6v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);
export default function TenantDashboard() {
  const {
    isAllowed,
    isCheckingAccess,
    tenantName,
    tenantPhotoUrl,
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

  const rentAmount = propertyDetails?.rent_amount ?? 0;
  const waterCost = propertyDetails?.water_charge ?? 0;
  const unitPrice = propertyDetails?.electricity_rate ?? 0;
  const currentMonthUnits = pendingLedger?.units_consumed ?? 0;
  const currentUnitCost =
    typeof pendingLedger?.electricity_total === "number" &&
    pendingLedger.electricity_total > 0
      ? pendingLedger.electricity_total
      : currentMonthUnits > 0
        ? currentMonthUnits * unitPrice
        : 0;
  const hasCurrentReading =
    typeof pendingLedger?.current_meter_reading === "number" &&
    pendingLedger.current_meter_reading > 0;
  const hasElectricityTotal =
    typeof pendingLedger?.electricity_total === "number" &&
    pendingLedger.electricity_total > 0;
  const isElectricityBillNotAdded =
    Boolean(pendingLedger) && !hasCurrentReading && !hasElectricityTotal;

  const latestLedger = [...ledgers].sort(
    (first, second) =>
      (second.updated_at?.toDate?.()?.getTime() ?? 0) -
      (first.updated_at?.toDate?.()?.getTime() ?? 0),
  )[0];
  const latestLedgerWithReading = [...ledgers]
    .filter(
      (ledger) =>
        typeof ledger.current_meter_reading === "number" &&
        Number.isFinite(ledger.current_meter_reading),
    )
    .sort(
      (first, second) =>
        (second.updated_at?.toDate?.()?.getTime() ?? 0) -
        (first.updated_at?.toDate?.()?.getTime() ?? 0),
    )[0];
  const currentMeterReading =
    pendingLedger?.current_meter_reading ??
    latestLedgerWithReading?.current_meter_reading ??
    propertyDetails?.initial_meter_reading;
  const hasPendingLedger = Boolean(pendingLedger);
  const isLatestLedgerPaid =
    !hasPendingLedger &&
    (latestLedger?.payment_status || "").toLowerCase() === "paid";

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

  const toStartOfDay = (value: Date) => {
    const next = new Date(value);
    next.setHours(0, 0, 0, 0);
    return next;
  };

  const getDayCountFromDate = (targetDate: Date) => {
    const todayStart = toStartOfDay(new Date());
    const dueStart = toStartOfDay(targetDate);
    const differenceInMs = dueStart.getTime() - todayStart.getTime();
    return Math.ceil(differenceInMs / (1000 * 60 * 60 * 24));
  };

  const getDaysTextFromDayCount = (dayCount: number) => {
    if (dayCount > 0) {
      return `${dayCount} day${dayCount === 1 ? "" : "s"} left`;
    }

    if (dayCount === 0) {
      return "Due today";
    }

    const overdueDays = Math.abs(dayCount);
    return `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`;
  };

  const parseDueDateFromMonthYear = (monthYear?: string) => {
    const today = new Date();
    if (!monthYear) {
      return new Date(today.getFullYear(), today.getMonth(), 3);
    }

    const [monthName, yearValue] = monthYear.split(" ");
    const monthIndex = monthNames.findIndex((item) => item === monthName);
    const parsedYear = Number(yearValue);
    if (monthIndex < 0 || Number.isNaN(parsedYear)) {
      return new Date(today.getFullYear(), today.getMonth(), 3);
    }

    return new Date(parsedYear, monthIndex, 3);
  };

  const getUpcomingMonthlyDue = () => {
    const today = toStartOfDay(new Date());
    let dueDate = new Date(today.getFullYear(), today.getMonth(), 3);

    if (today.getTime() > dueDate.getTime()) {
      dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 3);
    }

    const dayCount = getDayCountFromDate(dueDate);
    return {
      label: `Upcoming due on 03 ${monthNames[dueDate.getMonth()]} ${dueDate.getFullYear()}`,
      daysText: getDaysTextFromDayCount(dayCount),
    };
  };

  const getDueDateInfo = (monthYear?: string) => {
    const dueDate = parseDueDateFromMonthYear(monthYear);
    const dayCount = getDayCountFromDate(dueDate);

    return {
      label: `Due on 03 ${monthNames[dueDate.getMonth()]} ${dueDate.getFullYear()}`,
      daysText: getDaysTextFromDayCount(dayCount),
      dayCount,
    };
  };

  const pendingDueDate = hasPendingLedger
    ? parseDueDateFromMonthYear(pendingLedger?.month_year)
    : null;
  const pendingDueDayCount = pendingDueDate
    ? getDayCountFromDate(pendingDueDate)
    : null;
  const shouldShowPaymentAgreement =
    hasPendingLedger && pendingDueDayCount !== null && pendingDueDayCount <= 0;
  const upcomingMonthlyDue = getUpcomingMonthlyDue();

  const dueDateInfo = isLatestLedgerPaid
    ? {
        label: `Paid for ${latestLedger?.month_year || "current cycle"}`,
        daysText: latestLedger?.paid_at?.toDate
          ? `Paid on ${latestLedger.paid_at.toDate().toLocaleDateString()}`
          : "Payment received",
        dayCount: null,
      }
    : getDueDateInfo(pendingLedger?.month_year);
  const amountOwed = hasPendingLedger
    ? rentAmount + waterCost + currentUnitCost
    : 0;
  const supportPhone =
    ownerProfile?.phone_number || ownerProfile?.emergency_contact?.phone;
  const today = new Date();
  const isUpiPaymentWindow = today.getDate() >= 1 && today.getDate() <= 3;
  const upiDaysLeft = isUpiPaymentWindow ? 3 - today.getDate() : null;
  const ownerUpiId =
    ownerProfile?.upi_id || process.env.NEXT_PUBLIC_OWNER_UPI_ID || "";

  // visual helpers
  const isOverdue =
    hasPendingLedger && typeof dueDateInfo.dayCount === "number"
      ? dueDateInfo.dayCount < 0
      : false;
  const dueTextClass = isOverdue
    ? "text-red-600 dark:text-red-400"
    : dueDateInfo.daysText === "Due today"
      ? "text-orange-600 dark:text-orange-300"
      : "text-zinc-700 dark:text-zinc-600";
  const amountCardExtras = isOverdue
    ? "border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20"
    : "";
  const canPayWithUpi = Boolean(ownerUpiId && pendingLedger && amountOwed > 0);
  const upiButtonLabel = isOverdue ? "Pay overdue with UPI" : "Pay with UPI";
  const lateFeeNotice = hasPendingLedger
    ? isOverdue
      ? "Late payment agreement: if the bill is not paid by the 5rd of the month, a daily late fee or interest may apply until the full amount is cleared."
      : "Payment agreement: rent should be paid on or before the 3rd of each month to avoid any late fee or interest."
    : "No pending rent due right now. The last billing cycle is already marked as paid in billing ledger.";

  return (
    <div className="app-surface min-h-screen overflow-x-hidden px-4 pb-28 pt-5 font-sans text-[#1b1f1d]">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4">
        <section className="app-card rounded-[1.75rem] p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={tenantName} src={tenantPhotoUrl} size="md" />
              <div>
                <p className="app-label">Resident dashboard</p>
                <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">
                  Hi, {tenantName}
                </p>
              </div>
            </div>
            <LogoutButton />
          </div>
          <p className="mt-2 text-sm text-[#718078]">
            Your rent, payments, and home details in one place.
          </p>
        </section>

        {shouldShowPaymentAgreement ? (
          <section className="rounded-3xl border border-amber-300 bg-amber-50 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-950/20">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-300">
              Payment agreement
            </p>
            <p className="mt-2 text-sm font-medium text-amber-950 dark:text-amber-100">
              {lateFeeNotice}
            </p>
          </section>
        ) : null}

        <section
          className={`rounded-3xl border p-5 text-zinc-50 shadow-lg dark:text-zinc-950 ${amountCardExtras} border-zinc-900 bg-zinc-950 dark:border-zinc-100 dark:bg-zinc-50`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
            Amount Owed
          </p>
          <p className="mt-3 text-5xl font-extrabold leading-none sm:text-6xl dark:text-zinc-950">
            {formatINR.format(amountOwed)}
          </p>
          <p
            className={`mt-3 wrap-break-word text-sm opacity-90 ${dueTextClass}`}
          >
            <span className="font-semibold ">{dueDateInfo.label}</span>{" "}
            <span>({dueDateInfo.daysText})</span>
          </p>
          {!hasPendingLedger ? (
            <p className="mt-1 text-xs text-zinc-300 dark:text-zinc-700">
              <span className="font-semibold">{upcomingMonthlyDue.label}</span>{" "}
              <span>({upcomingMonthlyDue.daysText})</span>
            </p>
          ) : null}
          {isUpiPaymentWindow && (
            <div className="mt-3 flex flex-col items-start gap-2 transition-opacity duration-300">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-600">
                  UPI ID:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-white dark:text-zinc-500">
                    {ownerUpiId || "-"}
                  </span>
                  {ownerUpiId ? (
                    <CopyValueButton
                      value={ownerUpiId}
                      label="Owner UPI ID"
                      className="bg-zinc-800 dark:bg-zinc-600 text-zinc-100!  hover:bg-zinc-700"
                    />
                  ) : null}
                </div>
              </div>

              {upiDaysLeft !== null && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {upiDaysLeft === 0
                    ? "Last day to pay"
                    : `Ends in ${upiDaysLeft} day${upiDaysLeft > 1 ? "s" : ""}`}
                </p>
              )}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {canPayWithUpi ? (
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
                {upiButtonLabel}
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
              {!hasPendingLedger
                ? "No pending dues at the moment."
                : isOverdue
                  ? "This bill is overdue. You can still pay now."
                  : "UPI payment window is from 1st to 3rd of each month."}
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
                detail: `${currentMonthUnits} units × ${formatINR.format(unitPrice)} / unit`,
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
                  {typeof currentMeterReading === "number"
                    ? currentMeterReading
                    : "—"}
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
                  {currentMonthUnits > 0 ? currentMonthUnits : "—"}
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
                        className="flex items-center gap-3 rounded-2xl border border-[#dce9f6] bg-[#f7fbff] p-3.5 transition hover:border-[#a8cef4] dark:border-[#29435e] dark:bg-[#10243a] dark:hover:border-[#477ba8]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf3fc] text-[#2f80ed] dark:bg-[#173452] dark:text-[#a7d1ff]">
                          <MeterIcon />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#122030] dark:text-[#f0f7ff]">
                            {ledger.month_year}
                          </p>
                          <p className="mt-1 text-xs font-medium text-[#68809a] dark:text-[#9bb7d1]">
                            {`${prev} - ${cur} = ${units}`}
                          </p>
                        </div>
                        <div className="ml-2 text-right">
                          <p className="text-base font-extrabold text-[#122030] dark:text-[#f0f7ff]">
                            {formatINR.format(ledgerCost)}
                          </p>
                          <p className="text-[11px] font-medium text-[#68809a] dark:text-[#9bb7d1]">
                            for {units} unit{units === 1 ? "" : "s"}
                          </p>
                          <span
                            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${ledger.payment_status === "paid" ? "bg-[#e5f7ef] text-[#16805a] dark:bg-[#123e35] dark:text-[#79dfb5]" : "bg-[#fff4d9] text-[#9a6712] dark:bg-[#4c3b19] dark:text-[#ffd88a]"}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {ledger.payment_status === "paid"
                              ? "Paid"
                              : "Pending"}
                          </span>
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
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={displayName}
                        src={tenant.profile_photo_url}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-zinc-950 dark:text-zinc-50">
                          {displayName}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-[#68809a] dark:text-[#9bb7d1]">
                          {tenant.is_primary_tenant
                            ? "Primary tenant"
                            : "Co-tenant"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                        <PhoneIcon />
                        {tenantPhone ? (
                          <>
                            <a
                              href={`tel:${tenantPhone}`}
                              className="min-w-0 flex-1 truncate"
                            >
                              {tenantPhone}
                            </a>
                            {/* <CopyValueButton
                              value={tenantPhone}
                              label={`${displayName} phone number`}
                            /> */}
                          </>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                        <CalendarIcon />
                        <span>
                          Entered on{" "}
                          {tenant.tenant_entered
                            ?.toDate?.()
                            ?.toLocaleDateString() || "-"}
                        </span>
                      </div>
                      <div className="col-span-2 flex min-w-0 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                        <HomeIcon />
                        <span className="min-w-0 flex-1 truncate">
                          {tenantAddress || "-"}
                        </span>
                        {/* {tenantAddress ? (
                          <CopyValueButton
                            value={tenantAddress}
                            label={`${displayName} address`}
                          />
                        ) : null} */}
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
