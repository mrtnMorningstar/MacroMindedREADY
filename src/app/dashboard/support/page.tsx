"use client";

import Link from "next/link";

import { useDashboard } from "@/context/dashboard-context";
import {
  LockedDashboardScreen,
} from "@/components/dashboard/client-components";
import { DashboardCardSkeleton } from "@/components/skeletons";
import { CTA_BUTTON_CLASSES } from "@/lib/ui";

export default function SupportPage() {
  const { loading, error, isUnlocked } = useDashboard();

  if (loading) {
    return <DashboardCardSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-accent/40 bg-muted/70 px-6 py-6 text-center text-xs font-semibold uppercase tracking-[0.3em] text-accent">
        {error}
      </div>
    );
  }

  if (!isUnlocked) {
    return <LockedDashboardScreen />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
          Support
        </p>
        <h1 className="text-2xl font-bold uppercase tracking-[0.22em] text-foreground">
          Coach communication hub
        </h1>
        <p className="text-[0.75rem] uppercase tracking-[0.3em] text-foreground/50">
          Reach your coach, request plan updates, or review helpful resources.
        </p>
      </div>

      <div className="rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 backdrop-blur">
        <ul className="space-y-4 text-[0.75rem] font-medium uppercase tracking-[0.28em] text-foreground/70">
          <li>
            <span className="text-foreground">Email:</span>{" "}
            <a
              href="mailto:support@macrominded.net"
              className="text-accent underline underline-offset-4"
            >
              support@macrominded.net
            </a>
          </li>
          <li>
            <span className="text-foreground">Response time:</span> 24 hours on
            weekdays
          </li>
          <li className="flex flex-col gap-2">
            <span className="text-foreground">Plan refresh:</span>
            <span className="text-foreground/70">
              Use the macro intake form whenever your goals or biometrics change.
            </span>
            <Link
              href="/macro-form"
              className={`${CTA_BUTTON_CLASSES} w-full justify-center text-center sm:w-auto`}
            >
              Open Macro Intake Form
            </Link>
          </li>
          <li>
            <span className="text-foreground">Emergency update?</span> Mention
            {" “PRIORITY” "} in the subject line so your coach can respond
            quickly.
          </li>
        </ul>
      </div>
    </div>
  );
}

