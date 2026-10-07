import { cn } from "@/lib/utils";

/**
 * Folded return. Keep this geometry in sync with public/logo.svg,
 * public/favicon.svg, and public/images/logo-mark.svg.
 */
export function LogoMark({
  className,
  variant = "onIndigo",
}: {
  className?: string;
  variant?: "onIndigo" | "onLight";
}) {
  const onIndigo = variant === "onIndigo";
  const page = onIndigo ? "#ffffff" : "#4F46E5";
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill={onIndigo ? "#4F46E5" : "#ffffff"} />
      <path d="M21 13h16l10 10v24a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4V17a4 4 0 0 1 4-4Z" fill={page} />
      <path d="M37 13v7a3 3 0 0 0 3 3h7L37 13Z" fill="#CDC9F9" />
      <rect x="23" y="30" width="18" height="3.5" rx="1.75" fill="#8B85F0" />
      <rect x="23" y="38" width="12" height="3.5" rx="1.75" fill="#CDC9F9" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="size-8 shrink-0" />
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold tracking-tight text-foreground">TurboTax</span>
        <span className="text-[11px] font-medium text-muted-foreground">Expert Ops</span>
      </span>
    </span>
  );
}
