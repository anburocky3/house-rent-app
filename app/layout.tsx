import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppFooter from "@/app/components/AppFooter";
import InstallPrompt from "./components/InstallPrompt";
import ThemeToggle from "./components/ThemeToggle";
import { ToastProvider } from "./components/Toast";
import "./globals.css";

const themeBootstrapScript = `
  (() => {
    try {
      const savedTheme = localStorage.getItem("house-rent-theme");
      const theme = savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.style.colorScheme = theme;
    } catch {}
  })();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "House Rent App",
  description:
    "A simple house rent application built with Next.js and Tailwind CSS.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fbff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1623" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-[#f8fbff] text-[#122030] antialiased dark:bg-[#0a1623] dark:text-[#e8f1fa]`}
      >
        <ThemeToggle />
        <InstallPrompt />
        <div className="flex-1">
          <ToastProvider>{children}</ToastProvider>
        </div>
        <AppFooter />
      </body>
    </html>
  );
}
