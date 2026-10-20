import { execSync } from "node:child_process";
import { demoDay } from "../lib/clock";
import { prisma } from "../lib/prisma";
import { allowedEducationCreditCents } from "../lib/education-credit";
import { EXTENSION_DEADLINE, FILING_DEADLINE, TAX_YEAR, type EducationCredit } from "../lib/tax-year";
import { EXTRA_FILINGS, type SeedFiling } from "./extra-filers";

const WORKSPACE_ID = "ws_expertops";

const dollars = (amount: number) => amount * 100;
const day = (isoDate: string | undefined) => (isoDate ? demoDay(isoDate) : null);

const REFUND_EXCLUDES_CREDIT = "Refund estimate excludes the education credit until the review closes.";

const CORE_FILINGS: SeedFiling[] = [
  {
    filer: {
      id: "fil_hale",
      name: "Jordan Hale",
      email: "jordan.hale@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "4821",
      state: "CA",
    },
    taxReturn: {
      id: "ret_1041",
      number: "TY25-1041",
      status: "ACCEPTED",
      transmittedOn: "2026-04-02",
      acceptedOn: "2026-04-03",
      lastActivityOn: "2026-04-03",
      refund: 1_381,
      forms: [
        { formType: "W-2", issuer: "Acme North", amount: 68_400, withheld: 7_950 },
        { formType: "1099-INT", issuer: "Blue Harbor Bank", amount: 310 },
      ],
    },
  },
  {
    filer: {
      id: "fil_sato",
      name: "Remy & Ana Sato",
      email: "remy.sato@mail.example",
      filingStatus: "MFJ",
      ssnLast4: "3307",
      state: "OR",
    },
    taxReturn: {
      id: "ret_1042",
      number: "TY25-1042",
      status: "REJECTED",
      extendedOn: "2026-04-13",
      transmittedOn: "2026-10-05",
      rejectedOn: "2026-10-06",
      rejectCode: "IND-032-04",
      lastActivityOn: "2026-10-06",
      refund: -1_109,
      memo: "Ana's 2024 AGI was entered from a draft of last year's return.",
      forms: [
        { formType: "W-2", issuer: "Riverstone Labs", amount: 92_300, withheld: 9_850 },
        { formType: "W-2", issuer: "Fieldnote Press", amount: 54_100, withheld: 4_420 },
        { formType: "1099-INT", issuer: "Blue Harbor Bank", amount: 1_240 },
      ],
    },
  },
  {
    filer: {
      id: "fil_marlow",
      name: "Ellis Marlow",
      email: "ellis.marlow@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "6142",
      state: "CO",
    },
    taxReturn: {
      id: "ret_1043",
      number: "TY25-1043",
      status: "EXTENDED",
      extendedOn: "2026-04-14",
      lastActivityOn: "2026-10-01",
      refund: 1_069,
      memo: REFUND_EXCLUDES_CREDIT,
      forms: [
        { formType: "W-2", issuer: "Cobalt Goods", amount: 41_800, withheld: 3_960 },
        { formType: "1098-T", issuer: "Lumen Education", amount: 4_000 },
      ],
    },
  },
  {
    filer: {
      id: "fil_nader",
      name: "Priya Nader",
      email: "priya.nader@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "2290",
      state: "TX",
    },
    taxReturn: {
      id: "ret_1044",
      number: "TY25-1044",
      status: "EXTENDED",
      extendedOn: "2026-04-10",
      lastActivityOn: "2026-10-05",
      refund: 593,
      memo: REFUND_EXCLUDES_CREDIT,
      forms: [
        { formType: "W-2", issuer: "Brightwell Labs", amount: 38_600, withheld: 3_100 },
        { formType: "1098-T", issuer: "Lumen Education", amount: 1_800 },
      ],
    },
  },
  {
    filer: {
      id: "fil_bellamy",
      name: "Chris Bellamy",
      email: "chris.bellamy@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "7718",
      state: "OH",
    },
    taxReturn: {
      id: "ret_1045",
      number: "TY25-1045",
      status: "REJECTED",
      extendedOn: "2026-04-15",
      transmittedOn: "2026-10-01",
      rejectedOn: "2026-10-02",
      rejectCode: "IND-181-01",
      lastActivityOn: "2026-10-02",
      refund: 1_275,
      memo: "Filer enrolled in the IP PIN program in January.",
      forms: [{ formType: "W-2", issuer: "Oakiron Supply", amount: 57_250, withheld: 6_020 }],
    },
  },
  {
    filer: {
      id: "fil_ortez",
      name: "Sam & Jo Ortez",
      email: "sam.ortez@mail.example",
      filingStatus: "MFJ",
      ssnLast4: "5034",
      state: "WA",
    },
    taxReturn: {
      id: "ret_1046",
      number: "TY25-1046",
      status: "ACCEPTED",
      extendedOn: "2026-04-12",
      transmittedOn: "2026-09-29",
      acceptedOn: "2026-09-30",
      lastActivityOn: "2026-09-30",
      refund: 441,
      forms: [
        { formType: "W-2", issuer: "Fieldnote Press", amount: 78_900, withheld: 7_400 },
        { formType: "W-2", issuer: "Tidewatch Logistics", amount: 61_200, withheld: 6_950 },
        { formType: "1099-INT", issuer: "Blue Harbor Bank", amount: 860 },
      ],
    },
  },
  {
    filer: {
      id: "fil_voss",
      name: "Noor Voss",
      email: "noor.voss@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "8463",
      state: "NY",
    },
    taxReturn: {
      id: "ret_1047",
      number: "TY25-1047",
      status: "EXTENDED",
      extendedOn: "2026-04-14",
      lastActivityOn: "2026-09-28",
      refund: 1_375,
      memo: REFUND_EXCLUDES_CREDIT,
      forms: [
        { formType: "W-2", issuer: "Silverpine Outfitters", amount: 83_500, withheld: 11_200 },
        { formType: "1098-T", issuer: "Lumen Education", amount: 12_000 },
      ],
    },
  },
  {
    filer: {
      id: "fil_ruiz",
      name: "Dana Ruiz",
      email: "dana.ruiz@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "1956",
      state: "AZ",
    },
    taxReturn: {
      id: "ret_1048",
      number: "TY25-1048",
      status: "EXTENDED",
      extendedOn: "2026-04-15",
      lastActivityOn: "2026-09-22",
      refund: 571,
      memo: "Waiting on a corrected W-2 (W-2c) from Maple & Ember Co.",
      forms: [{ formType: "W-2", issuer: "Maple & Ember Co", amount: 46_700, withheld: 4_050 }],
    },
  },
  {
    filer: {
      id: "fil_anand",
      name: "Keir & Mina Anand",
      email: "keir.anand@mail.example",
      filingStatus: "MFJ",
      ssnLast4: "6620",
      state: "IL",
    },
    taxReturn: {
      id: "ret_1049",
      number: "TY25-1049",
      status: "EXTENDED",
      extendedOn: "2026-04-11",
      lastActivityOn: "2026-10-03",
      refund: -112,
      memo: REFUND_EXCLUDES_CREDIT,
      forms: [
        { formType: "W-2", issuer: "Tidewatch Logistics", amount: 88_400, withheld: 8_900 },
        { formType: "W-2", issuer: "Summit Aero", amount: 49_300, withheld: 4_180 },
        { formType: "1098-T", issuer: "Lumen Education", amount: 2_600 },
      ],
    },
  },
  {
    filer: {
      id: "fil_shore",
      name: "Lila Shore",
      email: "lila.shore@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "3871",
      state: "MA",
    },
    taxReturn: {
      id: "ret_1050",
      number: "TY25-1050",
      status: "ACCEPTED",
      extendedOn: "2026-04-14",
      transmittedOn: "2026-09-14",
      acceptedOn: "2026-09-15",
      lastActivityOn: "2026-09-15",
      refund: 2_549,
      memo: "Includes the approved lifetime learning credit.",
      forms: [
        { formType: "W-2", issuer: "Copperleaf Atelier", amount: 59_800, withheld: 6_300 },
        { formType: "1098-T", issuer: "Lumen Education", amount: 6_500 },
      ],
    },
  },
];

