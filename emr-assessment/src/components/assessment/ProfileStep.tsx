"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { evaluation, type ProgramId } from "@/lib/content";
import { US_STATES } from "@/lib/states";
import type { Profile } from "@/lib/scoring";
import { SectionHeader } from "./SectionHeader";

export type DraftProfile = Partial<Profile> & { currentEmr?: string };

function Chip({ selected, onClick, children, ariaLabel }: { selected: boolean; onClick: () => void; children: React.ReactNode; ariaLabel?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      whileTap={reduce ? undefined : { scale: 0.95 }}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
        selected ? "border-cyan bg-cyan/15 text-white shadow-[0_0_18px_rgba(34,211,238,0.35)]" : "border-white/15 bg-white/[0.03] text-white/80 hover:border-sky/60"
      }`}
    >
      {children}
    </motion.button>
  );
}

export function ProfileStep({ profile, onChange, onNext }: { profile: DraftProfile; onChange: (p: DraftProfile) => void; onNext: () => void }) {
  const [stateFilter, setStateFilter] = useState("");
  const [touched, setTouched] = useState(false);
  const emrIsOther = profile.currentEmr !== undefined && profile.currentEmr !== "" && !evaluation.emrOptions.includes(profile.currentEmr);
  const [showOther, setShowOther] = useState(emrIsOther);

  const filteredStates = useMemo(() => {
    const q = stateFilter.trim().toLowerCase();
    return q ? US_STATES.filter(([code, name]) => code.toLowerCase() === q || name.toLowerCase().includes(q)) : US_STATES;
  }, [stateFilter]);

  const states = profile.states ?? [];
  const frustrations = profile.frustrations ?? [];
  const valid = Boolean(profile.program && profile.locations && states.length > 0);

  const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (valid) onNext();
      }}
      noValidate
    >
      <SectionHeader icon="nodes" eyebrow="Step 1 · Agency profile" title="Tell us about your agency" intro="This tailors your checklist and report. It takes about 30 seconds. No patient information is collected." />

      <div className="glass space-y-8 rounded-[24px] p-5 sm:p-8">
        <div>
          <label htmlFor="agency" className="block font-display font-bold">
            Agency name <span className="font-sans text-sm font-normal text-muted">(optional, shown on your report)</span>
          </label>
          <input
            id="agency"
            className="field mt-3 max-w-md"
            value={profile.agency ?? ""}
            maxLength={80}
            autoComplete="organization"
            onChange={(e) => onChange({ ...profile, agency: e.target.value })}
            placeholder="e.g. Prairie Home Health"
          />
        </div>

        <fieldset>
          <legend className="font-display font-bold">
            Programs <span className="text-bad">*</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {evaluation.programs.map((p) => (
              <Chip key={p.id} selected={profile.program === p.id} onClick={() => onChange({ ...profile, program: p.id as ProgramId })}>
                {p.label}
              </Chip>
            ))}
          </div>
          {profile.program && profile.program !== "home-health" ? (
            <p className="mt-2 text-xs text-cyan">The HOPE (hospice) section has been added to your checklist.</p>
          ) : null}
          {touched && !profile.program ? <p className="mt-2 text-sm text-bad">Choose your programs.</p> : null}
        </fieldset>

        <fieldset>
          <legend className="font-display font-bold">
            Number of locations <span className="text-bad">*</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {evaluation.locationOptions.map((l) => (
              <Chip key={l} selected={profile.locations === l} onClick={() => onChange({ ...profile, locations: l })}>
                {l}
              </Chip>
            ))}
          </div>
          {touched && !profile.locations ? <p className="mt-2 text-sm text-bad">Choose how many locations you operate.</p> : null}
        </fieldset>

        <fieldset>
          <legend className="font-display font-bold">
            States you operate in <span className="text-bad">*</span>
          </legend>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {states.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onChange({ ...profile, states: states.filter((s) => s !== code) })}
                className="inline-flex items-center gap-1 rounded-full bg-cyan/20 px-3 py-1 text-sm font-semibold text-white"
                aria-label={`Remove ${code}`}
              >
                {code} <span aria-hidden>×</span>
              </button>
            ))}
            <label htmlFor="state-filter" className="sr-only">
              Filter states
            </label>
            <input id="state-filter" className="field !w-48 !py-2 text-sm" placeholder="Search states…" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} />
          </div>
          <div className="mt-3 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1">
            {filteredStates.map(([code, name]) => (
              <button
                key={code}
                type="button"
                aria-pressed={states.includes(code)}
                aria-label={name}
                title={name}
                onClick={() => onChange({ ...profile, states: toggle(states, code) })}
                className={`w-12 rounded-lg border py-1.5 text-xs font-semibold transition-colors ${
                  states.includes(code) ? "border-cyan bg-cyan/20 text-white" : "border-white/10 bg-white/[0.03] text-white/70 hover:border-sky/50"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
          {touched && states.length === 0 ? <p className="mt-2 text-sm text-bad">Choose at least one state.</p> : null}
        </fieldset>

        <div>
          <label htmlFor="emr" className="block font-display font-bold">
            Current EMR <span className="font-sans text-sm font-normal text-muted">(optional, never shown in your report)</span>
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <select
              id="emr"
              className="field max-w-xs"
              value={showOther ? "__other" : profile.currentEmr ?? ""}
              onChange={(e) => {
                if (e.target.value === "__other") {
                  setShowOther(true);
                  onChange({ ...profile, currentEmr: "" });
                } else {
                  setShowOther(false);
                  onChange({ ...profile, currentEmr: e.target.value });
                }
              }}
            >
              <option value="">Prefer not to say</option>
              {evaluation.emrOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
              <option value="__other">Other</option>
            </select>
            {showOther ? (
              <>
                <label htmlFor="emr-other" className="sr-only">
                  Other EMR
                </label>
                <input
                  id="emr-other"
                  className="field max-w-xs"
                  placeholder="Which EMR?"
                  maxLength={80}
                  value={profile.currentEmr ?? ""}
                  onChange={(e) => onChange({ ...profile, currentEmr: e.target.value })}
                />
              </>
            ) : null}
          </div>
        </div>

        <fieldset>
          <legend className="font-display font-bold">
            Biggest frustrations <span className="font-sans text-sm font-normal text-muted">(choose any)</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {evaluation.frustrations.map((f) => (
              <Chip key={f.id} selected={frustrations.includes(f.id)} onClick={() => onChange({ ...profile, frustrations: toggle(frustrations, f.id) })}>
                {f.label}
              </Chip>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" aria-disabled={!valid}>
          Start the checklist
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
            <path d="M5 12h13M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </form>
  );
}
