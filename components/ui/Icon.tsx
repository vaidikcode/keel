import type { CSSProperties } from "react";
const paths = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  back: "M19 12H5m6-6-6 6 6 6",
  check: "m5 12 4 4L19 6",
  plus: "M12 5v14M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  bookmark: "M6 4h12v17l-6-4-6 4Z",
  chart: "M4 4v16h16M7 14l4-5 4 3 5-7",
  compass: "m16 8-3 5-5 3 3-5Z M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20",
  home: "m3 10 9-7 9 7v10h-6v-7H9v7H3Z",
  settings: "M4 7h16M4 17h16M9 4v6M15 14v6",
  help: "M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17h.01 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20",
  link: "M14 4h6v6m0-6L10 14M10 4H4v16h16v-6",
  pause: "M8 5v14M16 5v14",
  play: "m8 4 12 8-12 8Z",
  chevron: "m9 5 7 7-7 7",
  search: "m16 16 5 5M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z",
  globe:
    "M2 12h20M12 2c6 5 6 15 0 20-6-5-6-15 0-20 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20",
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
  chat: "M4 5h16v11H9l-5 4Z",
  layers: "m12 3 9 5-9 5-9-5Z M3 13l9 5 9-5",
  coins: "M12 3a8 3 0 1 0 0 6 8 3 0 0 0 0-6M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  building: "M4 21V5l8-3 8 3v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4",
  rocket: "M12 15c-3 0-5-2-5-2s2-9 5-11c3 2 5 11 5 11s-2 2-5 2Zm0 0v6M7 13l-3 3M17 13l3 3",
  drop: "M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z",
  external: "M14 4h6v6m0-6L10 14M10 4H4v16h16v-6",
  info: "M12 8h.01M11 12h1v5h1 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20",
};
export function Icon({
  name,
  size = 20,
  style,
}: {
  name: keyof typeof paths;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
