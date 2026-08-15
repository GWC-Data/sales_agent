export const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');`;
export const DISPLAY = "'Space Grotesk', sans-serif";
export const MONO = "'JetBrains Mono', monospace";

export const STATUS = {
  cleared:   { label: "Auto-cleared", fg: "#059669", bg: "#ECFDF5", ring: "#A7F3D0" },
  approved:  { label: "Approved",     fg: "#059669", bg: "#ECFDF5", ring: "#A7F3D0" },
  sent:      { label: "Sent",         fg: "#059669", bg: "#ECFDF5", ring: "#A7F3D0" },
  low:       { label: "Low risk",     fg: "#059669", bg: "#ECFDF5", ring: "#A7F3D0" },
  exception: { label: "Exception",    fg: "#B45309", bg: "#FFFBEB", ring: "#FDE68A" },
  review:    { label: "Human Review", fg: "#B45309", bg: "#FFFBEB", ring: "#FDE68A" },
  medium:    { label: "Medium risk",  fg: "#B45309", bg: "#FFFBEB", ring: "#FDE68A" },
  pending:   { label: "Pending Review", fg: "#4F46E5", bg: "#EEF0FF", ring: "#C7D2FE" },
  moreinfo:  { label: "Info Requested", fg: "#4F46E5", bg: "#EEF0FF", ring: "#C7D2FE" },
  escalated: { label: "Escalated",    fg: "#DC2626", bg: "#FEF2F2", ring: "#FECACA" },
  returned:  { label: "Returned",     fg: "#DC2626", bg: "#FEF2F2", ring: "#FECACA" },
  rejected:  { label: "Rejected",     fg: "#DC2626", bg: "#FEF2F2", ring: "#FECACA" },
  high:      { label: "High risk",    fg: "#DC2626", bg: "#FEF2F2", ring: "#FECACA" },
  discarded: { label: "Discarded",    fg: "#6B7280", bg: "#F3F4F6", ring: "#E5E7EB" },
};

export function nowTs() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}
export function scoreStatus(score) {
  return score >= 90 ? "cleared" : score >= 75 ? "review" : "escalated";
}
