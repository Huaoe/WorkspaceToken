export const chartColors = {
  // Primary palette for main data series
  series: [
    "#4F46E5", // Indigo
    "#0EA5E9", // Sky blue
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#EC4899", // Pink
  ],

  // Secondary palette for supporting elements
  supporting: [
    "#6366F1", // Lighter indigo
    "#38BDF8", // Lighter sky
    "#34D399", // Lighter emerald
    "#FBBF24", // Lighter amber
    "#F472B6", // Lighter pink
  ],

  // Accent colors for highlights
  accent: {
    primary: "#4F46E5",    // Indigo
    secondary: "#0EA5E9",  // Sky blue
    success: "#10B981",    // Emerald
    warning: "#F59E0B",    // Amber
    error: "#EF4444",      // Red
  },

  // Neutral colors for backgrounds and text
  neutral: {
    background: "#FFFFFF",
    text: "#1F2937",
    textMuted: "#6B7280",
    border: "#E5E7EB",
    grid: "#F3F4F6",
  },

  // Dark mode colors
  dark: {
    background: "#1F2937",
    text: "#F9FAFB",
    textMuted: "#9CA3AF",
    border: "#374151",
    grid: "#374151",
  }
} as const;

export const chartTheme = {
  light: {
    background: chartColors.neutral.background,
    text: chartColors.neutral.text,
    textMuted: chartColors.neutral.textMuted,
    grid: chartColors.neutral.grid,
    border: chartColors.neutral.border,
  },
  dark: {
    background: chartColors.dark.background,
    text: chartColors.dark.text,
    textMuted: chartColors.dark.textMuted,
    grid: chartColors.dark.grid,
    border: chartColors.dark.border,
  }
} as const;

// Helper function to get current theme colors
export const getChartTheme = (isDark: boolean) => {
  return isDark ? chartTheme.dark : chartTheme.light;
};
