// Shared chart palette aligned with the brand.
export const CHART = {
  green: "#16A34A",
  greenDark: "#166534",
  yellow: "#FACC15",
  orange: "#FB923C",
  blue: "#0EA5E9",
  purple: "#8B5CF6",
  grid: "#EEF2EE",
  axis: "#9CA3AF",
};

export const PIE_COLORS = ["#16A34A", "#FACC15", "#FB923C", "#0EA5E9", "#8B5CF6", "#14B8A6"];

export const axisProps = {
  tick: { fontSize: 12, fill: CHART.axis },
  axisLine: false,
  tickLine: false,
} as const;
