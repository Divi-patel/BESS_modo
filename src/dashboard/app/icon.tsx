import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d1117",
          borderRadius: 6,
        }}
      >
        {/* Battery body */}
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
              width: 10,
              height: 3,
              background: "#3fb950",
              borderRadius: 1,
            }}
          />
          {/* Battery outline */}
          <div
            style={{
              width: 20,
              height: 24,
              border: "2px solid #3fb950",
              borderRadius: 3,
              display: "flex",
              alignItems: "flex-end",
              padding: 2,
            }}
          >
            {/* Fill level */}
            <div
              style={{
                width: "100%",
                height: "75%",
                background: "linear-gradient(to top, #3fb950, #58a6ff)",
                borderRadius: 1,
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
