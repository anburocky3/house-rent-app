import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdminServer";

type UserDocShape = {
  role?: "admin" | "tenant";
  _deleted?: boolean;
  fcmToken?: string;
  is_primary_tenant?: boolean;
  property_id?: { id?: string };
};

type LedgerDocShape = {
  payment_status?: string;
  current_meter_reading?: number;
  updated_at?: { toDate?: () => Date };
  property_id?: { id?: string };
};

const getPropertyId = (value?: { id?: string } | string) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const segments = value.split("/").filter(Boolean);
    return segments[segments.length - 1] || "";
  }

  return value.id || "";
};

const isReminderWindow = (date: Date) => {
  const day = date.getUTCDate();
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();

  return day >= lastDay - 2 || day <= 3;
};

const isLastThreeDaysOfMonth = (date: Date) => {
  const day = date.getUTCDate();
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();

  return day >= lastDay - 2;
};

const extractBearerToken = (headerValue: string) => {
  const prefix = "Bearer ";
  if (!headerValue.startsWith(prefix)) {
    return "";
  }
  return headerValue.slice(prefix.length).trim();
};

const sendToTokens = async (
  tokens: string[],
  title: string,
  body: string,
  clickAction: string,
) => {
  if (tokens.length === 0) {
    return {
      totalTokens: 0,
      sentCount: 0,
      failedCount: 0,
    };
  }

  const response = await adminMessaging.sendEachForMulticast({
    tokens,
    notification: {
      title,
      body,
    },
    data: {
      click_action: clickAction,
      type: "monthly-reminder",
    },
    webpush: {
      fcmOptions: {
        link: clickAction,
      },
    },
  });

  return {
    totalTokens: tokens.length,
    sentCount: response.successCount,
    failedCount: response.failureCount,
  };
};

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET || "";
    if (cronSecret) {
      const authorization = request.headers.get("authorization") || "";
      const token = extractBearerToken(authorization);
      if (!token || token !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date();
    if (!isReminderWindow(now)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Outside reminder window (last 3 + first 3 days).",
      });
    }

    const [pendingLedgersSnap, usersSnap] = await Promise.all([
      adminDb
        .collection("billing_ledger")
        .where("payment_status", "==", "pending")
        .get(),
      adminDb.collection("users").get(),
    ]);

    const pendingLedgers = pendingLedgersSnap.docs.map(
      (doc) => doc.data() as LedgerDocShape,
    );

    const latestPendingByProperty = new Map<string, LedgerDocShape>();
    for (const ledger of pendingLedgers) {
      const propertyId = getPropertyId(ledger.property_id);
      if (!propertyId) {
        continue;
      }

      const existing = latestPendingByProperty.get(propertyId);
      if (!existing) {
        latestPendingByProperty.set(propertyId, ledger);
        continue;
      }

      const existingTime = existing.updated_at?.toDate?.()?.getTime() || 0;
      const currentTime = ledger.updated_at?.toDate?.()?.getTime() || 0;
      if (currentTime >= existingTime) {
        latestPendingByProperty.set(propertyId, ledger);
      }
    }

    const users = usersSnap.docs.map((doc) => doc.data() as UserDocShape);

    const unpaidTenantTokens = Array.from(
      new Set(
        users
          .filter((user) => user.role === "tenant" && user._deleted !== true)
          .filter((tenant) => {
            const propertyId = getPropertyId(tenant.property_id);
            return (
              Boolean(propertyId) && latestPendingByProperty.has(propertyId)
            );
          })
          .map((tenant) => tenant.fcmToken?.trim() || "")
          .filter(Boolean),
      ),
    );

    const propertiesWithoutMeterReading = Array.from(
      latestPendingByProperty.entries(),
    )
      .filter(([, ledger]) => (ledger.current_meter_reading ?? 0) <= 0)
      .map(([propertyId]) => propertyId);

    const adminTokens = Array.from(
      new Set(
        users
          .filter((user) => user.role === "admin" && user._deleted !== true)
          .map((admin) => admin.fcmToken?.trim() || "")
          .filter(Boolean),
      ),
    );

    const [tenantSendResult, adminSendResult] = await Promise.all([
      sendToTokens(
        unpaidTenantTokens,
        "Rent due online",
        "Rent is pending. Please complete your online payment.",
        "/tenant",
      ),
      sendToTokens(
        propertiesWithoutMeterReading.length > 0 ? adminTokens : [],
        "Enter meter reading",
        `Please enter meter reading for ${propertiesWithoutMeterReading.length} property(ies) so tenants can make payment.`,
        "/admin",
      ),
    ]);

    const tenantMeterPrepResult = isLastThreeDaysOfMonth(now)
      ? await sendToTokens(
          unpaidTenantTokens,
          "Meter reading update",
          "Owner is updating meter reading. Payment will open once the reading is entered.",
          "/tenant",
        )
      : {
          totalTokens: 0,
          sentCount: 0,
          failedCount: 0,
        };

    return NextResponse.json({
      success: true,
      window: "last-3-days to first-3-days",
      dateUtc: now.toISOString(),
      isLastThreeDaysOfMonth: isLastThreeDaysOfMonth(now),
      unpaidTenantCount: unpaidTenantTokens.length,
      propertiesWithoutMeterReadingCount: propertiesWithoutMeterReading.length,
      tenantNotification: tenantSendResult,
      tenantMeterPrepNotification: tenantMeterPrepResult,
      adminNotification: adminSendResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to run monthly reminder cron", details: message },
      { status: 500 },
    );
  }
}
