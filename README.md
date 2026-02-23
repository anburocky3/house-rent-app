This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Push Notifications (Firebase Cloud Messaging)

This app is integrated with Firebase Cloud Messaging (FCM) for web push notifications.

### 1) Configure Firebase Cloud Messaging

- In Firebase Console, open your project → Cloud Messaging.
- Create a Web Push certificate and copy the VAPID public key.
- Add these values in `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_web_push_vapid_public_key
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# or use FIREBASE_SERVICE_ACCOUNT_PATH instead
NOTIFICATION_INTERNAL_API_KEY=optional_secret_for_send_api
```

### 2) Enable notifications in app

- Sign in as admin or tenant.
- Click **Enable notifications** from the in-app notification card.
- This stores `fcmToken` on the matched user profile document.

### 3) Send a test notification

Use the API route:

```bash
curl -X POST http://localhost:3000/api/notifications/send \
	-H "Content-Type: application/json" \
	-H "x-notification-key: YOUR_NOTIFICATION_INTERNAL_API_KEY" \
	-d '{
		"targetRole": "tenant",
		"title": "Meter reading reminder",
		"body": "Please check your updated electricity units.",
		"data": { "click_action": "/tenant" }
	}'
```

## Vercel Cron: Month-End Rent Reminders

This project includes a daily cron endpoint at `/api/cron/monthly-reminders`.

### What it does

- Runs every day (configured in `vercel.json`).
- Sends notifications only in this window:
  - **Last 3 days of month** (29/30/31 depending on month), and
  - **First 3 days of month** (1/2/3).
- If tenant payment is still pending:
  1.  Sends **"Rent due online"** notification to tenants.
  2.  Sends **"Enter meter reading"** notification to admins (when pending ledger has no current meter reading).

### Setup steps in Vercel

1. Push this repo with `vercel.json`.
2. In Vercel Project → Settings → Environment Variables, add:
   - `CRON_SECRET` (create it using `openssl rand -hex 32`)
   - `FIREBASE_SERVICE_ACCOUNT_JSON` (recommended) or `FIREBASE_SERVICE_ACCOUNT_PATH`
   - All Firebase public vars and `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
3. Redeploy.
4. In Vercel Project → Cron Jobs, confirm:
   - Path: `/api/cron/monthly-reminders`
   - Schedule: `0 3 * * *` (UTC, daily)

### Time zone note

- Vercel cron uses **UTC**.
- Current schedule `0 3 * * *` = **08:30 AM IST**.
- If you want a different local time, adjust the cron expression in `vercel.json`.
