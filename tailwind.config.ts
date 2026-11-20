import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--color-primary, #635BFF)",
          50: "var(--color-primary-light, #eef2ff)",
          100: "var(--color-primary-light, #e0e7ff)",
          500: "var(--color-primary, #635BFF)",
          600: "var(--color-primary, #4f46e5)",
          700: "var(--color-primary-hover, #4338ca)",
        },
        brand: {
          primary: "var(--color-primary, #635BFF)",
          light: "var(--color-primary-light, #F0EEFF)",
          border: "var(--color-primary-border, #D8D4FF)",
          accent: "var(--color-accent, #00D4B2)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
