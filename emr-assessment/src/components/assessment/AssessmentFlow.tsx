"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { evaluation, visibleSections, type AnswerId } from "@/lib/content";
import { encodeReport } from "@/lib/encode";
import { liveHealth, scoreAssessment, type Answers, type Profile } from "@/lib/scoring";
import { clearProgress, saveLeadReport, saveProgress, type SavedProgress } from "@/lib/storage";
import { prefetchNarrative } from "@/lib/narrative-client";
import { track } from "@/lib/analytics";
import { AnalyzingScreen } from "./AnalyzingScreen";
import { Celebration, type CelebrationState } from "./Celebration";
import { HealthDock } from "./HealthDock";
import { LeadCapture, type LeadFields } from "./LeadCapture";
import { ProfileStep, type DraftProfile } from "./ProfileStep";
import { SectionStep } from "./SectionStep";

type Phase = "steps" | "analyzing" | "lead";

// True when this browser has saved progress (the first, server-matching render passes saved = null).
function loadedFromStorage(): boolean {
  try {
    return Boolean(window.localStorage.getItem("careficient-emr-assessment:v1"));
  } catch {
    return false;
  }
}

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

export function AssessmentFlow({ saved }: { saved: SavedProgress | null }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [profile, setProfile] = useState<DraftProfile>(() => ({ states: [], frustrations: [], ...saved?.profile }));
  const [answers, setAnswers] = useState<Answers>(() => saved?.answers ?? {});
  const [step, setStep] = useState(() => saved?.step ?? 0); // 0 = profile, 1..n = sections
  const [phase, setPhase] = useState<Phase>("steps");
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [restored, setRestored] = useState(() => Boolean(saved && (Object.keys(saved.answers ?? {}).length > 0 || (saved.step ?? 0) > 0)));
  const gaugeRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!saved && !loadedFromStorage()) track("assessment_start");
  }, [saved]);

  useEffect(() => {
    // Never write an untouched, empty assessment: it would overwrite saved
    // progress before the restored copy mounts.
    const touched = step > 0 || Object.keys(answers).length > 0 || Boolean(profile.program || profile.locations || profile.agency || profile.states?.length);
    if (phase === "steps" && touched) saveProgress({ profile, answers, step });
  }, [profile, answers, step, phase]);

  const sections = useMemo(() => visibleSections(profile.program), [profile.program]);
  const totalSteps = sections.length + 1;
  const health = useMemo(() => liveHealth(answers, profile.program ?? null), [answers, profile.program]);
  const visibleItemIds = useMemo(() => sections.flatMap((s) => s.items.map((i) => i.id)), [sections]);
  const answeredCount = visibleItemIds.filter((id) => answers[id]).length;

  const fullProfile = useMemo<Profile | null>(
    () =>
      profile.program && profile.locations && profile.states?.length
        ? { program: profile.program, locations: profile.locations, states: profile.states, frustrations: profile.frustrations ?? [], agency: profile.agency }
        : null,
    [profile],
  );

  const score = useMemo(() => (fullProfile ? scoreAssessment(answers, fullProfile) : null), [answers, fullProfile]);

  const sectionsDone = useMemo(() => {
    if (!score) return [];
    return sections
      .slice(0, Math.max(0, step - 1))
      .map((s) => score.sections.find((r) => r.id === s.id)!)
      .filter(Boolean)
      .map((r) => ({ title: r.title, rating: r.rating }));
  }, [score, sections, step]);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });

  const goTo = (next: number) => {
    setStep(next);
    requestAnimationFrame(scrollTop);
  };

  const reportId = useCallback(
    (agencyOverride?: string) => (fullProfile ? encodeReport({ profile: { ...fullProfile, agency: agencyOverride ?? fullProfile.agency }, answers }) : ""),
    [fullProfile, answers],
  );

  const completeSection = () => {
    const section = sections[step - 1];
    const result = score?.sections.find((s) => s.id === section.id);
    track("section_complete", { section: section.id, rating: result?.rating ?? 0 });
    if (result) {
      const rect = gaugeRef.current?.getBoundingClientRect();
      setCelebration({
        id: Date.now(),
        title: section.title,
        rating: result.rating,
        origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        // On mobile the side gauge is hidden; fly to the bottom bar instead.
        dest: rect && rect.width > 0 ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: 48, y: window.innerHeight - 30 },
      });
    }
    if (step >= sections.length) {
      setPhase("analyzing");
      // Start the AI report now; the analyzing screen and lead form cover the wait.
      const id = reportId();
      if (id) prefetchNarrative(id);
    } else {
      goTo(step + 1);
    }
  };

  const submitLead = async (fields: LeadFields) => {
    if (!fullProfile) return;
    setSubmitting(true);
    setServerError(null);
    const id = reportId(fields.agency);
    prefetchNarrative(id);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          currentEmr: profile.currentEmr || undefined,
          reportId: id,
          pageUri: window.location.href,
          hutk: readCookie("hubspotutk"),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; demoUrl?: string };
      if (!res.ok || !data.ok) {
        setServerError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      track("lead_submitted", { score: score?.total ?? 0, band: score?.band.id ?? "" });
      saveLeadReport(id, data.demoUrl);
      clearProgress();
      router.push(`/report/${id}`);
    } catch {
      setServerError("We couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  const startOver = () => {
    clearProgress();
    setProfile({ states: [], frustrations: [] });
    setAnswers({});
    setStep(0);
    setRestored(false);
  };

  const progressPct = phase === "steps" ? (step / totalSteps) * 100 : 100;
  const currentSection = step > 0 ? sections[step - 1] : null;

  return (
    <div ref={topRef} className="scroll-mt-4">
      {/* Progress */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-deep/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-semibold text-white/85">{phase === "lead" ? "Your report" : step === 0 ? "Agency profile" : currentSection?.title}</span>
            <span>
              {phase === "steps" ? `Step ${step + 1} of ${totalSteps}` : "Complete"}
            </span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="Assessment progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressPct)}
          >
            <motion.div className="h-full rounded-full bg-gradient-to-r from-sky to-cyan shadow-[0_0_12px_#22D3EE]" animate={{ width: `${progressPct}%` }} transition={{ duration: reduce ? 0 : 0.5 }} />
          </div>
        </div>
      </div>

      {restored && phase === "steps" ? (
        <div className="mx-auto mt-4 flex max-w-7xl items-center justify-between gap-3 px-4 text-sm text-muted sm:px-6">
          <span>Welcome back. We saved your progress.</span>
          <button type="button" onClick={startOver} className="underline decoration-white/30 underline-offset-4 hover:text-white">
            Start over
          </button>
        </div>
      ) : null}

      <div className={`mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 ${phase === "steps" && step > 0 ? "lg:grid-cols-[1fr_280px]" : ""}`}>
        <main id="main" className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={phase === "steps" ? `step-${step}` : phase}
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {phase === "lead" && score ? (
                <LeadCapture score={score} initial={{ agency: profile.agency ?? "" }} submitting={submitting} serverError={serverError} onSubmit={submitLead} />
              ) : step === 0 ? (
                <ProfileStep
                  profile={profile}
                  onChange={setProfile}
                  onNext={() => {
                    track("profile_complete", { program: profile.program ?? "", locations: profile.locations ?? "" });
                    goTo(1);
                  }}
                />
              ) : currentSection ? (
                <SectionStep
                  section={currentSection}
                  index={step - 1}
                  count={sections.length}
                  answers={answers}
                  onAnswer={(itemId: string, a: AnswerId) => setAnswers((prev) => ({ ...prev, [itemId]: a }))}
                  onBack={() => goTo(step - 1)}
                  onNext={completeSection}
                  isLast={step === sections.length}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </main>
        {phase === "steps" && step > 0 ? (
          <HealthDock ref={gaugeRef} health={health} answered={answeredCount} total={visibleItemIds.length} pulseKey={pulseKey} sectionsDone={sectionsDone} />
        ) : null}
      </div>

      <Celebration
        state={celebration}
        onDone={() => {
          setCelebration(null);
          setPulseKey((k) => k + 1);
        }}
      />

      {phase === "analyzing" ? (
        <AnalyzingScreen sections={sections} answers={answers} durationMs={reduce ? 1200 : evaluation.settings.analyzingMinMs} onDone={() => { setPhase("lead"); requestAnimationFrame(scrollTop); }} />
      ) : null}
    </div>
  );
}
