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
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: "50%",
            border: "18px solid #FACC15",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 180, color: "#FACC15", fontWeight: "bold", lineHeight: 1 }}>0</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
