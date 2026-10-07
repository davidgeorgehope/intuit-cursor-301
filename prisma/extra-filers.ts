/**
 * Extra filers seeded alongside the ten core households.
 * Owned by the app. Same ids and rows on every reseed.
 */

import type { FormType } from "../lib/forms";
import type { RejectCode } from "../lib/rejects";
import type { ReturnStatus } from "../lib/status";

export type SeedForm = {
  formType: FormType;
  issuer: string;
  /** Whole dollars. */
  amount: number;
  withheld?: number;
};

export type SeedFiling = {
  filer: {
    id: string;
    name: string;
    email: string;
    filingStatus: "SINGLE" | "MFJ";
    ssnLast4: string;
    state: string;
  };
  taxReturn: {
    id: string;
    number: string;
    status: ReturnStatus;
    extendedOn?: string;
    transmittedOn?: string;
    acceptedOn?: string;
    rejectedOn?: string;
    rejectCode?: RejectCode;
    lastActivityOn: string;
    /** Whole dollars from the 2025 Tax Table and standard deduction. Negative is a balance due. */
    refund: number;
    memo?: string;
    forms: SeedForm[];
  };
};

export const EXTRA_FILINGS: SeedFiling[] = [
  {
    filer: {
      id: "fil_ellison",
      name: "Mara Ellison",
      email: "mara.ellison@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "4402",
      state: "MI",
    },
    taxReturn: {
      id: "ret_2001",
      number: "TY25-2001",
      status: "ACCEPTED",
      extendedOn: "2026-04-13",
      transmittedOn: "2026-09-04",
      acceptedOn: "2026-09-05",
      lastActivityOn: "2026-09-05",
      refund: 673,
      forms: [{ formType: "W-2", issuer: "Northstar Fabrication", amount: 72_600, withheld: 8_100 }],
    },
  },
  {
    filer: {
      id: "fil_kohl",
      name: "Devan & Rhea Kohl",
      email: "devan.kohl@mail.example",
      filingStatus: "MFJ",
      ssnLast4: "9134",
      state: "GA",
    },
    taxReturn: {
      id: "ret_2002",
      number: "TY25-2002",
      status: "ACCEPTED",
      extendedOn: "2026-04-15",
      transmittedOn: "2026-09-17",
      acceptedOn: "2026-09-18",
      lastActivityOn: "2026-09-18",
      refund: 910,
      forms: [
        { formType: "W-2", issuer: "North Star Logistics", amount: 95_400, withheld: 9_300 },
        { formType: "W-2", issuer: "Orchid Foods", amount: 38_200, withheld: 3_900 },
      ],
    },
  },
  {
    filer: {
      id: "fil_beaufort",
      name: "Ines Beaufort",
      email: "ines.beaufort@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "2758",
      state: "VA",
    },
    taxReturn: {
      id: "ret_2003",
      number: "TY25-2003",
      status: "READY",
      extendedOn: "2026-04-14",
      lastActivityOn: "2026-10-07",
      refund: 1_595,
      memo: "Expert review complete. Ready to transmit.",
      forms: [{ formType: "W-2", issuer: "Alder BioSystems", amount: 112_500, withheld: 17_800 }],
    },
  },
  {
    filer: {
      id: "fil_okafor",
      name: "Ray Okafor",
      email: "ray.okafor@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "6081",
      state: "NC",
    },
    taxReturn: {
      id: "ret_2004",
      number: "TY25-2004",
      status: "ACCEPTED",
      extendedOn: "2026-04-12",
      transmittedOn: "2026-09-23",
      acceptedOn: "2026-09-24",
      lastActivityOn: "2026-09-24",
      refund: -974,
      memo: "Balance due paid by direct debit with the return.",
      forms: [
        { formType: "W-2", issuer: "Juniper Public Works", amount: 64_300, withheld: 5_100 },
        { formType: "1099-INT", issuer: "Blue Harbor Bank", amount: 2_150 },
      ],
    },
  },
  {
    filer: {
      id: "fil_vos",
      name: "Sanne Vos",
      email: "sanne.vos@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "3519",
      state: "MN",
    },
    taxReturn: {
      id: "ret_2005",
      number: "TY25-2005",
      status: "ACCEPTED",
      extendedOn: "2026-04-14",
      transmittedOn: "2026-09-30",
      acceptedOn: "2026-10-01",
      lastActivityOn: "2026-10-01",
      refund: 1_497,
      forms: [{ formType: "W-2", issuer: "Helio Retail Group", amount: 51_900, withheld: 5_600 }],
    },
  },
  {
    filer: {
      id: "fil_merced",
      name: "Toni Merced",
      email: "toni.merced@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "7240",
      state: "FL",
    },
    taxReturn: {
      id: "ret_2006",
      number: "TY25-2006",
      status: "REJECTED",
      extendedOn: "2026-04-13",
      transmittedOn: "2026-10-04",
      rejectedOn: "2026-10-05",
      rejectCode: "IND-031-04",
      lastActivityOn: "2026-10-05",
      refund: 699,
      memo: "Filer amended the 2024 return in June and entered the amended AGI. Verification uses the original return's AGI.",
      forms: [{ formType: "W-2", issuer: "Cedar Health Network", amount: 76_800, withheld: 9_050 }],
    },
  },
  {
    filer: {
      id: "fil_whitlock",
      name: "Bram & Elin Whitlock",
      email: "bram.whitlock@mail.example",
      filingStatus: "MFJ",
      ssnLast4: "5596",
      state: "NJ",
    },
    taxReturn: {
      id: "ret_2007",
      number: "TY25-2007",
      status: "ACCEPTED",
      extendedOn: "2026-04-15",
      transmittedOn: "2026-10-05",
      acceptedOn: "2026-10-06",
      lastActivityOn: "2026-10-06",
      refund: 326,
      forms: [
        { formType: "W-2", issuer: "Vela Energy Systems", amount: 121_000, withheld: 14_800 },
        { formType: "W-2", issuer: "Stonebridge Media", amount: 44_800, withheld: 4_900 },
      ],
    },
  },
  {
    filer: {
      id: "fil_lindqvist",
      name: "Freja Lindqvist",
      email: "freja.lindqvist@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "8807",
      state: "WI",
    },
    taxReturn: {
      id: "ret_2008",
      number: "TY25-2008",
      status: "TRANSMITTED",
      extendedOn: "2026-04-14",
      transmittedOn: "2026-10-07",
      lastActivityOn: "2026-10-07",
      refund: 1_407,
      memo: "Awaiting IRS acknowledgment.",
      forms: [{ formType: "W-2", issuer: "Kestrel Mobility", amount: 58_900, withheld: 6_350 }],
    },
  },
  {
    filer: {
      id: "fil_alba",
      name: "Curtis Alba",
      email: "curtis.alba@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "1183",
      state: "NV",
    },
    taxReturn: {
      id: "ret_2009",
      number: "TY25-2009",
      status: "EXTENDED",
      extendedOn: "2026-04-15",
      lastActivityOn: "2026-09-30",
      refund: -239,
      memo: "Waiting on a 1099-INT from a closed savings account.",
      forms: [{ formType: "W-2", issuer: "Blue Harbor Bank", amount: 87_200, withheld: 10_400 }],
    },
  },
  {
    filer: {
      id: "fil_hollis",
      name: "Petra Hollis",
      email: "petra.hollis@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "4675",
      state: "PA",
    },
    taxReturn: {
      id: "ret_2010",
      number: "TY25-2010",
      status: "ACCEPTED",
      extendedOn: "2026-04-13",
      transmittedOn: "2026-08-13",
      acceptedOn: "2026-08-14",
      lastActivityOn: "2026-08-14",
      refund: 873,
      forms: [{ formType: "W-2", issuer: "Stonebridge Media", amount: 49_600, withheld: 4_700 }],
    },
  },
  {
    filer: {
      id: "fil_duarte",
      name: "Marisol Duarte",
      email: "marisol.duarte@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "2346",
      state: "NM",
    },
    taxReturn: {
      id: "ret_2011",
      number: "TY25-2011",
      status: "ACCEPTED",
      extendedOn: "2026-04-14",
      transmittedOn: "2026-08-26",
      acceptedOn: "2026-08-27",
      lastActivityOn: "2026-08-27",
      refund: 1_573,
      forms: [{ formType: "W-2", issuer: "Lumen Education", amount: 62_100, withheld: 6_900 }],
    },
  },
  {
    filer: {
      id: "fil_sook",
      name: "Hana & Joon Sook",
      email: "hana.sook@mail.example",
      filingStatus: "MFJ",
      ssnLast4: "9912",
      state: "CA",
    },
    taxReturn: {
      id: "ret_2012",
      number: "TY25-2012",
      status: "ACCEPTED",
      extendedOn: "2026-04-15",
      transmittedOn: "2026-09-02",
      acceptedOn: "2026-09-03",
      lastActivityOn: "2026-09-03",
      refund: 1_032,
      forms: [
        { formType: "W-2", issuer: "Orchid Foods", amount: 83_700, withheld: 8_900 },
        { formType: "W-2", issuer: "Redwood Components", amount: 47_500, withheld: 3_900 },
      ],
    },
  },
  {
    filer: {
      id: "fil_reyes",
      name: "Callum Reyes",
      email: "callum.reyes@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "7053",
      state: "OR",
    },
    taxReturn: {
      id: "ret_2013",
      number: "TY25-2013",
      status: "ACCEPTED",
      transmittedOn: "2026-04-08",
      acceptedOn: "2026-04-09",
      lastActivityOn: "2026-04-09",
      refund: 509,
      forms: [{ formType: "W-2", issuer: "Summit Aero", amount: 93_800, withheld: 12_600 }],
    },
  },
  {
    filer: {
      id: "fil_tran",
      name: "Josie Tran",
      email: "josie.tran@mail.example",
      filingStatus: "SINGLE",
      ssnLast4: "3398",
      state: "TX",
    },
    taxReturn: {
      id: "ret_2014",
      number: "TY25-2014",
      status: "ACCEPTED",
      transmittedOn: "2026-04-15",
      acceptedOn: "2026-04-16",
      lastActivityOn: "2026-04-16",
      refund: 521,
      forms: [{ formType: "W-2", issuer: "Redwood Components", amount: 44_200, withheld: 3_700 }],
    },
  },
];
