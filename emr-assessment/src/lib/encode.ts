/**
 * A report is fully described by the visitor's profile and answers, so the share
 * URL encodes them directly. No database is needed and the report is identical
 * every time it's opened. Contact details are never part of the encoding.
 */
import { allItems, evaluation, type AnswerId, type ProgramId } from "./content";
import type { Answers, Profile } from "./scoring";

const VERSION = 1;
const ANSWER_CODES: (AnswerId | null)[] = [null, "yes", "partial", "no", "unsure"];
const PROGRAM_CODES: ProgramId[] = ["home-health", "hospice", "both"];
const MAX_AGENCY = 80;

export interface ReportInput {
  profile: Profile;
  answers: Answers;
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = typeof btoa === "function" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function sanitizeAgency(name: string | undefined): string {
  return (name ?? "")
    .replace(/[\u0000-\u001f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_AGENCY);
}

export function encodeReport({ profile, answers }: ReportInput): string {
  // Three bits per item, in content order.
  const bits: number[] = [];
  for (const item of allItems) {
    const code = Math.max(0, ANSWER_CODES.indexOf(answers[item.id] ?? null));
    bits.push((code >> 2) & 1, (code >> 1) & 1, code & 1);
  }
  const packed = new Uint8Array(Math.ceil(bits.length / 8));
  bits.forEach((bit, i) => {
    if (bit) packed[i >> 3] |= 0x80 >> (i & 7);
  });

  const frustrationMask = evaluation.frustrations.reduce(
    (mask, f, i) => (profile.frustrations.includes(f.id) ? mask | (1 << i) : mask),
    0,
  );
  const header = [
    VERSION,
    PROGRAM_CODES.indexOf(profile.program),
    Math.max(0, evaluation.locationOptions.indexOf(profile.locations)),
    frustrationMask,
  ];
  const states = profile.states.filter((s) => /^[A-Z]{2}$/.test(s)).join("");
  const agency = new TextEncoder().encode(sanitizeAgency(profile.agency));

  const out = new Uint8Array(header.length + 1 + states.length + 1 + agency.length + packed.length);
  let o = 0;
  for (const h of header) out[o++] = h;
  out[o++] = states.length;
  for (const ch of states) out[o++] = ch.charCodeAt(0);
  out[o++] = agency.length;
  out.set(agency, o);
  o += agency.length;
  out.set(packed, o);
  return toBase64Url(out);
}

export function decodeReport(id: string): ReportInput | null {
  try {
    if (!/^[A-Za-z0-9_-]{10,600}$/.test(id)) return null;
    const bytes = fromBase64Url(id);
    let o = 0;
    const version = bytes[o++];
    if (version !== VERSION) return null;
    const program = PROGRAM_CODES[bytes[o++]];
    const locations = evaluation.locationOptions[bytes[o++]];
    const frustrationMask = bytes[o++];
    if (!program || !locations) return null;

    const statesLen = bytes[o++];
    if (statesLen % 2 !== 0 || statesLen > 120) return null;
    let stateStr = "";
    for (let i = 0; i < statesLen; i++) stateStr += String.fromCharCode(bytes[o++]);
    const states = stateStr.match(/[A-Z]{2}/g) ?? [];

    const agencyLen = bytes[o++];
    if (agencyLen > MAX_AGENCY * 4) return null;
    const agency = sanitizeAgency(new TextDecoder().decode(bytes.slice(o, o + agencyLen)));
    o += agencyLen;

    const packed = bytes.slice(o);
    if (packed.length !== Math.ceil((allItems.length * 3) / 8)) return null;
    const bit = (i: number) => (packed[i >> 3] >> (7 - (i & 7))) & 1;
    const answers: Answers = {};
    allItems.forEach((item, idx) => {
      const code = (bit(idx * 3) << 2) | (bit(idx * 3 + 1) << 1) | bit(idx * 3 + 2);
      const answer = ANSWER_CODES[code];
      if (answer) answers[item.id] = answer;
    });

    const frustrations = evaluation.frustrations.filter((_, i) => frustrationMask & (1 << i)).map((f) => f.id);
    return { profile: { program, locations, states, frustrations, agency }, answers };
  } catch {
    return null;
  }
}
