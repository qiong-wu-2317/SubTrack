// Fake demo data only (CLAUDE.md: no real personal data). Run: npx prisma db seed
// Runs with Node's built-in TypeScript type stripping, so there is no extra dependency.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

type SeedSub = {
  name: string;
  vendor: string;
  category: string;
  amountCents: number;
  currency: string;
  billingCycle: string;
  intervalDays?: number;
  status?: string;
  autoRenew?: boolean;
  endDate?: Date;
  trialEndDate?: Date;
  fees?: { kind: string; amountCents: number; recurring: boolean }[];
};

const subscriptions: SeedSub[] = [
  // USD: 7 active categories, so the dashboard rolls the smallest into "other".
  { name: "StreamFlix", vendor: "StreamFlix Inc.", category: "Streaming", amountCents: 1599, currency: "USD", billingCycle: "monthly" },
  { name: "TuneBox", vendor: "TuneBox", category: "music", amountCents: 1099, currency: "USD", billingCycle: "monthly",
    fees: [{ kind: "tax", amountCents: 88, recurring: true }] },
  { name: "FitClub", vendor: "FitClub Gyms", category: "fitness", amountCents: 3500, currency: "USD", billingCycle: "monthly",
    fees: [{ kind: "tax", amountCents: 280, recurring: true }, { kind: "setup", amountCents: 4900, recurring: false }] },
  { name: "CloudVault", vendor: "CloudVault", category: "cloud", amountCents: 9999, currency: "USD", billingCycle: "yearly" },
  { name: "NewsDaily", vendor: "NewsDaily", category: "news", amountCents: 299, currency: "USD", billingCycle: "weekly" },
  { name: "CodeHost", vendor: "CodeHost", category: "software", amountCents: 700, currency: "USD", billingCycle: "custom", intervalDays: 14 },
  { name: "PhonePlan", vendor: "Example Mobile", category: "utilities", amountCents: 6000, currency: "USD", billingCycle: "quarterly",
    fees: [{ kind: "tax", amountCents: 450, recurring: true }] },
  // Excluded from spend (BR-8) or shown separately.
  { name: "DesignPro", vendor: "DesignPro", category: "software", amountCents: 2999, currency: "USD", billingCycle: "monthly",
    status: "trial", trialEndDate: day("2026-12-01") },
  { name: "OldGym", vendor: "OldGym", category: "fitness", amountCents: 4000, currency: "USD", billingCycle: "monthly", status: "paused" },
  { name: "PhotoApp", vendor: "PhotoApp", category: "software", amountCents: 499, currency: "USD", billingCycle: "monthly",
    autoRenew: false, endDate: day("2025-12-31") }, // BR-5: expired
  // EUR: summed separately (BR-6).
  { name: "Musik Plus", vendor: "Musik", category: "music", amountCents: 999, currency: "EUR", billingCycle: "monthly" },
  { name: "Lernplattform", vendor: "Lern GmbH", category: "education", amountCents: 12000, currency: "EUR", billingCycle: "yearly" },
  { name: "Sprachkurs", vendor: "Sprachkurs", category: "education", amountCents: 1499, currency: "EUR", billingCycle: "monthly",
    status: "trial", trialEndDate: day("2026-12-10") },
];

async function main(): Promise<void> {
  if ((await db.subscription.count()) > 0) {
    console.log("Database already has subscriptions; seed skipped (it never overwrites data).");
    return;
  }

  // Fake labels; last4 values are well-known test digits, never real cards.
  const card = await db.paymentMethod.create({ data: { label: "Personal Visa", last4: "4242" } });
  const debit = await db.paymentMethod.create({ data: { label: "Debit card", last4: "0005" } });

  for (const [i, { fees, ...sub }] of subscriptions.entries()) {
    await db.subscription.create({
      data: {
        ...sub,
        startDate: day("2025-06-01"),
        nextRenewalDate: day("2026-12-15"),
        paymentMethodId: (i % 2 === 0 ? card : debit).id,
        ...(fees ? { fees: { create: fees } } : {}),
      },
    });
  }
  console.log(`Seeded ${subscriptions.length} subscriptions.`);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
