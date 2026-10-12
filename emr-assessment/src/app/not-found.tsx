import Link from "next/link";
import { SiteHeader } from "@/components/brand/Logo";
import { NetworkBackdrop } from "@/components/ui/NetworkBackdrop";

export default function NotFound() {
  return (
    <>
      <NetworkBackdrop />
      <SiteHeader />
      <main id="main" className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="eyebrow">Not found</p>
        <h1 className="mt-3 text-3xl font-extrabold">We couldn&apos;t find that report.</h1>
        <p className="mt-3 text-white/70">The link may be incomplete. You can take the assessment again in about 5 minutes.</p>
        <Link href="/assessment" className="btn-primary mt-8">
          Start my assessment
        </Link>
      </main>
    </>
  );
}
