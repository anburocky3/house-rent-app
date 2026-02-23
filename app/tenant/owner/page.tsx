"use client";

import { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import LogoutButton from "../../components/LogoutButton";
import CopyValueButton from "../../components/CopyValueButton";
import TenantBottomNav from "../_components/TenantBottomNav";
import BeforeHandoverSlider from "../_components/BeforeHandoverSlider";
import { useTenantDashboardData } from "../_hooks/useTenantDashboardData";
import { db } from "../../../firebaseConfig";

type ContentItem = {
  id?: number;
  title?: string;
  description?: string;
};

type DisplayItem = {
  title: string;
  description: string;
};

const toDisplayItems = (value?: string | ContentItem[]) => {
  if (!value) {
    return [] as DisplayItem[];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        return {
          title: item.title?.trim() || "",
          description: item.description?.trim() || "",
        };
      })
      .filter((item) => item.title || item.description);
  }

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        return { title: "", description: line };
      }

      const title = line.slice(0, separatorIndex).trim();
      const description = line.slice(separatorIndex + 1).trim();
      return { title, description };
    });
};

export default function TenantOwnerPage() {
  const {
    isAllowed,
    isCheckingAccess,
    tenantUid,
    tenants,
    ownerProfile,
    propertyDetails,
    toTelHref,
  } = useTenantDashboardData();
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [isSubmittingAcceptance, setIsSubmittingAcceptance] = useState(false);
  const [acceptedNowAt, setAcceptedNowAt] = useState<Date | null>(null);

  if (isCheckingAccess || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-sm text-zinc-600 dark:text-zinc-300">
        Verifying access...
      </div>
    );
  }

  const supportPhone =
    ownerProfile?.phone_number || ownerProfile?.emergency_contact?.phone;
  const propertyContactPhone = propertyDetails?.contact_person?.phone;
  const propertySupportPhone = propertyContactPhone || supportPhone;
  const termsItems = toDisplayItems(propertyDetails?.terms_and_conditions);
  const scheduleItems = toDisplayItems(propertyDetails?.schedule_of_property);
  const fittingsItems = toDisplayItems(propertyDetails?.fitting_and_fixtures);
  const currentTenant = tenants.find((tenant) => tenant.uid === tenantUid);
  const hasAcceptedTerms =
    Boolean(currentTenant?.terms_acceptance?.accepted) ||
    Boolean(acceptedNowAt);
  const acceptedAtDate =
    acceptedNowAt ||
    currentTenant?.terms_acceptance?.accepted_at?.toDate?.() ||
    null;

  const handleAcceptTerms = async () => {
    if (!tenantUid || hasAcceptedTerms || !confirmChecked) {
      return;
    }

    setIsSubmittingAcceptance(true);
    try {
      await setDoc(
        doc(db, "users", tenantUid),
        {
          terms_acceptance: {
            accepted: true,
            accepted_at: serverTimestamp(),
            version: "v1_2026_02_21",
          },
          updated_at: serverTimestamp(),
        },
        { merge: true },
      );
      setAcceptedNowAt(new Date());
      setConfirmChecked(false);
    } finally {
      setIsSubmittingAcceptance(false);
    }
  };

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

        <BeforeHandoverSlider
          propertyId={propertyDetails?.property_id}
          imageUrls={propertyDetails?.before_handover_images}
        />

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">
              {ownerProfile?.full_name || "Owner"}
            </span>
            <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs">
              {propertyDetails?.property_id || "-"}
            </span>
          </div>
          <div className="mt-3 space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950 font-light">
              <span aria-hidden="true">📞</span>
              <a
                href={
                  propertySupportPhone ? toTelHref(propertySupportPhone) : "#"
                }
              >
                {propertySupportPhone || "-"}
              </a>

              <span className="font-light text-sm italic">
                (
                {propertyDetails?.contact_person?.name ||
                  ownerProfile?.full_name ||
                  "-"}
                )
              </span>
              {propertySupportPhone ? (
                <CopyValueButton
                  value={propertySupportPhone}
                  label="owner support phone"
                />
              ) : null}
            </div>
            <div className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
                Property nickname
              </p>
              <p className="mt-1 font-light">
                {propertyDetails?.property_nickname || "-"}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
              <span aria-hidden="true">🏠</span>
              <span className="truncate font-light">
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

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
            Rules and conditions
          </p>

          <div className="mt-3 space-y-3 text-sm text-zinc-800 dark:text-zinc-200">
            <div className="rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
              {termsItems.length > 0 ? (
                <ol className="list-decimal space-y-2 pl-5 text-sm font-base leading-relaxed">
                  {termsItems.map((item, index) => (
                    <li key={`${item.title}-${item.description}-${index}`}>
                      {item.title ? (
                        <span className="font-semibold">{item.title}:</span>
                      ) : null}{" "}
                      <span className="font-light">{item.description}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-300">
                  Terms and conditions are not available yet.
                </p>
              )}
            </div>

            {scheduleItems.length > 0 && (
              <div className="rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                  📍 Schedule of Property
                </p>
                <div className="mt-2 space-y-1 text-sm leading-relaxed">
                  {scheduleItems.map((item, index) => (
                    <p key={`${item.title}-${item.description}-${index}`}>
                      {item.title ? (
                        <span className="font-semibold">{item.title}:</span>
                      ) : null}{" "}
                      <span className="font-light">{item.description}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {fittingsItems.length > 0 && (
              <div className="rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                  🛠️ Fittings & Fixtures
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-medium leading-relaxed">
                  {fittingsItems.map((item, index) => (
                    <li key={`${item.title}-${item.description}-${index}`}>
                      {item.title ? (
                        <span className="font-semibold">{item.title}:</span>
                      ) : null}{" "}
                      <span className="font-light">{item.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
            Agreement acceptance
          </p>

          {hasAcceptedTerms ? (
            <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-3 text-sm font-semibold text-green-700 dark:border-green-700/40 dark:bg-green-950/40 dark:text-green-300">
              ✅ Terms accepted
              {acceptedAtDate ? (
                <span className="block text-xs font-medium text-green-700/80 dark:text-green-300/80">
                  Accepted on {acceptedAtDate.toLocaleDateString("en-IN")}
                </span>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <label className="flex items-start gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(event) => setConfirmChecked(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700"
                />
                <span className="font-light">
                  I have read and accept the above terms and conditions as a
                  digital agreement.
                </span>
              </label>

              <button
                type="button"
                onClick={handleAcceptTerms}
                disabled={!confirmChecked || isSubmittingAcceptance}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-bold text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                {isSubmittingAcceptance
                  ? "Submitting..."
                  : "Accept Terms & Conditions"}
              </button>
            </div>
          )}
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
                        <span className="">{guardianAddress || "-"}</span>
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
