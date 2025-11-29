"use client";

type UserRecord = {
  referralCredits?: number | null;
  referredBy?: string | null;
  referralCode?: string | null;
};

type ReferralStatsProps = {
  users: UserRecord[];
};

export function ReferralStats({ users }: ReferralStatsProps) {
  const totalCredits = users.reduce(
    (sum, u) => sum + (u.referralCredits ?? 0),
    0
  );
  const totalReferrals = users.filter((u) => u.referredBy).length;
  const usersWithCodes = users.filter((u) => u.referralCode).length;

  return (
    <section className="mt-6 grid grid-cols-1 gap-4 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_60px_-30px_rgba(215,38,61,0.6)] backdrop-blur sm:grid-cols-3">
      <div className="rounded-2xl border border-border/70 bg-background/5 px-4 py-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
          Total Credits
        </p>
        <p className="mt-2 text-2xl font-bold uppercase tracking-[0.2em] text-foreground">
          {totalCredits}
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-background/5 px-4 py-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
          Users Referred
        </p>
        <p className="mt-2 text-2xl font-bold uppercase tracking-[0.2em] text-foreground">
          {totalReferrals}
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-background/5 px-4 py-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
          Users with Codes
        </p>
        <p className="mt-2 text-2xl font-bold uppercase tracking-[0.2em] text-foreground">
          {usersWithCodes}
        </p>
      </div>
    </section>
  );
}

