import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211c",
        paper: "#f8faf8",
        line: "#dfe8e2",
        moss: "#567a5a",
        leaf: "#1f8a5b",
        sky: "#3f7cac",
        coral: "#c76b56",
        honey: "#d4a537"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-news)", "Georgia", "serif"]
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 33, 28, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
