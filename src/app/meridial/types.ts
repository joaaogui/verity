import { z } from "zod";

export type Step = 1 | 2 | 3 | 4 | 5;

export interface AddressData {
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const safeString = z.preprocess(
  (v) => (v == null || v === "null" ? "" : v),
  z.string().default(""),
);

export const extractionResponseSchema = z.object({
  fullName: safeString,
  streetAddress: safeString,
  city: safeString,
  state: safeString,
  zipCode: safeString,
  country: safeString,
});
