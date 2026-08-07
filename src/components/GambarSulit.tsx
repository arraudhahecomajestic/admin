import React from "react";

// Label palang pada salinan dokumen sulit (IC & swafoto).
const LABEL = "Untuk Kegunaan Surau Ar-Raudhah Eco Majestic Sahaja";

function watermarkBg(): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='170'>` +
    `<text x='150' y='90' font-family='Arial, Helvetica, sans-serif' font-size='12' ` +
    `fill='rgba(184,134,11,0.5)' text-anchor='middle' transform='rotate(-24 150 90)'>` +
    LABEL +
    `</text></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// Gambar dengan palang air (watermark) berulang — untuk salinan IC & swafoto.
// Pure presentational; selamat digunakan dalam Server Component.
export default function GambarSulit({
  src,
  alt,
  imgStyle,
  className,
}: {
  src: string;
  alt: string;
  imgStyle?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={className} style={{ position: "relative", overflow: "hidden", display: "block" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ display: "block", ...imgStyle }} />
      <div
        aria-hidden
        style={
          {
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: watermarkBg(),
            backgroundRepeat: "repeat",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          } as React.CSSProperties
        }
      />
    </div>
  );
}
