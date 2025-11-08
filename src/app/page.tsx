import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16">
      <main className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-12 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
          MacroMinded Ready
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-zinc-900">
          Jumpstart your Firebase-powered Next.js app.
        </h1>
        <p className="mt-4 text-base text-zinc-600">
          Use Firebase Authentication, Firestore, and Storage out of the box.
          Create an account to get started or log in if you already have one.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <a
            href="https://vercel.com/docs/deployments/overview"
            className="inline-flex items-center text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
            target="_blank"
            rel="noreferrer"
          >
            Learn how deploys work on Vercel &rarr;
          </a>
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 sm:w-auto"
          >
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}
