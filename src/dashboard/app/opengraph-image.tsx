import { ImageResponse } from "next/og";

export const alt = "ERCOT BESS Revenue — Hub & Node Analysis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          background: "linear-gradient(135deg, #0d1117, #161b22)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              padding: "6px 14px",
              background: "rgba(63, 185, 80, 0.15)",
              border: "1px solid rgba(63, 185, 80, 0.4)",
              borderRadius: 6,
              color: "#3fb950",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            GEN 1
          </div>
          <span style={{ color: "#8b949e", fontSize: 18 }}>
            Modo Energy Open Tech Challenge
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#e6edf3",
            lineHeight: 1.2,
            marginBottom: 20,
          }}
        >
          ERCOT BESS Revenue
        </div>
        <div
          style={{
            fontSize: 30,
            color: "#8b949e",
            marginBottom: 40,
          }}
        >
          Hub &amp; Node Energy Arbitrage Analysis
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 40 }}>
          {[
            { label: "Locations", value: "9" },
            { label: "Scenarios", value: "7,630" },
            { label: "Revenue Range", value: "$6K–$399K/yr" },
            { label: "Years", value: "2011–2025" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span style={{ color: "#58a6ff", fontSize: 32, fontWeight: 700 }}>
                {stat.value}
              </span>
              <span style={{ color: "#8b949e", fontSize: 16 }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Author */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 80,
            color: "#484f58",
            fontSize: 16,
          }}
        >
          Divy Patel &middot; 2026
        </div>
      </div>
    ),
    { ...size }
  );
}
