import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "h-8 w-auto", href = "/" }: { className?: string; href?: string | null }) {
  const img = (
    <Image src="/brand/careficient-logo-white.png" alt="Careficient" width={1049} height={280} priority className={className} />
  );
  return href ? (
    <Link href={href} aria-label="Careficient home" className="inline-flex items-center">
      {img}
    </Link>
  ) : (
    img
  );
}

export function SiteHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
      <Logo className="h-7 w-auto sm:h-8" />
      <div className="flex items-center gap-3">{right}</div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-10 mx-auto mt-24 flex w-full max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 px-4 py-10 text-sm text-muted sm:flex-row sm:px-6">
      <div className="flex items-center gap-3">
        <Logo className="h-6 w-auto" href={null} />
        <span className="hidden sm:inline">Purpose Built for Care. Powered by Partnership.</span>
      </div>
      <p className="text-center">
        No patient information is collected. ·{" "}
        <a className="underline decoration-white/30 underline-offset-4 hover:text-white" href="https://careficient.com">
          careficient.com
        </a>
      </p>
    </footer>
  );
}
