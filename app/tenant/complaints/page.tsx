"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import LogoutButton from "../../components/LogoutButton";
import TenantBottomNav from "../_components/TenantBottomNav";
import { useTenantDashboardData } from "../_hooks/useTenantDashboardData";
import { db } from "../../../firebaseConfig";

type ComplaintItem = {
  id: string;
  title?: string;
  complaint_type?: string;
  description?: string;
  status?: string;
  priority?: string;
  created_at?: { toDate?: () => Date };
};

const complaintTypeOptions = [
  "Plumbing",
  "Electrical",
  "Water leakage",
  "Cleaning",
  "Pest control",
  "Door or lock",
  "Painting",
  "Other maintenance",
];

export default function TenantComplaintsPage() {
  const { isAllowed, isCheckingAccess, propertyId, tenantUid } =
    useTenantDashboardData();
  const [title, setTitle] = useState("");
  const [complaintType, setComplaintType] = useState(complaintTypeOptions[0]);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);

  const loadComplaints = useCallback(async () => {
    if (!propertyId) {
      return;
    }

    const propertyRef = doc(db, "properties", propertyId);
    const snapshot = await getDocs(
      query(
        collection(db, "complaints"),
        where("property_id", "==", propertyRef),
      ),
    );

    const list = snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<ComplaintItem, "id">),
    }));

    list.sort((first, second) => {
      const firstTime = first.created_at?.toDate?.()?.getTime() ?? 0;
      const secondTime = second.created_at?.toDate?.()?.getTime() ?? 0;
      return secondTime - firstTime;
    });

    setComplaints(list);
  }, [propertyId]);

  useEffect(() => {
    if (!isAllowed || !propertyId) {
      return;
    }
    loadComplaints();
  }, [isAllowed, propertyId, loadComplaints]);

  if (isCheckingAccess || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-sm text-zinc-600 dark:text-zinc-300">
        Verifying access...
      </div>
    );
  }

  const submitComplaint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !propertyId ||
      !tenantUid ||
      !title.trim() ||
      !description.trim() ||
      !complaintType
    ) {
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "complaints"), {
        created_by: doc(db, "users", tenantUid),
        property_id: doc(db, "properties", propertyId),
        title: title.trim(),
        complaint_type: complaintType,
        description: description.trim(),
        status: "Open",
        priority: "Medium",
        attachments: [""],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        resolved_at: null,
      });

      setTitle("");
      setDescription("");
      setComplaintType(complaintTypeOptions[0]);
      await loadComplaints();
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "complaints", id), {
      status,
      updated_at: serverTimestamp(),
      resolved_at: status === "Resolved" ? serverTimestamp() : null,
    });
    await loadComplaints();
  };

  return (
    <div className="min-h-screen bg-zinc-100 px-4 pb-24 pt-6 font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4">
        <section className="rounded-3xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-semibold tracking-tight">Complaints</p>
            <LogoutButton />
          </div>
          <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Raise a complaint and track or update status.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <form className="space-y-3" onSubmit={submitComplaint}>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Complaint title"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            />
            <select
              value={complaintType}
              onChange={(event) => setComplaintType(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            >
              {complaintTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the issue"
              rows={3}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-bold text-zinc-50 transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {saving ? "Submitting..." : "Submit complaint"}
            </button>
          </form>
        </section>

        <section className="grid gap-3">
          {complaints.length === 0 ? (
            <div className="rounded-2xl border border-zinc-300 bg-white p-4 text-sm font-medium text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              No complaints yet.
            </div>
          ) : (
            complaints.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-base font-bold">
                  {item.title || "Complaint"}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                  Type: {item.complaint_type || "Maintenance"}
                </p>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {item.description || "No description"}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                  Created:{" "}
                  {item.created_at?.toDate?.()?.toLocaleDateString() || "-"}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={item.status || "Open"}
                    onChange={(event) =>
                      updateStatus(item.id, event.target.value)
                    }
                    className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                  </select>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
      <TenantBottomNav />
    </div>
  );
}
