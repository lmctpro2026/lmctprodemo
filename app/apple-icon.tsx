import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0d1117",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="160" height="160" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <circle cx="256" cy="256" r="200" fill="none" stroke="#c8a96e" strokeWidth="6" opacity="0.42" />
          <path
            d="M 88 304 L 136 304 Q 152 224 208 184 L 304 184 Q 360 224 376 304 L 424 304"
            fill="none"
            stroke="#c8a96e"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="88" y1="304" x2="144" y2="304" stroke="#c8a96e" strokeWidth="16" strokeLinecap="round" />
          <line x1="208" y1="304" x2="304" y2="304" stroke="#c8a96e" strokeWidth="16" strokeLinecap="round" />
          <line x1="368" y1="304" x2="424" y2="304" stroke="#c8a96e" strokeWidth="16" strokeLinecap="round" />
          <circle cx="176" cy="336" r="28" fill="#0d1117" stroke="#c8a96e" strokeWidth="14" />
          <circle cx="336" cy="336" r="28" fill="#0d1117" stroke="#c8a96e" strokeWidth="14" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
