export const palette = {
  primary: {
    base: "#2563EB",
    hover: "#1D4ED8",
    surface: "rgba(37,99,235,0.08)",
  },
  neutral: {
    50: "#F5F7FB",
    100: "#E2E8F0",
    200: "#CBD5F5",
    300: "#94A3B8",
    400: "#64748B",
    500: "#475467",
    600: "#334155",
    700: "#1E293B",
    800: "#0F172A",
    900: "#0B1220",
  },
  success: {
    base: "#16A34A",
    surface: "rgba(22,163,74,0.12)",
  },
  warning: {
    base: "#F79009",
    surface: "rgba(247,144,9,0.12)",
  },
  danger: {
    base: "#DC2626",
    surface: "rgba(220,38,38,0.12)",
  },
  info: {
    base: "#0EA5E9",
    surface: "rgba(14,165,233,0.1)",
  },
};

export const typography = {
  fontFamily: "var(--font-geist-sans, 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif)",
  headings: {
    hero: "text-5xl md:text-6xl font-bold tracking-tight text-[var(--heading-color)]",
    h1: "text-4xl font-bold tracking-tight text-[var(--heading-color)]",
    h2: "text-3xl font-semibold tracking-tight text-[var(--heading-color)]",
    h3: "text-2xl font-semibold tracking-tight text-[var(--heading-color)]",
    h4: "text-xl font-semibold tracking-tight text-[var(--heading-color)]",
    eyebrow: "text-xs font-semibold tracking-[0.35em] uppercase text-[var(--muted-text)]",
    subtitle: "text-lg text-[var(--muted-text)]",
  },
  body: {
    large: "text-lg text-[var(--subtle-text)]",
    base: "text-base text-[var(--subtle-text)]",
    small: "text-sm text-[var(--muted-text)]",
    micro: "text-xs text-[var(--muted-text)] uppercase tracking-wide",
  },
};

export const layout = {
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-10",
  sectionSpacing: "py-16 md:py-20",
  card: "card-surface",
  glass: "glass-panel",
};

export const shadows = {
  soft: "shadow-[0_25px_50px_-12px_rgba(15,23,42,0.25)]",
  ring: "shadow-[0_20px_45px_-15px_rgba(59,130,246,0.45)]",
};

export const theme = {
  palette,
  typography,
  layout,
  shadows,
};

export type Theme = typeof theme;
