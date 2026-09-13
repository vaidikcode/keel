import { z } from "zod";

export const analyzedAssetSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
  ticker: z.string().min(1).max(20),
  exchange: z.string().max(30),
  platform: z.enum(["Groww", "Zerodha", "Other"]),
  question: z.string().min(1).max(500),
  summary: z.string().min(1).max(700),
  sourceIds: z.array(z.string().url()).max(5),
  analyzedAt: z.number(),
});

export type AnalyzedAsset = z.infer<typeof analyzedAssetSchema>;

