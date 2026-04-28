import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ['"Geist Mono"', "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--background))",
          card: "hsl(var(--surface-card))",
          elevated: "hsl(var(--surface-elevated))",
        },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        nomad: {
          green: "#6B9455",
          "green-dark": "#8AB86E",
          "green-pale": "#AACF8E",
          sand: "#C4955A",
          terracotta: "#A0765E",
          ink: "#1A1A17",
          paper: "#FBFAF8",
          dark: "#0F0F0D",
          "dark-card": "#161614",
          "dark-elev": "#1C1C19",
          "dark-raised": "#2A2A25",
          "dark-text": "#E8E3D8",
          "dark-mute": "#9A9589",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.16, 1, 0.3, 1)",
        enter: "cubic-bezier(0.0, 0.0, 0.2, 1)",
        exit: "cubic-bezier(0.4, 0, 1, 1)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
