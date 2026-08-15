import { ImageResponse } from "next/og";

export const alt = "Bagel Watch";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090B",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
        }}
      >
        <div
          style={{
            width: 260,
            height: 260,
            borderRadius: "50%",
            border: "16px solid #FACC15",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 160, color: "#FACC15", fontWeight: "bold", lineHeight: 1 }}>0</span>
        </div>
        <span style={{ fontSize: 96, color: "white", fontWeight: "bold", letterSpacing: 8 }}>
          BAGEL WATCH
        </span>
      </div>
    ),
    { ...size },
  );
}
