import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d1117, #161b22)",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Battery terminal */}
          <div
            style={{
              width: 50,
              height: 14,
              background: "#3fb950",
              borderRadius: 4,
            }}
          />
          {/* Battery outline */}
          <div
            style={{
              width: 100,
              height: 120,
              border: "6px solid #3fb950",
              borderRadius: 14,
              display: "flex",
              alignItems: "flex-end",
              padding: 8,
            }}
          >
            {/* Fill level */}
            <div
              style={{
                width: "100%",
                height: "75%",
                background: "linear-gradient(to top, #3fb950, #58a6ff)",
                borderRadius: 6,
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
