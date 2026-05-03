export function formatCampNameLabel(raw: string): string {
  const collapsed = raw.replace(/\s+/g, " ").trim();
  if (!collapsed) return "Camp";
  return collapsed.slice(0, 56);
}

export function buildParticipantPublicId(
  campName: string,
  roleWord: "Donor" | "Volunteer",
  sequence: number,
): string {
  const label = formatCampNameLabel(campName);
  const padded = String(Math.max(1, sequence)).padStart(4, "0");
  return `${label} ${roleWord} ${padded}`;
}
