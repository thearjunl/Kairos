import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "s-bg": "#080c10",
        "s-surface": "#0d1117",
        "s-card": "#111820",
        "s-border": "#1e2d3d",
        "s-cyan": "#00d4ff",
        "s-green": "#00ff87",
        "s-amber": "#ffaa00",
        "s-red": "#ff3333",
        "s-purple": "#9d6eff",
        "s-text": "#e0eaf4",
        "s-muted": "#5a7a94",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        display: ["Rajdhani", "sans-serif"],
      },
      keyframes: {
        "slide-in": {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "pulse-red": {
          "0%, 100%": { borderColor: "#ff333380" },
          "50%": { borderColor: "#ff3333" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "count-up": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-red": "pulse-red 1.5s ease-in-out infinite",
        "fade-in": "fade-in 0.2s ease-out",
        "count-up": "count-up 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
