import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { PilotError } from "./http";
import { pilotSecret as secret,digest,equal,participantId as identify,testerCodes } from "./identity";
import { dataDirectory } from "./storage";
import { eraseUsageReference } from "./analytics";

export function feedbackConfigured() {return Boolean(process.env.FEEDBACK_SECRET && process.env.FEEDBACK_SECRET.length >= 32 && process.env.PILOT_TESTER_CODES?.trim());}
export function analysisToken(id: string): string | null {
  if (!feedbackConfigured()) return null;
  const payload = Buffer.from(JSON.stringify({id,at: Date.now(),mode: "live"})).toString("base64url");
  return payload + "." + digest("analysis:"+payload);
}
export function verifyAnalysis(token: string, now = Date.now()) {
  const [payload,signature,extra] = token.split(".");
  if (extra || !payload || !signature || !equal(digest("analysis:"+payload),signature)) throw new PilotError("Analysis receipt is invalid. Generate a live brief first.");
  let parsed: {id: string; at: number; mode: "live"};
  try {parsed = z.object({id: z.string().uuid(),at: z.number().int(),mode: z.literal("live")}).parse(JSON.parse(Buffer.from(payload,"base64url").toString()));}
  catch {throw new PilotError("Analysis receipt is invalid.");}
  if (now-parsed.at > 86_400_000 || parsed.at-now > 30_000) throw new PilotError("Feedback receipt expired. Generate another live brief.");
  return parsed;
}
export const feedbackSchema = z.object({
  consent: z.literal(true), testerCode: z.string().trim().max(80).default(""), token: z.string().max(1000),
  selfReportedLp: z.literal(true),
  understood: z.enum(["yes","partly","no"]),
  withdrawalCostsIncluded: z.enum(["yes","no","unsure"]),
  usefulInsight: z.enum(["yes","no","unsure"]), overlookedCosts: z.enum(["yes","no","unsure"]),
  intendedBefore: z.enum(["hold","rebalance","exit","undecided"]), intendedAfter: z.enum(["hold","rebalance","exit","undecided"]),
  useAgain: z.enum(["yes","no","unsure"]),
  payIntent: z.enum(["no","maybe","request-paid-pilot"]), monthlyAmount: z.number().int().min(0).max(10000),
  comment: z.string().max(0).default("")
}).strict();
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type FeedbackRecord = Omit<FeedbackInput,"consent" | "testerCode" | "token"> & {
  id: string; participantId: string; analysisId: string; analysisAt: number; savedAt: number;
  consentVersion: "2026-10-20-v1"; comprehensionCheckPassed: boolean; changedDecision: boolean;
  deletionHash: string; verifiedLp: false; crediblePaymentEvidence: false;
};
export const feedbackDirectory=dataDirectory;
export async function saveFeedback(raw: unknown,sessionPid?:string) {
  const parsed = feedbackSchema.safeParse(raw);
  if (!parsed.success) throw new PilotError("Complete the feedback questions and give explicit storage consent. Nothing was saved.");
  const v = parsed.data, codes = testerCodes();
  secret();
  if (sessionPid ? !codes.some(c=>identify(c)===sessionPid)||(v.testerCode!==""&&identify(v.testerCode)!==sessionPid) : !codes.includes(v.testerCode)) throw new PilotError("Tester code was not recognized. Ask the facilitator for your invitation code.", 403);
  const receipt = verifyAnalysis(v.token);
  const participantId = sessionPid||identify(v.testerCode), id = randomUUID(), deleteToken = randomBytes(32).toString("hex");
  // Idempotency: one response per participant + analysis, using an exclusive file create.
  const filename = digest("feedback:"+participantId+":"+receipt.id) + ".json";
  const {consent: _consent, testerCode: _code, token: _token, ...answers} = v;
  const record: FeedbackRecord = {...answers,id,participantId,analysisId: receipt.id,analysisAt: receipt.at,savedAt: Date.now(),
    consentVersion: "2026-10-20-v1", comprehensionCheckPassed: v.withdrawalCostsIncluded === "no",
    changedDecision: v.intendedBefore !== v.intendedAfter, deletionHash: digest("delete:"+deleteToken),
    verifiedLp: false, crediblePaymentEvidence: false};
  await mkdir(feedbackDirectory(), {recursive:true, mode:0o700});
  try {await writeFile(path.join(feedbackDirectory(),filename),JSON.stringify(record,null,2),{flag:"wx",mode:0o600});}
  catch (e) {
    if ((e as NodeJS.ErrnoException).code === "EEXIST") throw new PilotError("Feedback for this analysis was already saved.",409);
    throw new PilotError("Feedback could not be written to persistent storage. Nothing was accepted; contact the facilitator.",503);
  }
  // Opaque path selector cannot escape the configured directory. Secret token is returned only now.
  return {id, receipt: filename.slice(0,-5), deleteToken};
}
export async function deleteFeedback(receipt: string, token: string) {
  if (!/^[a-f0-9]{64}$/.test(receipt) || !/^[a-f0-9]{64}$/.test(token)) throw new PilotError("Invalid deletion receipt.");
  const file = path.join(feedbackDirectory(),receipt+".json");
  let record: FeedbackRecord;
  try {record = JSON.parse(await readFile(file,"utf8"));} catch {throw new PilotError("Feedback record not found.",404);}
  if (!equal(record.deletionHash,digest("delete:"+token))) throw new PilotError("Deletion token did not match.",403);
  await eraseUsageReference(record.participantId,record.id);
  await unlink(file);
}
