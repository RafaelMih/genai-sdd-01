const BLOCKER_MARKERS = ["tbd", "to decide", "undecided", "decide later", "placeholder"];

export type SpecBlocker = {
  marker: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function checkSpecForBlockers(content: string): SpecBlocker[] {
  const blockers: SpecBlocker[] = [];

  for (const marker of BLOCKER_MARKERS) {
    const re = new RegExp(`\\b${escapeRegExp(marker)}\\b`, "i");
    if (re.test(content)) {
      blockers.push({ marker });
    }
  }

  return blockers;
}

export function formatBlockerError(feature: string, blockers: SpecBlocker[]): string {
  const list = blockers.map((b) => `"${b.marker}"`).join(", ");
  return `[spec:lint] Bloqueio pré-retrieval: spec "${feature}" contém marcadores não resolvidos: ${list}. Resolva antes de recuperar o contexto.`;
}
