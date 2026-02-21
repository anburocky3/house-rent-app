"use client";

import LogoutButton from "../../components/LogoutButton";
import CopyValueButton from "../../components/CopyValueButton";
import TenantBottomNav from "../_components/TenantBottomNav";
import { useTenantDashboardData } from "../_hooks/useTenantDashboardData";

export default function TenantOwnerPage() {
  const {
    isAllowed,
    isCheckingAccess,
    tenants,
    ownerProfile,
    propertyDetails,
    toTelHref,
  } = useTenantDashboardData();

  if (isCheckingAccess || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-sm text-zinc-600 dark:text-zinc-300">
        Verifying access...
      </div>
    );
  }

  const supportPhone =
    ownerProfile?.phone_number || ownerProfile?.emergency_contact?.phone;

  return (
    <div className="min-h-screen bg-zinc-100 px-4 pb-24 pt-6 font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4">
        <section className="rounded-3xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-semibold tracking-tight">
              Owner information
            </p>
            <LogoutButton />
          </div>
          <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Contact details and house rules.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-lg font-bold">
            {ownerProfile?.full_name || "Owner"}
          </p>
          <div className="mt-3 space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
              <span aria-hidden="true">📞</span>
              <a href={supportPhone ? toTelHref(supportPhone) : "#"}>
                {supportPhone || "-"}
              </a>
              {supportPhone ? (
                <CopyValueButton
                  value={supportPhone}
                  label="owner support phone"
                />
              ) : null}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
              <span aria-hidden="true">🏠</span>
              <span className="truncate">
                {ownerProfile?.permanent_address || "-"}
              </span>
              {ownerProfile?.permanent_address ? (
                <CopyValueButton
                  value={ownerProfile.permanent_address}
                  label="owner address"
                />
              ) : null}
            </div>
            <div className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] dark:border-zinc-800 dark:bg-zinc-950">
              Property ID: {propertyDetails?.property_id || "-"}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
            Rules and conditions
          </p>
          <ul className="mt-3 space-y-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            <li>• Pay rent on or before the due date every month.</li>
            <li>• Report maintenance issues through the Complaints page.</li>
            <li>• Keep common areas clean and avoid noise at night.</li>
            <li>• Inform owner before long travel or guest stay.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
            Tenant guardian contacts
          </p>

          <div className="mt-3 grid gap-3">
            {tenants.length === 0 ? (
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                No tenant records found.
              </p>
            ) : (
              tenants.map((tenant) => {
                const tenantName = tenant.full_name || tenant.name || "Tenant";
                const guardianName = tenant.guardian_info?.name || "-";
                const guardianRelation =
                  tenant.guardian_info?.relationship || "-";
                const guardianPhone = tenant.guardian_info?.phone || "";
                const guardianAddress = tenant.guardian_info?.address || "";

                return (
                  <article
                    key={tenant.uid || tenantName}
                    className="rounded-2xl border border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <p className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                      {tenantName}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                      Guardian: {guardianName} ({guardianRelation})
                    </p>

                    <div className="mt-3 space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                        <span aria-hidden="true">📞</span>
                        {guardianPhone ? (
                          <a href={toTelHref(guardianPhone)}>{guardianPhone}</a>
                        ) : (
                          <span>-</span>
                        )}
                        {guardianPhone ? (
                          <CopyValueButton
                            value={guardianPhone}
                            label={`${tenantName} guardian phone`}
                          />
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                        <span aria-hidden="true">🏠</span>
                        <span className="truncate">
                          {guardianAddress || "-"}
                        </span>
                        {guardianAddress ? (
                          <CopyValueButton
                            value={guardianAddress}
                            label={`${tenantName} guardian address`}
                          />
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>
      <TenantBottomNav />
    </div>
  );
}
