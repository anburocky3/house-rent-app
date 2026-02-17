"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { auth, db } from "../../../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

type Role = "admin" | "tenant";

type UserProfile = {
  uid: string;
  role: Role;
  phone_number: string;
  created_at?: unknown;
  updated_at: unknown;
};

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
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    phoneNumber?: string;
    password?: string;
  }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const saveUserProfile = async (
    uid: string,
    selectedRole: Role,
    phone: string,
  ) => {
    const normalizedPhone = phone.replace(/\D/g, "");
    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);
    let existing = snapshot.exists() ? (snapshot.data() as UserProfile) : null;

    // If no doc with this uid, check if one exists with this phone number
    if (!existing) {
      const phoneMatches = await getDocs(
        query(
          collection(db, "users"),
          where("phone_number", "==", normalizedPhone),
        ),
      );

      if (!phoneMatches.empty) {
        // Found existing doc with different uid - migrate it
        const oldDoc = phoneMatches.docs[0];
        existing = oldDoc.data() as UserProfile;
        // Delete old document
        await setDoc(doc(db, "users", oldDoc.id), { _deleted: true });
      }
    }

    const resolvedRole = existing?.role ?? selectedRole;

    const profileUpdate: UserProfile = {
      uid,
      phone_number: normalizedPhone,
      role: resolvedRole,
      updated_at: serverTimestamp(),
      ...(existing ? {} : { created_at: serverTimestamp() }),
    };

    await setDoc(userRef, profileUpdate, { merge: true });

    return resolvedRole;
  };

  const ensureProfileExists = async (selectedRole: Role, phone: string) => {
    const normalizedPhone = phone.replace(/\D/g, "");
    const matches = await getDocs(
      query(
        collection(db, "users"),
        where("role", "==", selectedRole),
        where("phone_number", "==", normalizedPhone),
      ),
    );

    if (matches.empty) {
      throw new Error(
        selectedRole === "admin"
          ? "Owner account not found. Please contact support."
          : "Tenant account not found. Please contact your landlord.",
      );
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

      await ensureProfileExists(role, phoneNumber);

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
      const resolvedRole = await saveUserProfile(user.uid, role, phoneNumber);

      router.replace(resolvedRole === "admin" ? "/admin" : "/tenant");
    } catch (err) {
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
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Welcome back
          </p>
          <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
            {title}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400"
            >
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
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition dark:bg-zinc-900 dark:text-zinc-100 ${
                fieldErrors.phoneNumber
                  ? "border-red-400 focus:border-red-500 dark:border-red-500"
                  : "border-zinc-200 focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-50"
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
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400"
            >
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
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition dark:bg-zinc-900 dark:text-zinc-100 ${
                fieldErrors.password
                  ? "border-red-400 focus:border-red-500 dark:border-red-500"
                  : "border-zinc-200 focus:border-zinc-950 dark:border-zinc-800 dark:focus:border-zinc-50"
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
            className="inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