type SeedReview = {
  id: string;
  returnId: string;
  credit: EducationCredit;
  status: "OPEN" | "NEEDS_REVIEW" | "APPROVED" | "DECLINED";
  reason: string;
  openedOn: string;
  /** Whole dollars. */
  qualifiedExpenses: number;
  claimed: number;
  expertNote?: string;
};

const REVIEWS: SeedReview[] = [
  {
    // The $4,000 claim is valid input for the $2,500 per-student cap. Do not "correct" it.
    id: "rev_1043",
    returnId: "ret_1043",
    credit: "AOTC",
    status: "NEEDS_REVIEW",
    reason:
      "Filer entered the full $4,000 of tuition from the 1098-T as the credit. One student, first year at Lumen Education.",
    openedOn: "2026-10-01",
    qualifiedExpenses: 4_000,
    claimed: 4_000,
  },
  {
    id: "rev_1044",
    returnId: "ret_1044",
    credit: "AOTC",
    status: "OPEN",
    reason:
      "Expenses are under $2,000, so all of it counts toward the credit. Confirm the student was enrolled at least half-time.",
    openedOn: "2026-10-05",
    qualifiedExpenses: 1_800,
    claimed: 1_800,
  },
  {
    id: "rev_1047",
    returnId: "ret_1047",
    credit: "LLC",
    status: "OPEN",
    reason:
      "Graduate courses. Filer applied 20% to all $12,000 of expenses. The lifetime learning credit counts only the first $10,000.",
    openedOn: "2026-09-28",
    qualifiedExpenses: 12_000,
    claimed: 2_400,
  },
  {
    id: "rev_1049",
    returnId: "ret_1049",
    credit: "AOTC",
    status: "NEEDS_REVIEW",
    reason: "Second-year student. Filer entered the $2,600 of expenses as the credit.",
    openedOn: "2026-10-03",
    qualifiedExpenses: 2_600,
    claimed: 2_600,
  },
  {
    id: "rev_1050",
    returnId: "ret_1050",
    credit: "LLC",
    status: "APPROVED",
    reason: "Professional certificate courses. Filer claimed 20% of $6,500 in expenses.",
    openedOn: "2026-09-08",
    qualifiedExpenses: 6_500,
    claimed: 1_300,
    expertNote: "Approved at 20% of $6,500 in qualified expenses.",
  },
];

