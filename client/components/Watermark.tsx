import React from "react";

interface WatermarkProps {
  text?: string;
  small?: boolean;
  className?: string;
  variant?: "badge" | "pattern";
  opacity?: number; // 0..1
  angle?: number; // degrees
}

export default function Watermark({
  text = "ashishproperties.in",
  small = false,
  className = "",
  variant = "pattern",
  opacity = 0.12,
  angle = -30,
}: WatermarkProps) {
  if (variant === "badge" || small) {
    return (
      <div
        className={[
          "pointer-events-none select-none absolute bottom-1 left-1/2 -translate-x-1/2 z-10",
          small ? "text-[10px] px-2 py-0.5" : "text-xs px-2 py-0.5",
          "font-semibold text-white rounded bg-black/40 shadow",
          className,
        ].join(" ")}
      >
        {text}
      </div>
    );
  }

  const tileW = 260;
  const tileH = 180;
  const fontSize = 18;
  const svg = encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='${tileW}' height='${tileH}'>
      <defs>
        <style>
          text{font-family: sans-serif; font-weight:600; font-size:${fontSize}px; fill:#000; opacity:${opacity};}
        </style>
      </defs>
      <g transform='rotate(${angle} ${tileW/2} ${tileH/2})'>
        <text x='20' y='${tileH/2}'>${text}</text>
      </g>
    </svg>
  `);

  return (
    <div
      aria-hidden
      className={["pointer-events-none select-none absolute inset-0 z-10", className].join(" ")}
      style={{
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundRepeat: "repeat",
        backgroundSize: `${tileW}px ${tileH}px`,
        backgroundPosition: "center",
        backgroundAttachment: "local",
        mixBlendMode: "multiply",
      }}
    />
  );
}
