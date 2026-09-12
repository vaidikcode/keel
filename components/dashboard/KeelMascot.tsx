"use client";

type Side = "center" | "feed" | "filing" | "sleep";

export function KeelMascot({
  line,
  side,
  lineKey,
}: {
  line: string;
  side: Side;
  lineKey: string;
}) {
  const shift =
    side === "feed"
      ? "-translate-x-6 md:-translate-x-10"
      : side === "filing"
        ? "translate-x-6 md:translate-x-10"
        : side === "sleep"
          ? "translate-y-2"
          : "";

  return (
    <div
      className={`flex flex-col items-center gap-3 transition-transform duration-500 ease-out ${shift}`}
    >
      <span
        className="inline-flex size-12 items-center justify-center rounded-full border border-carbon bg-sunburst font-aeonik-pro text-[15px] font-bold tracking-[0.032em] md:size-14 md:text-[16px]"
        aria-hidden
      >
        K
      </span>
      <p
        key={lineKey}
        className="keel-in max-w-sm text-center font-aeonik-pro text-[15px] font-medium leading-[1.39] tracking-[-0.01em] text-carbon md:text-[16px]"
        role="status"
      >
        {line}
      </p>
    </div>
  );
}
