"use client";
import { useState } from "react";
import { RadialGauge } from "@/components/ui/RadialGauge";
import { evaluation } from "@/lib/content";
import type { ScoreResult } from "@/lib/scoring";
import { bandColor, ratingColor } from "@/styles/tokens";

export interface LeadFields {
  firstName: string;
  lastName: string;
  email: string;
  agency: string;
  role: string;
  phone: string;
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label} {required ? <span className="text-bad" aria-hidden>*</span> : <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function LeadCapture({
  score,
  initial,
  submitting,
  serverError,
  onSubmit,
}: {
  score: ScoreResult;
  initial: Partial<LeadFields>;
  submitting: boolean;
  serverError: string | null;
  onSubmit: (fields: LeadFields) => void;
}) {
  const [f, setF] = useState<LeadFields>({ firstName: "", lastName: "", email: "", agency: "", role: "", phone: "", ...initial });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFields, string>>>({});

  const validate = (): boolean => {
    const e: Partial<Record<keyof LeadFields, string>> = {};
    if (!f.firstName.trim()) e.firstName = "Enter your first name.";
    if (!f.lastName.trim()) e.lastName = "Enter your last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Enter a valid work email.";
    if (!f.agency.trim()) e.agency = "Enter your agency name.";
    if (!f.role) e.role = "Choose your role.";
    if (f.phone && !/^[0-9+().\-\s]{7,25}$/.test(f.phone)) e.phone = "Enter a valid phone number.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const input = (key: keyof LeadFields, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input
      id={`lead-${key}`}
      className="field"
      value={f[key]}
      onChange={(e) => setF({ ...f, [key]: e.target.value })}
      aria-invalid={Boolean(errors[key])}
      aria-describedby={errors[key] ? `lead-${key}-error` : undefined}
      {...props}
    />
  );

  const band = score.band;
  const bc = bandColor(band.color);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.05fr]">
      {/* Teaser */}
      <div className="glass relative overflow-hidden rounded-[28px] p-6 sm:p-8">
        <p className="eyebrow">Your results are ready</p>
        <div className="mt-4 flex flex-col items-center">
          <RadialGauge value={score.total} max={50} size={210} label="EMR score" sublabel="out of 50" colorOverride={bc} />
          <span className="mt-2 rounded-full px-4 py-1.5 text-center text-sm font-bold" style={{ color: bc, background: `${bc}1f`, boxShadow: `0 0 24px ${bc}40` }}>
            {band.label}
          </span>
        </div>
        <div className="relative mt-6">
          <div className="space-y-3 blur-[6px] select-none" aria-hidden>
            {score.categories.slice(0, 6).map((c) => (
              <div key={c.id}>
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>{c.name}</span>
                  <span>?/5</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${c.rating * 20}%`, background: ratingColor(c.rating) }} />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="h-20 rounded-2xl bg-bad/20" />
              <div className="h-20 rounded-2xl bg-cyan/20" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl border border-white/15 bg-deep/80 px-5 py-4 text-center shadow-glow backdrop-blur">
              <p className="font-display text-lg font-bold">
                {score.highRiskGaps.length} high-risk gap{score.highRiskGaps.length === 1 ? "" : "s"} found
              </p>
              <p className="text-sm text-muted">Unlock the full category breakdown and solutions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        className="glass space-y-4 rounded-[28px] p-6 sm:p-8"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (validate()) onSubmit({ ...f, firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim(), agency: f.agency.trim() });
        }}
      >
        <div>
          <h2 className="text-2xl font-extrabold sm:text-3xl">See your full report</h2>
          <p className="mt-1 text-sm text-white/70">Includes your executive summary, category radar, every gap with how Careficient fills it, and a downloadable PDF.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="lead-firstName" label="First name" required error={errors.firstName}>
            {input("firstName", { autoComplete: "given-name", required: true, maxLength: 80 })}
          </Field>
          <Field id="lead-lastName" label="Last name" required error={errors.lastName}>
            {input("lastName", { autoComplete: "family-name", required: true, maxLength: 80 })}
          </Field>
        </div>
        <Field id="lead-email" label="Work email" required error={errors.email}>
          {input("email", { type: "email", autoComplete: "email", required: true, maxLength: 200, inputMode: "email" })}
        </Field>
        <Field id="lead-agency" label="Agency" required error={errors.agency}>
          {input("agency", { autoComplete: "organization", required: true, maxLength: 80 })}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="lead-role" label="Role" required error={errors.role}>
            <select
              id="lead-role"
              className="field"
              value={f.role}
              onChange={(e) => setF({ ...f, role: e.target.value })}
              aria-invalid={Boolean(errors.role)}
              aria-describedby={errors.role ? "lead-role-error" : undefined}
            >
              <option value="">Select…</option>
              {evaluation.roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field id="lead-phone" label="Phone" error={errors.phone}>
            {input("phone", { type: "tel", autoComplete: "tel", maxLength: 25, inputMode: "tel" })}
          </Field>
        </div>
        {/* Honeypot */}
        <div className="hidden" aria-hidden>
          <label htmlFor="lead-website">Website</label>
          <input id="lead-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        {serverError ? (
          <p role="alert" className="rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
            {serverError}
          </p>
        ) : null}
        <button type="submit" className="btn-primary w-full text-lg" disabled={submitting}>
          {submitting ? "Unlocking your report…" : "Unlock my full report"}
        </button>
        <p className="text-center text-xs text-muted">We&apos;ll never ask for patient information. Your answers stay private to your agency and Careficient.</p>
      </form>
    </div>
  );
}
