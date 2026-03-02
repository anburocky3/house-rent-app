"use client";

import { FormEvent, useState } from "react";
import LogoutButton from "../../components/LogoutButton";
import AdminBottomNav from "../_components/AdminBottomNav";
import { useAdminDashboardData } from "../_hooks/useAdminData";

type RecipientMode = "all-tenants" | "by-property" | "by-tenant";

export default function AdminNotificationsPage() {
  const { isAllowed, isCheckingAccess, properties, tenants, adminProfile } =
    useAdminDashboardData();

  const [recipientMode, setRecipientMode] =
    useState<RecipientMode>("all-tenants");
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(
    new Set(),
  );
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(
    new Set(),
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [testingTenant, setTestingTenant] = useState<string | null>(null);
  const [testingOwner, setTestingOwner] = useState(false);

  // Group tenants by property
  const tenantsByProperty: Record<string, typeof tenants> = {};
  tenants.forEach((tenant) => {
    const propId =
      typeof tenant.property_id === "string"
        ? tenant.property_id.split("/").pop() || tenant.property_id
        : tenant.property_id?.id || "unknown";

    if (!tenantsByProperty[propId]) {
      tenantsByProperty[propId] = [];
    }
    tenantsByProperty[propId].push(tenant);
  });

  const getTenantsForRecipients = () => {
    let recipientTenants = tenants;

    if (recipientMode === "by-property") {
      recipientTenants = tenants.filter((tenant) => {
        const propId =
          typeof tenant.property_id === "string"
            ? tenant.property_id.split("/").pop() || tenant.property_id
            : tenant.property_id?.id || "";
        return selectedProperties.has(propId);
      });
    } else if (recipientMode === "by-tenant") {
      recipientTenants = tenants.filter((tenant) =>
        selectedTenants.has(tenant.uid),
      );
    }

    return recipientTenants;
  };

  const sendNotification = async (e: FormEvent, testRecipient?: string) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      setMessage({
        type: "error",
        text: "Title and message body are required",
      });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      let recipients: unknown = "all-tenants";

      if (testRecipient === "owner") {
        // Send to admin (owner)
        const adminPhone = (
          (adminProfile?.phone_number as string | undefined) || ""
        ).replace(/\D/g, "");

        if (!adminPhone) {
          setMessage({
            type: "error",
            text: "Admin phone number not found",
          });
          setSending(false);
          return;
        }

        recipients = { adminPhone };
      } else if (testRecipient) {
        // Send to specific tenant
        recipients = { tenantUids: [testRecipient] };
      } else if (recipientMode === "by-property") {
        recipients = { propertyIds: Array.from(selectedProperties) };
      } else if (recipientMode === "by-tenant") {
        recipients = { tenantUids: Array.from(selectedTenants) };
      }

      const response = await fetch("/api/admin/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_API_SECRET || "",
        },
        body: JSON.stringify({
          title,
          body,
          recipients,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.error || result.message || "Failed to send notification",
        });
      } else {
        setMessage({
          type: "success",
          text:
            testRecipient === "owner"
              ? "Test notification sent to owner!"
              : testRecipient
                ? "Test notification sent to tenant!"
                : result.message || "Notification sent successfully!",
        });

        if (!testRecipient) {
          setTitle("");
          setBody("");
          setSelectedProperties(new Set());
          setSelectedTenants(new Set());
        }
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      setMessage({
        type: "error",
        text: "An error occurred while sending the notification",
      });
    } finally {
      setSending(false);
      setTestingTenant(null);
      setTestingOwner(false);
    }
  };

  if (isCheckingAccess || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-sm text-zinc-600 dark:text-zinc-300">
        Verifying access...
      </div>
    );
  }

  const recipientTenantsCount = getTenantsForRecipients().length;

  return (
    <div className="min-h-screen bg-zinc-100 px-4 pb-24 pt-6 font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4">
        <section className="rounded-3xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Send Notifications
              </p>
              <p className="mt-2 text-base font-semibold tracking-tight">
                Broadcast to Tenants
              </p>
            </div>
            <LogoutButton />
          </div>
        </section>

        <form onSubmit={sendNotification} className="flex flex-col gap-4">
          {/* Title Input */}
          <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
              Notification Title
            </label>
            <input
              type="text"
              maxLength={60}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Rent Payment Reminder"
              className="mt-3 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:placeholder-zinc-500 dark:focus:border-zinc-600 dark:focus:bg-zinc-900"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {title.length}/60 characters
            </p>
          </section>

          {/* Body Input */}
          <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
              Message Body
            </label>
            <textarea
              maxLength={240}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here..."
              rows={4}
              className="mt-3 w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:placeholder-zinc-500 dark:focus:border-zinc-600 dark:focus:bg-zinc-900"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {body.length}/240 characters
            </p>
          </section>

          {/* Recipient Mode Selection */}
          <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
              Send To
            </label>
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <input
                  type="radio"
                  name="recipient-mode"
                  value="all-tenants"
                  checked={recipientMode === "all-tenants"}
                  onChange={(e) => {
                    setRecipientMode(e.target.value as RecipientMode);
                    setSelectedProperties(new Set());
                    setSelectedTenants(new Set());
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">All Tenants</span>
                <span className="ml-auto text-xs text-zinc-500">
                  ({tenants.length})
                </span>
              </label>

              <label className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <input
                  type="radio"
                  name="recipient-mode"
                  value="by-property"
                  checked={recipientMode === "by-property"}
                  onChange={(e) => {
                    setRecipientMode(e.target.value as RecipientMode);
                    setSelectedTenants(new Set());
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">By Property</span>
                {selectedProperties.size > 0 && (
                  <span className="ml-auto text-xs text-zinc-500">
                    ({selectedProperties.size} selected)
                  </span>
                )}
              </label>

              <label className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <input
                  type="radio"
                  name="recipient-mode"
                  value="by-tenant"
                  checked={recipientMode === "by-tenant"}
                  onChange={(e) => {
                    setRecipientMode(e.target.value as RecipientMode);
                    setSelectedProperties(new Set());
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">By Tenant</span>
                {selectedTenants.size > 0 && (
                  <span className="ml-auto text-xs text-zinc-500">
                    ({selectedTenants.size} selected)
                  </span>
                )}
              </label>
            </div>
          </section>

          {/* Property Selection (if by-property mode) */}
          {recipientMode === "by-property" && (
            <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                Select Properties
              </p>
              <div className="mt-3 max-h-64 overflow-y-auto space-y-2">
                {properties.length === 0 ? (
                  <p className="text-sm text-zinc-500">No properties found</p>
                ) : (
                  properties.map((property) => {
                    const propId = property.id;
                    const propTenants = tenantsByProperty[propId] || [];

                    return (
                      <label
                        key={propId}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProperties.has(propId)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedProperties);
                            if (e.target.checked) {
                              newSelected.add(propId);
                            } else {
                              newSelected.delete(propId);
                            }
                            setSelectedProperties(newSelected);
                          }}
                          className="h-4 w-4 rounded"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {property.property_nickname ||
                              property.property_id ||
                              "Unnamed"}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {propTenants.length} tenant
                            {propTenants.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {/* Tenant Selection (if by-tenant mode) */}
          {recipientMode === "by-tenant" && (
            <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                Select Tenants
              </p>
              <div className="mt-3 max-h-64 overflow-y-auto space-y-2">
                {tenants.length === 0 ? (
                  <p className="text-sm text-zinc-500">No tenants found</p>
                ) : (
                  tenants.map((tenant) => (
                    <label
                      key={tenant.uid}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTenants.has(tenant.uid)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedTenants);
                          if (e.target.checked) {
                            newSelected.add(tenant.uid);
                          } else {
                            newSelected.delete(tenant.uid);
                          }
                          setSelectedTenants(newSelected);
                        }}
                        className="h-4 w-4 rounded"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {tenant.full_name || tenant.name || "Unnamed"}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {tenant.phone_number || "No phone"}
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Recipient Summary */}
          {recipientMode !== "all-tenants" && (
            <section className="rounded-2xl border border-zinc-300 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {recipientTenantsCount} tenant
                {recipientTenantsCount !== 1 ? "s" : ""} will receive this
                notification
              </p>
            </section>
          )}

          {/* Message Display */}
          {message && (
            <section
              className={`rounded-2xl border p-3 text-sm ${
                message.type === "success"
                  ? "border-green-300 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100"
                  : "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
              }`}
            >
              {message.text}
            </section>
          )}

          {/* Send Button */}
          <button
            type="submit"
            disabled={Boolean(
              sending ||
              !title.trim() ||
              !body.trim() ||
              (recipientMode === "by-property" &&
                selectedProperties.size === 0) ||
              (recipientMode === "by-tenant" && selectedTenants.size === 0),
            )}
            className="w-full rounded-xl bg-zinc-950 px-4 py-3 font-semibold text-zinc-50 transition hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {sending ? "Sending..." : "Send Notification"}
          </button>
        </form>

        {/* Test Notifications Section */}
        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
            Test Notifications
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Send a test notification to verify message content
          </p>

          {/* Test to Owner */}
          <button
            onClick={(e) => {
              setTestingOwner(true);
              void sendNotification(e, "owner");
            }}
            disabled={Boolean(
              testingOwner ||
              testingTenant ||
              !title.trim() ||
              !body.trim() ||
              sending,
            )}
            className="mt-3 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-medium transition hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            {testingOwner ? "Sending to owner..." : "📧 Test to Owner"}
          </button>

          {/* Test to Tenants */}
          {tenants.length > 0 && (
            <div className="mt-3 max-h-40 overflow-y-auto space-y-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Test to Individual Tenants:
              </p>
              {tenants.slice(0, 5).map((tenant) => (
                <button
                  key={`test-${tenant.uid}`}
                  onClick={(e) => {
                    setTestingTenant(tenant.uid);
                    void sendNotification(e, tenant.uid);
                  }}
                  disabled={Boolean(
                    testingTenant ||
                    testingOwner ||
                    !title.trim() ||
                    !body.trim() ||
                    sending,
                  )}
                  className="w-full text-left rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs font-medium transition hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                >
                  {testingTenant === tenant.uid ? "Sending..." : "👤"}{" "}
                  {tenant.full_name || tenant.name || "Tenant"}
                </button>
              ))}
              {tenants.length > 5 && (
                <p className="text-xs text-zinc-500 px-2">
                  +{tenants.length - 5} more tenants available
                </p>
              )}
            </div>
          )}
        </section>

        <div className="h-4" />
      </main>

      <AdminBottomNav />
    </div>
  );
}