async function main() {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
  });

  await prisma.creditReview.deleteMany();
  await prisma.taxForm.deleteMany();
  await prisma.taxReturn.deleteMany();
  await prisma.filer.deleteMany();
  await prisma.workspace.deleteMany();

  await prisma.workspace.create({
    data: {
      id: WORKSPACE_ID,
      name: "TurboTax Expert Ops",
      slug: "expert-ops",
      createdAt: demoDay("2025-11-04"),
    },
  });

  for (const { filer, taxReturn } of [...CORE_FILINGS, ...EXTRA_FILINGS]) {
    await prisma.filer.create({
      data: {
        ...filer,
        workspaceId: WORKSPACE_ID,
        createdAt: demoDay("2026-01-20"),
      },
    });

    await prisma.taxReturn.create({
      data: {
        id: taxReturn.id,
        number: taxReturn.number,
        workspaceId: WORKSPACE_ID,
        filerId: filer.id,
        taxYear: TAX_YEAR,
        status: taxReturn.status,
        dueOn: taxReturn.extendedOn ? EXTENSION_DEADLINE : FILING_DEADLINE,
        extendedOn: day(taxReturn.extendedOn),
        transmittedOn: day(taxReturn.transmittedOn),
        acceptedOn: day(taxReturn.acceptedOn),
        rejectedOn: day(taxReturn.rejectedOn),
        rejectCode: taxReturn.rejectCode ?? null,
        lastActivityOn: demoDay(taxReturn.lastActivityOn),
        refundCents: dollars(taxReturn.refund),
        memo: taxReturn.memo ?? null,
        forms: {
          create: taxReturn.forms.map((form, index) => ({
            id: `frm_${taxReturn.id.slice(4)}_${index + 1}`,
            formType: form.formType,
            issuer: form.issuer,
            amountCents: dollars(form.amount),
            withheldCents: dollars(form.withheld ?? 0),
          })),
        },
      },
    });
  }

  for (const review of REVIEWS) {
    const qualifiedExpensesCents = dollars(review.qualifiedExpenses);
    await prisma.creditReview.create({
      data: {
        id: review.id,
        returnId: review.returnId,
        workspaceId: WORKSPACE_ID,
        credit: review.credit,
        status: review.status,
        reason: review.reason,
        openedOn: demoDay(review.openedOn),
        qualifiedExpensesCents,
        claimedCents: dollars(review.claimed),
        allowedCreditCents: allowedEducationCreditCents({
          credit: review.credit,
          qualifiedExpensesCents,
        }),
        expertNote: review.expertNote ?? null,
      },
    });
  }

  const [filers, returns, reviews] = await Promise.all([
    prisma.filer.count(),
    prisma.taxReturn.count(),
    prisma.creditReview.count(),
  ]);
  console.log(
    `Seeded TurboTax Expert Ops · ${filers} filers (${EXTRA_FILINGS.length} extra) · ${returns} returns · ${reviews} credit reviews`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
