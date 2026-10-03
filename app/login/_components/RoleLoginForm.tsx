"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { auth, db } from "../../../firebaseConfig";
import type { Role, UserProfile } from "../../../types";
import {
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

type RoleLoginFormProps = {
  role: Role;
  title: string;
  subtitle: string;
  allowCreate: boolean;
};

export default function RoleLoginForm({
  role,
  title,
  subtitle,
  allowCreate,
}: RoleLoginFormProps) {
  const isAdmin = role === "admin";
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    phoneNumber?: string;
    password?: string;
  }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRoleSwitching, setIsRoleSwitching] = useState(false);

  const formSchema = z.object({
    phoneNumber: z
      .string()
      .min(1, "Phone number is required.")
      .refine((value) => {
        const digits = value.replace(/\D/g, "");
        return digits.length >= 10 && digits.length <= 15;
      }, "Enter a valid phone number."),
    password: z.string().min(6, "Password must be at least 6 characters."),
  });

  const findProfileByPhone = async (selectedRole: Role, phone: string) => {
    const normalizedPhone = phone.replace(/\D/g, "");

    const constraints = [
      where("role", "==", selectedRole),
      where("phone_number", "==", normalizedPhone),
    ];

    if (selectedRole === "tenant") {
      constraints.push(where("is_primary_tenant", "==", true));
    }

    const matches = await getDocs(
      query(collection(db, "users"), ...constraints),
    );

    const activeDoc = matches.docs.find((item) => {
      const data = item.data() as UserProfile;
      return data._deleted !== true;
    });

    if (!activeDoc) {
      return null;
    }

    return {
      id: activeDoc.id,
      profile: activeDoc.data() as UserProfile,
      normalizedPhone,
    };
  };

  const syncExistingProfileWithAuth = async (
    profileDocId: string,
    authUid: string,
    selectedRole: Role,
    phone: string,
    existing: UserProfile,
  ) => {
    const normalizedPhone = phone.replace(/\D/g, "");

    const resolvedRole: Role =
      existing?.role === "admin" || existing?.role === "tenant"
        ? existing.role
        : selectedRole;

    const profileUpdate: UserProfile = {
      ...(existing ?? {}),
      uid: profileDocId,
      auth_uid: authUid,
      phone_number: normalizedPhone,
      role: resolvedRole,
      updated_at: serverTimestamp(),
      _deleted: false,
    };

    await setDoc(doc(db, "users", profileDocId), profileUpdate, {
      merge: true,
    });

    return resolvedRole;
  };

  const ensureProfileExists = async (selectedRole: Role, phone: string) => {
    const existing = await findProfileByPhone(selectedRole, phone);

    if (!existing) {
      throw new Error(
        selectedRole === "admin"
          ? "Owner account not found. Please contact support."
          : "Primary tenant account not found. Please contact your landlord.",
      );
    }

    return existing;
  };

  const recordTenantLogin = async (profileId: string, authUser: typeof auth.currentUser) => {
    if (!authUser) {
      return;
    }

    try {
      const idToken = await authUser.getIdToken();
      const userAgentData =
        "userAgentData" in navigator
          ? (navigator as Navigator & {
              userAgentData?: { mobile?: boolean };
            }).userAgentData
          : undefined;
      const isMobile =
        userAgentData?.mobile === true ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      await fetch("/api/login-history", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId,
          device: isMobile ? "Mobile browser" : "Desktop browser",
          browser: navigator.userAgent,
          platform: navigator.platform,
          isMobile,
          userAgent: navigator.userAgent,
        }),
      });
    } catch {
      // Login history is an audit aid and should not block a successful login.
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const validation = formSchema.safeParse({
      phoneNumber,
      password,
    });

    if (!validation.success) {
      const nextErrors: { phoneNumber?: string; password?: string } = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0];
        if (field === "phoneNumber" || field === "password") {
          nextErrors[field] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      let userCredential;
      const normalizedPhone = phoneNumber.replace(/\D/g, "");
      const emailForAuth = normalizedPhone
        ? `${normalizedPhone}@tenant.house-rent.local`
        : "";

      try {
        userCredential = await signInWithEmailAndPassword(
          auth,
          emailForAuth,
          password,
        );
      } catch (signInError: unknown) {
        // Only create account if user doesn't exist AND creation is allowed
        const errorCode =
          signInError &&
          typeof signInError === "object" &&
          "code" in signInError
            ? (signInError as { code: string }).code
            : "";

        if (errorCode === "auth/user-not-found" && allowCreate) {
          userCredential = await createUserWithEmailAndPassword(
            auth,
            emailForAuth,
            password,
          );
        } else {
          throw signInError;
        }
      }

      const { user } = userCredential;
      const existingProfile = await ensureProfileExists(role, phoneNumber);
      const resolvedRole = await syncExistingProfileWithAuth(
        existingProfile.id,
        user.uid,
        role,
        phoneNumber,
        existingProfile.profile,
      );

      if (resolvedRole === "tenant") {
        await recordTenantLogin(existingProfile.id, user);
      }

      router.replace(resolvedRole === "admin" ? "/admin" : "/tenant");
    } catch (err) {
      // If profile validation fails after auth, sign out to avoid partial session.
      if (auth.currentUser) {
        try {
          await signOut(auth);
        } catch {
          // Ignore sign-out errors in login error path.
        }
      }

      let message = "Unable to sign in. Please try again.";

      if (err && typeof err === "object" && "code" in err) {
        const errorCode = (err as { code: string }).code;

        switch (errorCode) {
          case "auth/invalid-credential":
          case "auth/wrong-password":
            message = "Invalid phone number or password. Please try again.";
            break;
          case "auth/user-not-found":
            message = "No account found with this phone number.";
            break;
          case "auth/too-many-requests":
            message = "Too many failed attempts. Please try again later.";
            break;
          case "auth/network-request-failed":
            message = "Network error. Please check your connection.";
            break;
          default:
            if (err instanceof Error) {
              message = err.message;
            }
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-surface flex min-h-screen items-center justify-center px-5 py-10">
      <div
        className={`w-full max-w-sm rounded-4xl border bg-white p-7 text-[#122030] shadow-[0_20px_55px_rgba(47,128,237,0.12)] dark:bg-[#102337] dark:text-[#f0f7ff] ${isAdmin ? "admin-login-card border-[#2f80ed] shadow-[0_20px_55px_rgba(47,128,237,0.2)] dark:border-[#70b4ff]" : "border-[#cfe2f8] dark:border-[#31516e]"} ${isRoleSwitching ? "role-card-flipping" : ""}`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="app-label">
              {role === "admin" ? "Owner access" : "Resident access"}
            </p>
            {role === "admin" ? (
              <span className="rounded-full bg-[#eaf3fc] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#2f80ed] dark:bg-[#173452] dark:text-[#b7d8ff]">
                Owner
              </span>
            ) : null}
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#122030] dark:text-[#f0f7ff]">
            {title}
          </h1>
          <p className="login-subtitle text-sm leading-6 text-[#68809a] dark:text-[#a9c0d6]">
            {subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="phone" className="app-label">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phoneNumber}
              onChange={(event) => {
                setPhoneNumber(event.target.value);
                if (fieldErrors.phoneNumber) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    phoneNumber: undefined,
                  }));
                }
              }}
              className={`w-full rounded-2xl border bg-[#f4f8fd] px-4 py-3.5 text-sm text-[#122030] outline-none transition placeholder:text-[#7890a8] focus:bg-white dark:bg-[#12263d] dark:text-[#f0f7ff] dark:placeholder:text-[#91abc4] dark:focus:bg-[#173452] ${
                fieldErrors.phoneNumber
                  ? "border-red-400 focus:border-red-500 dark:border-red-500"
                  : "border-[#cfe2f8] focus:border-[#2f80ed] dark:border-[#31516e] dark:focus:border-[#93c5fd]"
              }`}
              placeholder="+91 9876543211"
            />
            {fieldErrors.phoneNumber ? (
              <p className="text-xs text-red-600 dark:text-red-300">
                {fieldErrors.phoneNumber}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="app-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    password: undefined,
                  }));
                }
              }}
              className={`w-full rounded-2xl border bg-[#f4f8fd] px-4 py-3.5 text-sm text-[#122030] outline-none transition placeholder:text-[#7890a8] focus:bg-white dark:bg-[#12263d] dark:text-[#f0f7ff] dark:placeholder:text-[#91abc4] dark:focus:bg-[#173452] ${
                fieldErrors.password
                  ? "border-red-400 focus:border-red-500 dark:border-red-500"
                  : "border-[#cfe2f8] focus:border-[#2f80ed] dark:border-[#31516e] dark:focus:border-[#93c5fd]"
              }`}
              placeholder="••••••••"
            />
            {fieldErrors.password ? (
              <p className="text-xs text-red-600 dark:text-red-300">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#2f80ed] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#256fd1] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Continue"}
          </button>
          <div className="text-center">
            {role === "tenant" && (
              <a
                href="/login/super"
                onClick={(event) => {
                  event.preventDefault();
                  setIsRoleSwitching(true);
                  window.setTimeout(() => router.push("/login/super"), 560);
                }}
                className="text-sm font-semibold text-[#2f80ed] hover:underline dark:text-[#93c5fd]"
              >
                Login as Owner
              </a>
            )}

            {role === "admin" && (
              <a
                href="/login"
                onClick={(event) => {
                  event.preventDefault();
                  setIsRoleSwitching(true);
                  window.setTimeout(() => router.push("/login"), 560);
                }}
                className="text-sm font-semibold text-[#2f80ed] hover:underline dark:text-[#93c5fd]"
              >
                Tenant Login
              </a>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
