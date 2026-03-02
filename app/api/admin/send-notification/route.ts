import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdminServer";

type NotificationRequestBody = {
  title: string;
  body: string;
  recipients:
    | "all-tenants"
    | { tenantUids: string[] }
    | { propertyIds: string[] };
  data?: Record<string, string>;
};

export async function POST(request: Request) {
  try {
    // Verify admin secret for security
    const adminSecret = process.env.ADMIN_API_SECRET;
    if (!adminSecret) {
      return NextResponse.json(
        { error: "Admin API not configured" },
        { status: 500 },
      );
    }

    const providedSecret = request.headers.get("x-admin-secret") || "";
    console.log(
      "Admin API access attempt with secret:",
      providedSecret,
      "adminSecret:",
      adminSecret,
    );
    if (providedSecret !== adminSecret) {
      return NextResponse.json(
        { error: "Unauthorized - invalid admin secret" },
        { status: 401 },
      );
    }

    const rawBody = await request.text();
    let payload: NotificationRequestBody;

    try {
      payload = JSON.parse(rawBody) as NotificationRequestBody;
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON body",
        },
        { status: 400 },
      );
    }

    const title = String(payload.title || "").trim();
    const body = String(payload.body || "").trim();

    if (!title || !body) {
      return NextResponse.json(
        { error: "title and body are required" },
        { status: 400 },
      );
    }

    if (!payload.recipients) {
      return NextResponse.json(
        { error: "recipients configuration is required" },
        { status: 400 },
      );
    }

    let tokens: string[] = [];

    // Handle different recipient types
    if (payload.recipients === "all-tenants") {
      // Get all tenant FCM tokens
      const tenantsSnapshot = await adminDb
        .collection("users")
        .where("role", "==", "tenant")
        .get();

      tokens = Array.from(
        new Set(
          tenantsSnapshot.docs
            .map(
              (doc) => doc.data() as { _deleted?: boolean; fcmToken?: string },
            )
            .filter((item) => item._deleted !== true)
            .map((item) => item.fcmToken?.trim() || "")
            .filter(Boolean),
        ),
      );
    } else if ("tenantUids" in payload.recipients) {
      // Get FCM tokens for specific tenants
      const { tenantUids } = payload.recipients;
      const tokensSet = new Set<string>();

      for (const tenantUid of tenantUids) {
        const tenantDoc = await adminDb
          .collection("users")
          .doc(tenantUid)
          .get();
        if (tenantDoc.exists && tenantDoc.data) {
          const tenantData = tenantDoc.data() as { fcmToken?: string };
          const token = tenantData.fcmToken?.trim();
          if (token) {
            tokensSet.add(token);
          }
        }
      }

      tokens = Array.from(tokensSet);
    } else if ("propertyIds" in payload.recipients) {
      // Get FCM tokens for all tenants of specific properties
      const { propertyIds } = payload.recipients;
      const tokensSet = new Set<string>();

      // Get all tenants
      const tenantsSnapshot = await adminDb
        .collection("users")
        .where("role", "==", "tenant")
        .get();

      for (const tenantDoc of tenantsSnapshot.docs) {
        const tenantData = tenantDoc.data() as {
          property_id?: string;
          _deleted?: boolean;
          fcmToken?: string;
        };

        if (
          tenantData._deleted !== true &&
          tenantData.property_id &&
          propertyIds.includes(tenantData.property_id)
        ) {
          const token = tenantData.fcmToken?.trim();
          if (token) {
            tokensSet.add(token);
          }
        }
      }

      tokens = Array.from(tokensSet);
    }

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        failedCount: 0,
        message: "No FCM tokens found for target recipients.",
      });
    }

    const response = await adminMessaging.sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      data: payload.data || {},
      webpush: {
        fcmOptions: {
          link: payload.data?.click_action || "/",
        },
      },
    });

    return NextResponse.json({
      success: true,
      sentCount: response.successCount,
      failedCount: response.failureCount,
      message: `Notification sent to ${response.successCount} device(s)${response.failureCount > 0 ? `, ${response.failureCount} failed` : ""}`,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 },
    );
  }
}
