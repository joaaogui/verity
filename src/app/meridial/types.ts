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

export const extractionResponseSchema = z.object({
  fullName: z.string().default(""),
  streetAddress: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  zipCode: z.string().default(""),
  country: z.string().default(""),
});
