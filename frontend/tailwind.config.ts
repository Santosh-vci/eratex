import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#fbf8fa",
        "surface-dim": "#dcd9db",
        "surface-bright": "#fbf8fa",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f5f3f4",
        "surface-container": "#f0edef",
        "surface-container-high": "#eae7e9",
        "surface-container-highest": "#e4e2e3",
        "surface-muted": "#F8FAFC",
        "on-surface": "#1b1b1d",
        "on-surface-variant": "#45474c",
        outline: "#75777d",
        "outline-variant": "#c5c6cd",
        "grid-border": "#E2E8F0",
        primary: "#091426",
        "primary-container": "#1e293b",
        "on-primary-container": "#8590a6",
        secondary: "#515f74",
        "secondary-container": "#d5e3fd",
        "risk-on-track": "#10B981",
        "risk-watch": "#F59E0B",
        "risk-action": "#EF4444",
        "risk-critical": "#111827",
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
      spacing: {
        "grid-row": "32px",
        drawer: "400px",
        "nav-collapsed": "64px",
      },
    },
  },
  plugins: [],
};

export default config;
