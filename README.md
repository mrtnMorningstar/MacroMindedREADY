## MacroMinded Ready

Next.js App Router starter preconfigured with Tailwind CSS and Firebase (Auth, Firestore, Storage). Built with TypeScript and ready to deploy on Vercel.

## Prerequisites

- Node.js 18.18 or later
- npm (bundled with Node.js)
- Firebase project with Web App credentials

## Environment variables

Copy the example file and provide your Firebase configuration values:

```bash
cp .env.local.example .env.local
```

Update `.env.local` with the credentials from your Firebase console:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

> These variables must be available at build time locally and on Vercel. Use Vercel Project Settings → Environment Variables to configure the same keys for production.

## Run locally

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app. Register a new account or sign in with an existing Firebase email/password user. Successful authentication redirects to `/dashboard`; unauthenticated access to `/dashboard/*` routes is redirected back to `/login`.

## Firebase integration

- `lib/firebase.ts` initializes the Firebase SDK once per environment and exports configured instances for `auth`, `db`, and `storage`.
- Authentication uses Firebase email/password providers for the login and registration pages located in `src/app/(auth)/login` and `src/app/(auth)/register`.
- `src/app/dashboard/layout.tsx` protects all dashboard routes by redirecting unauthenticated users to the login flow.

## Deploy to Vercel

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Import the project into [Vercel](https://vercel.com/new) and select the repository.
3. Add the same Firebase environment values under **Project Settings → Environment Variables**.
4. Trigger a deployment. Subsequent pushes to the main branch will automatically deploy.

For more deployment details, review the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).
