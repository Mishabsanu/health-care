import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0f766e",
          light: "#14b8a6",
          dark: "#134e4a",
        },
        secondary: "#0ea5e9",
        accent: "#f59e0b",
        bg: {
          main: "#f8fafc",
          sidebar: "#0f172a",
        },
        text: {
          main: "#1e293b",
          muted: "#64748b",
        }
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.75rem',
        'lg': '1.25rem',
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(0,0,0,0.05)',
        'premium-hover': '0 20px 50px -12px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
};
export default config;
