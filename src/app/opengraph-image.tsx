import { ImageResponse } from "next/og";

export const alt = "Bagel Watch";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Fetch Bebas Neue from Google Fonts for the display text
  let fontData: ArrayBuffer | null = null;
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (url) fontData = await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    // fall back to system bold if font fetch fails
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090B",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontData ? "Bebas Neue" : "sans-serif",
          gap: 0,
        }}
      >
        {/* Yellow zero badge */}
        <div
          style={{
            width: 130,
            height: 130,
            borderRadius: "50%",
            border: "6px solid #FACC15",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <span style={{ fontSize: 72, color: "#FACC15", lineHeight: 1 }}>0</span>
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: 112,
            color: "white",
            letterSpacing: 6,
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          BAGEL WATCH
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 30,
            color: "#71717A",
            maxWidth: 760,
            textAlign: "center",
            lineHeight: 1.5,
            fontFamily: "sans-serif",
            fontWeight: 400,
          }}
        >
          The league&apos;s official record of every starter who scored zero points — and the beer chugs that follow.
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#FACC15",
          }}
        />
      </div>
    ),
    {
      ...size,
      ...(fontData
        ? {
            fonts: [
              {
                name: "Bebas Neue",
                data: fontData,
                style: "normal",
                weight: 400,
              },
            ],
          }
        : {}),
    }
  );
}
