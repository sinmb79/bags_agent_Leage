import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f8fafc",
        ink: "#0f172a",
        accent: {
          DEFAULT: "#16a34a",
          soft: "#dcfce7",
          muted: "#f0fdf4"
        },
        prize: {
          gold: "#ca8a04",
          silver: "#64748b",
          bronze: "#c2410c"
        }
      },
      boxShadow: {
        card: "0 16px 40px -24px rgba(15, 23, 42, 0.3)"
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.08) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;

