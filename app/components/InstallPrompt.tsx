"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isStandalone = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const isStandaloneMedia = window.matchMedia(
    "(display-mode: standalone)",
  ).matches;
  const isStandaloneIos =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isStandaloneMedia || isStandaloneIos;
};

const isIosSafari = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const ua = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome|crios|android/.test(ua);
  return isIos && isSafari;
};

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [isInstalled, setIsInstalled] = useState(isStandalone());
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const wasDismissed =
      window.localStorage.getItem("house-rent-install-dismissed") === "true";
    setDismissed(wasDismissed);
    setShowIosHelp(!wasDismissed && isIosSafari());

    if (wasDismissed) {
      return;
    }

    if (isStandalone()) {
      return;
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowIosHelp(false);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isInstalled || dismissed || (!deferredPrompt && !showIosHelp)) {
    return null;
  }

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "dismissed") {
      window.localStorage.setItem("house-rent-install-dismissed", "true");
      setDismissed(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    window.localStorage.setItem("house-rent-install-dismissed", "true");
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosHelp(false);
  };

  return (
    <div className="fixed left-1/2 top-5 z-30 w-[min(92%,460px)] -translate-x-1/2">
      <div className="rounded-2xl border border-[#d7e2f0] bg-white/95 p-4 text-sm text-[#48617a] shadow-xl backdrop-blur dark:border-[#29435e] dark:bg-[#102337]/95 dark:text-[#c2d8ec]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Install House Rent App
            </p>
            {deferredPrompt ? (
              <p className="mt-2 text-base text-zinc-900 dark:text-zinc-50">
                Tap Install to add this app to your home screen.
              </p>
            ) : (
              <div className="mt-2 text-base text-zinc-900 dark:text-zinc-50">
                <p>On iPhone or iPad:</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
                  <li>Tap the Share icon (square with an arrow).</li>
                  <li>Select &quot;Add to Home Screen&quot;.</li>
                  <li>Tap Add.</li>
                </ol>
              </div>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-full border border-transparent px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#68809a] transition hover:border-[#cbddec] hover:text-[#2f80ed] dark:text-[#9bb7d1] dark:hover:border-[#31516e] dark:hover:text-white"
            aria-label="Dismiss install prompt"
          >
            Not now
          </button>
        </div>
        {deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#2f80ed] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#256fd1]"
          >
            Install
          </button>
        ) : null}
      </div>
    </div>
  );
}
