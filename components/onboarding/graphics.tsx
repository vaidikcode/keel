export function Marquee({ text }: { text: string }) {
  const loop = `${text}  ·  ${text}  ·  ${text}  ·  ${text}  ·  `;
  return (
    <div className="relative overflow-hidden border-b border-carbon bg-carbon py-2 text-paper-white">
      <div className="keel-marquee flex w-max gap-0 font-aeonik-pro text-[12px] font-bold tracking-[0.032em] uppercase">
        <span className="px-4">{loop}</span>
        <span className="px-4" aria-hidden>
          {loop}
        </span>
      </div>
    </div>
  );
}

export function LogoMark() {
  return (
    <span className="inline-flex size-10 items-center justify-center rounded-full border border-carbon bg-paper-white font-aeonik-pro text-[13px] font-bold tracking-[0.032em]">
      K
    </span>
  );
}

export function Ribbon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 360"
      fill="none"
      aria-hidden
    >
      <defs>
        <filter id="keel-grain" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0.3
                    0 0 0 0 0.64
                    0 0 0 0 1
                    0 0 0 0.18 0"
            result="tinted"
          />
          <feBlend in="SourceGraphic" in2="tinted" mode="multiply" />
        </filter>
      </defs>
      <path
        d="M-60 210 C 140 30, 320 330, 560 150 S 900 40, 1260 200"
        stroke="#4da2ff"
        strokeWidth="88"
        strokeLinecap="round"
        filter="url(#keel-grain)"
      />
    </svg>
  );
}

export function Stickers() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <span className="sticker -rotate-12 bg-ember left-[8%] top-[22%] md:left-[14%] md:top-[26%]">
        <RocketIcon />
      </span>
      <span className="sticker rotate-8 bg-sunburst right-[10%] top-[18%] md:right-[16%] md:top-[22%]">
        <CoinIcon />
      </span>
      <span className="sticker rotate-[-6deg] bg-voltage-violet bottom-[18%] left-[18%] md:bottom-[22%] md:left-[22%]">
        <WalletIcon />
      </span>
      <span className="sticker rotate-12 bg-mint-pop right-[14%] bottom-[16%] md:right-[20%] md:bottom-[20%]">
        <CheckIcon />
      </span>
    </div>
  );
}

function RocketIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="#000" strokeWidth="1.6">
      <path d="M14 4c2.5 1 5 4.2 6 7-2.8 1-6 1.4-8.4.4L10 10.2C9 7.8 10.2 5.2 14 4Z" />
      <path d="M9.8 10.4 7 13.2l3.8.6" />
      <path d="M8.2 16.5c-.8 1.6-2.2 2.8-4.2 3.4.6-2 1.8-3.4 3.4-4.2" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="#000" strokeWidth="1.6">
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 8.5v7M9.5 10.2c.5-.7 1.4-1.1 2.5-1.1 1.6 0 2.6.7 2.6 1.8s-1 1.7-2.6 1.7H11c-1.6 0-2.6.6-2.6 1.7 0 1.1 1.1 1.8 2.7 1.8 1.2 0 2.1-.4 2.6-1.1" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="#000" strokeWidth="1.6">
      <rect x="4" y="7" width="16" height="11" rx="2.5" />
      <path d="M4 10h16" />
      <circle cx="16.2" cy="13.6" r="1" fill="#000" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="#000" strokeWidth="2">
      <path d="m6.5 12.5 3.4 3.4 7.6-7.8" />
    </svg>
  );
}
