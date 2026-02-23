"use client";

import { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import LogoutButton from "../../components/LogoutButton";
import CopyValueButton from "../../components/CopyValueButton";
import TenantBottomNav from "../_components/TenantBottomNav";
import BeforeHandoverSlider from "../_components/BeforeHandoverSlider";
import { useTenantDashboardData } from "../_hooks/useTenantDashboardData";
import { db } from "../../../firebaseConfig";

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

        <BeforeHandoverSlider propertyId={propertyDetails?.property_id} />

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
              Property ID:{" "}
              <span className="bg-zinc-800 px-2 py-0.5 rounded">
                {propertyDetails?.property_id || "-"}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
            Rules and conditions
          </p>

          <div className="mt-3 space-y-3 text-sm text-zinc-800 dark:text-zinc-200">
            <div className="rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
              <ol className="list-decimal space-y-2 pl-5 text-sm font-base leading-relaxed">
                <li>
                  <span className="font-semibold">Rent:</span> ₹7,000 per month,
                  payable on or before 5th of every month.
                </li>
                <li>
                  <span className="font-semibold">Water charges:</span> ₹200
                  fixed per month along with rent.
                </li>
                <li>
                  <span className="font-semibold">Electricity charges:</span> ₹6
                  per unit as per sub-meter reading.
                </li>
                <li>
                  <span className="font-semibold">Deposit:</span> ₹15,000
                  security deposit, refundable at vacating without interest
                  after arrears/ damages adjustment.
                </li>
                <li>
                  <span className="font-semibold">Period:</span> 11 months from
                  agreement date.
                </li>
                <li>
                  <span className="font-semibold">Occupancy & use:</span>
                  Residential only, maximum 3 bachelors, no subletting.
                </li>
                <li>
                  <span className="font-semibold">Inspection & keys:</span>
                  Landlord/authorized representative may inspect at reasonable
                  times.
                </li>
                <li>
                  <span className="font-semibold">
                    Additions & alterations:
                  </span>
                  Not allowed without written landlord permission; no
                  subletting.
                </li>
                <li>
                  <span className="font-semibold">
                    Cleanliness & maintenance:
                  </span>
                  Keep premises clean and tenantable; interior repainting
                  required while vacating; restoration cost can be deducted from
                  deposit.
                </li>
                <li>
                  <span className="font-semibold">Default of rent:</span> If
                  rent is unpaid for two consecutive months, landlord may evict
                  without prior notice.
                </li>
                <li>
                  <span className="font-semibold">Renewal & increase:</span> For
                  renewal after 11 months, rent increases by 5% by mutual
                  agreement.
                </li>
                <li>
                  <span className="font-semibold">Arrears & damages:</span> Any
                  arrears, breakages, or damages will be deducted from deposit.
                </li>
                <li>
                  <span className="font-semibold">Interior painting:</span>{" "}
                  Return premises in freshly painted condition or equivalent
                  painting and labor charges will be deducted from deposit.
                </li>
                <li>
                  <span className="font-semibold">Notice:</span> One month
                  written advance notice required from either party for
                  termination.
                </li>
              </ol>
            </div>

            <div className="rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                📍 Schedule of Property
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed">
                No. 32, Second Street, Ramalingapuram, Kamaraj Nagar, Avadi,
                Chennai - 600071.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                🛠️ Fittings & Fixtures
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-medium leading-relaxed">
                <li>LED Tubelight: 3 Nos.</li>
                <li>LED Bulb: 5 Nos.</li>
                <li>Night Light Bulb: 2 Nos.</li>
                <li>Exhaust Fan: 1 No.</li>
                <li>Calling Bell: 1 No.</li>
                <li>
                  Interior Painting (Walls, Window, Doors, Grills): Freshly
                  Painted
                </li>
              </ul>
            </div>
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
                <span>
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
