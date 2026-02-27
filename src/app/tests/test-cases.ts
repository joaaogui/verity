export interface TestCase {
  id: string;
  file: string;
  label: string;
  expectation: string;
  expectedMatch: boolean;
}

export const TEST_CASES: TestCase[] = [
  {
    id: "w2-blank",
    file: "test-docs/real/w2-form-irs.pdf",
    label: "W-2 blank (IRS)",
    expectation: "A blank IRS W-2 wage and tax statement form",
    expectedMatch: true,
  },
  {
    id: "w2-filled",
    file: "test-docs/real/w2-sample-pitt.pdf",
    label: "W-2 filled (Pitt)",
    expectation: "A recent monthly pay stub showing net pay",
    expectedMatch: false,
  },
  {
    id: "invoice",
    file: "test-docs/real/invoice-sliced.pdf",
    label: "Invoice (Sliced)",
    expectation: "A commercial invoice with line items and total amount",
    expectedMatch: true,
  },
  {
    id: "utility-crwwd",
    file: "test-docs/real/utility-bill-crwwd.pdf",
    label: "Utility bill (CRWWD)",
    expectation: "A utility bill showing account number and amount due",
    expectedMatch: true,
  },
  {
    id: "utility-wheaton",
    file: "test-docs/real/utility-bill-wheaton.pdf",
    label: "Utility bill (Wheaton)",
    expectation: "An electricity bill from ConEd for a New York apartment",
    expectedMatch: false,
  },
  {
    id: "1040-instructions",
    file: "test-docs/real/irs-1040-instructions.pdf",
    label: "1040 instructions (IRS)",
    expectation: "A completed Form 1040 individual tax return for 2025",
    expectedMatch: false,
  },
  {
    id: "passport-malaysia",
    file: "test-docs/real/passport-sample-malaysia.pdf",
    label: "Passport (Malaysia)",
    expectation: "A passport scan showing the holder's photo and personal information",
    expectedMatch: true,
  },
  {
    id: "passport-ultracamp",
    file: "test-docs/real/passport-sample-ultracamp.pdf",
    label: "Passport (Ultracamp)",
    expectation: "A US driver's license showing the holder's photo and address",
    expectedMatch: false,
  },
  {
    id: "1099",
    file: "test-docs/real/irs-form-1099.pdf",
    label: "1099 form (IRS)",
    expectation: "An IRS Form 1099 for miscellaneous income",
    expectedMatch: true,
  },
  {
    id: "w4",
    file: "test-docs/real/irs-form-w4.pdf",
    label: "W-4 form (IRS)",
    expectation: "A completed W-2 wage statement from the employer",
    expectedMatch: false,
  },
];
