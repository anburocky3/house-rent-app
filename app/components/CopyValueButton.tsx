"use client";

import { useState } from "react";

type CopyValueButtonProps = {
  value: string;
  label: string;
  className?: string;
};

export default function CopyValueButton({
  value,
  label,
  className,
}: CopyValueButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1400);
    } catch {
      setIsCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!value}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      className={`ml-auto inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-300 text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 ${className || ""}`}
    >
      {isCopied ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            d="M5 12.5 9.2 16.5 19 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect
            x="9"
            y="9"
            width="10"
            height="10"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="5"
            y="5"
            width="10"
            height="10"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      )}
    </button>
  );
}
