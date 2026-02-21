"use client";

import { useState } from "react";
import AdminBottomNav from "../_components/AdminBottomNav";
import { useAdminDashboardData } from "../_hooks/useAdminData";

export default function AdminComplaintsPage() {
  const {
    isAllowed,
    isCheckingAccess,
    isLoadingData,
    complaints,
    updateComplaintStatus,
  } = useAdminDashboardData();
  const [updatingId, setUpdatingId] = useState("");

  if (isCheckingAccess || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-sm text-zinc-600 dark:text-zinc-300">
        Verifying access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 px-4 pb-24 pt-6 font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4">
        <section className="rounded-3xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Complaints
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Issue queue
          </h1>
          <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Track tenant complaints and their status.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {isLoadingData ? (
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Loading complaints...
            </p>
          ) : complaints.length === 0 ? (
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              No complaints yet.
            </p>
          ) : (
            <div className="space-y-3">
              {complaints.map((complaint) => (
                <article
                  key={complaint.id}
                  className="rounded-2xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <p className="text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                    {complaint.complaint_type || "General"}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
                    Status: {complaint.status || "open"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {complaint.title || "No title"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {complaint.description || "No description"}
                  </p>
                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    #{complaint.id}
                  </p>

                  <div className="mt-3">
                    <select
                      value={complaint.status || "Open"}
                      disabled={updatingId === complaint.id}
                      onChange={async (event) => {
                        setUpdatingId(complaint.id);
                        try {
                          await updateComplaintStatus(
                            complaint.id,
                            event.target.value,
                          );
                        } finally {
                          setUpdatingId("");
                        }
                      }}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                    </select>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <AdminBottomNav />
    </div>
  );
}
