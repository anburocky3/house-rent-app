import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdminServer";

type NotificationTargetRole = "admin" | "tenant";

type NotificationRequestBody = {
  targetRole: NotificationTargetRole;
  title: string;
  body: string;
  data?: Record<string, string>;
};

const isRole = (value: string): value is NotificationTargetRole =>
  value === "admin" || value === "tenant";

export async function POST(request: Request) {
  try {
    // Optional internal API key check for added security
    const internalApiKey = process.env.NOTIFICATION_INTERNAL_API_KEY;
    if (internalApiKey) {
      const providedKey = request.headers.get("x-notification-key") || "";
      if (providedKey !== internalApiKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const rawBody = await request.text();
    let payload: NotificationRequestBody;

    try {
      payload = JSON.parse(rawBody) as NotificationRequestBody;
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON body",
          details:
            'Send a valid JSON object. Example: {"targetRole":"tenant","title":"...","body":"..."}',
        },
        { status: 400 },
      );
    }

    const roleValue = String(payload.targetRole || "");

    if (!isRole(roleValue)) {
      return NextResponse.json(
        { error: "targetRole must be 'admin' or 'tenant'" },
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

    const usersSnapshot = await adminDb
      .collection("users")
      .where("role", "==", roleValue)
      .get();

    const tokens = Array.from(
      new Set(
        usersSnapshot.docs
          .map((doc) => doc.data() as { _deleted?: boolean; fcmToken?: string })
          .filter((item) => item._deleted !== true)
          .map((item) => item.fcmToken?.trim() || "")
          .filter(Boolean),
      ),
    );

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        failedCount: 0,
        message: "No FCM tokens found for target role.",
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
      totalTokens: tokens.length,
      sentCount: response.successCount,
      failedCount: response.failureCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to send notification", details: message },
      { status: 500 },
    );
  }
}
