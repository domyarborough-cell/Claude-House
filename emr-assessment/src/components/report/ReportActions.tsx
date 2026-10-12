"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { loadLeadReport } from "@/lib/storage";

const icon = {
  calendar: <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  mail: <path d="M4 6h16v12H4zM4 7l8 6 8-6" />,
  share: <path d="M8 12h.01M16 6l-6 4.5M16 18l-6-4.5M18 6a2 2 0 11-4 0 2 2 0 014 0zM18 18a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0z" />,
};

function Icon({ name }: { name: keyof typeof icon }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {icon[name]}
    </svg>
  );
}

export function ReportActions({ reportId, demoUrl, shareUrl, score }: { reportId: string; demoUrl: string; shareUrl: string; score: number }) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const share = async () => {
    track("report_shared", { method: "navigator" in globalThis && "share" in navigator ? "native" : "copy" });
    const data = { title: "Our EMR Intelligence Assessment", text: `Our current EMR scored ${score}/50 on the Careficient EMR Intelligence Assessment.`, url: shareUrl };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
    } catch {
      // Fall through to copying the link when sharing is cancelled or unsupported.
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus("Report link copied. Paste it to your team.");
    } catch {
      setStatus(shareUrl);
    }
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    const res = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, reportId }),
    }).catch(() => null);
    setSending(false);
    if (res?.ok) {
      track("report_emailed");
      setStatus("Sent. Check your inbox.");
      setEmailOpen(false);
      return;
    }
    if (res?.status === 501) {
      // Email delivery isn't configured: hand off to the visitor's mail app.
      track("report_emailed", { method: "mailto" });
      window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("My EMR Intelligence Assessment")}&body=${encodeURIComponent(`My report: ${shareUrl}\nPDF: ${shareUrl.replace(/\/report\//, "/api/pdf/")}`)}`;
      setEmailOpen(false);
      return;
    }
    const data = (await res?.json().catch(() => null)) as { error?: string } | null;
    setStatus(data?.error ?? "We couldn't send the email. Please try again.");
  };

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <a href={demoUrl} target="_blank" rel="noopener" className="btn-primary !px-4 text-[15px] whitespace-nowrap" onClick={(e) => {
            track("demo_click", { score });
            // After the lead form, the server returns a demo link with the visitor's name and email pre-filled.
            const lead = loadLeadReport();
            if (lead?.reportId === reportId && lead.demoUrl) e.currentTarget.href = lead.demoUrl;
          }}
        >
          <Icon name="calendar" /> Book a personalized demo
        </a>
        <a href={`/api/pdf/${reportId}`} className="btn-ghost !px-4 text-[15px] whitespace-nowrap" onClick={() => track("pdf_download")} download>
          <Icon name="download" /> Download PDF report
        </a>
        <button type="button" className="btn-ghost !px-4 text-[15px] whitespace-nowrap" onClick={() => setEmailOpen((v) => !v)} aria-expanded={emailOpen} aria-controls="email-form">
          <Icon name="mail" /> Email me this report
        </button>
        <button type="button" className="btn-ghost !px-4 text-[15px] whitespace-nowrap" onClick={share}>
          <Icon name="share" /> Share with my team
        </button>
      </div>
      {emailOpen ? (
        <form id="email-form" onSubmit={sendEmail} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="report-email" className="sr-only">
            Email address
          </label>
          <input id="report-email" type="email" required className="field sm:max-w-sm" placeholder="you@agency.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <button type="submit" className="btn-primary" disabled={sending}>
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      ) : null}
      <p className="mt-3 min-h-5 text-sm text-cyan" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
