import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#fbf8fa",
        "surface-muted": "#F8FAFC",
        "grid-border": "#E2E8F0",
        primary: "#091426",
        "risk-on-track": "#10B981",
        "risk-watch": "#F59E0B",
        "risk-action": "#EF4444",
        "risk-critical": "#111827",
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

