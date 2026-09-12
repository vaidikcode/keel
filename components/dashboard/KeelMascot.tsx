"use client";
import { useId } from "react";
export function KeelMascot({
  mood = "idle",
  size = 100,
  paused = false,
}: {
  mood?: "idle" | "wave" | "thinking" | "point" | "question";
  size?: number;
  paused?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className={`mascot mascot-${mood} ${paused ? "motion-paused" : ""}`}
      width={size}
      height={size}
      viewBox="0 0 160 160"
      role="img"
      aria-label={`Keel, your investing companion${mood === "thinking" ? ", thinking" : ""}`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#6aaefa" />
          <stop offset="1" stopColor="#2563d4" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="140" rx="43" ry="7" fill="#123450" opacity=".09" />
      <g className="mascot-body">
        <path
          className="fin-left"
          d="M35 86C9 71 8 99 29 114L49 104Z"
          fill="#2b6bd4"
        />
        <path
          className="fin-right"
          d="M122 84C148 69 155 92 133 112L113 104Z"
          fill="#2b6bd4"
        />
        <path
          d="M27 72C27 31 131 27 134 75C138 107 116 132 81 133C49 134 27 110 27 72Z"
          fill={`url(#${id})`}
        />
        <path
          d="M40 64C42 42 70 39 83 41"
          fill="none"
          stroke="#c5e3ff"
          strokeWidth="6"
          strokeLinecap="round"
          opacity=".65"
        />
        <ellipse cx="64" cy="79" rx="13" ry="17" fill="#fff" />
        <ellipse cx="105" cy="77" rx="13" ry="17" fill="#fff" />
        <g className="mascot-eyes">
          <ellipse cx="68" cy="81" rx="6" ry="9" fill="#17334e" />
          <ellipse cx="109" cy="79" rx="6" ry="9" fill="#17334e" />
          <circle cx="70" cy="78" r="2" fill="white" />
          <circle cx="111" cy="76" r="2" fill="white" />
        </g>
        <ellipse cx="49" cy="99" rx="9" ry="5" fill="#c0dfff" opacity=".6" />
        <ellipse cx="119" cy="97" rx="8" ry="5" fill="#c0dfff" opacity=".6" />
        {mood === "question" ? (
          <ellipse cx="87" cy="106" rx="4" ry="5" fill="#17334e" />
        ) : (
          <path
            d="M76 103Q86 116 97 102"
            fill="none"
            stroke="#17334e"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}
      </g>
      {mood === "thinking" && (
        <g className="thinking-dots" fill="#437edc">
          <circle cx="122" cy="27" r="3" />
          <circle cx="134" cy="22" r="4" />
          <circle cx="149" cy="19" r="5" />
        </g>
      )}
    </svg>
  );
}
