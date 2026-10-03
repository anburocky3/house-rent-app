import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdminServer";

type LoginHistoryRequest = {
  profileId?: string;
  device?: string;
  browser?: string;
  platform?: string;
  isMobile?: boolean;
  userAgent?: string;
};

type LoginHistoryRecord = {
  loggedInAt: string;
  ip: string;
  device: string;
  browser: string;
  platform: string;
  isMobile: boolean;
  userAgent: string;
};

const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "Unknown IP";
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "Unknown IP"
  );
};

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : "";

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const body = (await request.json()) as LoginHistoryRequest;
    const profileId = String(body.profileId || "").trim();

    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 },
      );
    }

    const profileRef = adminDb.collection("users").doc(profileId);
    const profileSnapshot = await profileRef.get();
    const profile = profileSnapshot.data() as
      | { auth_uid?: string; role?: string; _deleted?: boolean }
      | undefined;

    if (
      !profileSnapshot.exists ||
      profile?._deleted === true ||
      profile?.role !== "tenant" ||
      profile.auth_uid !== decodedToken.uid
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const record: LoginHistoryRecord = {
      loggedInAt: new Date().toISOString(),
      ip: getClientIp(request),
      device: String(body.device || "Unknown device").slice(0, 120),
      browser: String(body.browser || "Unknown browser").slice(0, 120),
      platform: String(body.platform || "Unknown platform").slice(0, 120),
      isMobile: body.isMobile === true,
      userAgent: String(
        body.userAgent ||
          request.headers.get("user-agent") ||
          "Unknown user agent",
      ).slice(0, 500),
    };

    await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(profileRef);
      const currentHistory = snapshot.data()?.login_history;
      const history = Array.isArray(currentHistory)
        ? (currentHistory as LoginHistoryRecord[])
        : [];

      transaction.update(profileRef, {
        login_history: [record, ...history].slice(0, 5),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Unable to record login history", details: message },
      { status: 500 },
    );
  }
}
