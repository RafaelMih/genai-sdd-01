import fs from "node:fs";
import path from "node:path";

const root = path.resolve("specs/features");
const lintAllVersions = process.env.SPEC_LINT_ALL === "1";

type Severity = "BLOCKER" | "WARN";

type LintIssue = {
  severity: Severity;
  message: string;
};

type SpecFileInfo = {
  file: string;
  feature: string;
  version: [number, number, number];
};

const requiredTopLevelPatterns = [
  {
    name: 'H1 "# Feature Spec:"',
    pattern: /^#\s+Feature Spec:/m,
    severity: "BLOCKER" as Severity,
  },
  {
    name: "Version line",
    pattern: /^Version:\s+v?\d+\.\d+\.\d+/m,
    severity: "BLOCKER" as Severity,
  },
  {
    name: "Status line",
    pattern: /^Status:\s+(Draft|Approved|Blocked|Deprecated)$/m,
    severity: "BLOCKER" as Severity,
  },
];

const sectionAliases: Record<string, string[]> = {
  objective: ["objective", "goal", "goals", "objetivo"],
  scope: ["scope", "in scope", "in-scope", "escopo"],
  "out of scope": [
    "out of scope",
    "out-of-scope",
    "excluded",
    "non-goals",
    "non goals",
    "fora do escopo",
  ],
  "acceptance criteria": [
    "acceptance criteria",
    "acceptance criterion",
    "acceptance",
    "criteria",
    "critérios de aceitação",
  ],
  dependencies: ["dependencies", "depends on", "dependency", "dependências"],
  tests: ["tests", "test strategy", "test cases", "testing", "testes"],
  "open questions": [
    "open questions",
    "open question",
    "questões em aberto",
    "questão em aberto",
  ],
};

const vagueTermsWarn = [
  "rápido",
  "intuitivo",
  "bonito",
  "moderno",
  "amigável",
  "eficiente",
  "otimizado",
  "simple",
  "easy",
  "seamless",
  "robust",
  "user-friendly",
];

const unresolvedMarkersBlocker = [
  "tbd",
  "to decide",
  "undecided",
  "decide later",
  "placeholder",
];

const unresolvedMarkersWarn = [
  "todo",
  "open question",
  "open questions",
  "questão em aberto",
  "questões em aberto",
];

const subjectivePatternsWarn = [
  /good user experience/i,
  /better performance/i,
  /fast login/i,
  /clear error/i,
  /boa experiência/i,
  /melhor performance/i,
  /login rápido/i,
  /erro claro/i,
];

const observableBehaviorPattern =
  /\b(must|shall|shows|show|redirects|redirect|returns|return|blocks|block|displays|display|creates|create|updates|update|deletes|delete|removes|remove|saves|save|calls|call|rejects|reject|allows|allow|prevents|prevent|disables|disable|enables|enable|navigates|navigate|opens|open|visible|deve|exibe|exibir|mostra|mostrar|redireciona|redirecionar|retorna|retornar|bloqueia|bloquear|cria|criar|atualiza|atualizar|deleta|deletar|remove|remover|salva|salvar|chama|chamar|rejeita|rejeitar|permite|permitir|previne|prevenir|desabilita|desabilitar|habilita|habilitar|navega|navegar|abre|abrir|visível)\b/i;

const explicitContextPattern =
  /\b(when|if|after|before|on|upon|given|then|while|during|quando|se|após|antes|ao|dado|então|enquanto|durante|caso)\b/i;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

function normalizeSectionName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseVersionFromPath(file: string): [number, number, number] | null {
  const normalized = file.replace(/\\/g, "/");

  const nested = normalized.match(/\/v(\d+)\.(\d+)\.(\d+)\/spec\.md$/i);
  if (nested) {
    return [Number(nested[1]), Number(nested[2]), Number(nested[3])];
  }

  const flat = normalized.match(/spec-v(\d+)\.(\d+)\.(\d+)\.md$/i);
  if (flat) {
    return [Number(flat[1]), Number(flat[2]), Number(flat[3])];
  }

  return null;
}

function extractFeatureFromPath(file: string): string | null {
  const normalized = file.replace(/\\/g, "/");

  const nested = normalized.match(
    /specs\/features\/([^/]+)\/v\d+\.\d+\.\d+\/spec\.md$/i,
  );
  if (nested) {
    return nested[1];
  }

  const flat = normalized.match(
    /specs\/features\/([^/]+)\/spec-v\d+\.\d+\.\d+\.md$/i,
  );
  if (flat) {
    return flat[1];
  }

  return null;
}

function compareVersions(
  a: [number, number, number],
  b: [number, number, number],
): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  if (a[1] !== b[1]) return a[1] - b[1];
  return a[2] - b[2];
}

function collectSpecFiles(dir: string): SpecFileInfo[] {
  const out: SpecFileInfo[] = [];
  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const normalizedFull = full.replace(/\\/g, "/");

    if (entry.isDirectory()) {
      out.push(...collectSpecFiles(full));
      continue;
    }

    const isVersionedSpecFile = /spec-v\d+\.\d+\.\d+\.md$/i.test(entry.name);
    const isNestedVersionSpec = /\/v\d+\.\d+\.\d+\/spec\.md$/i.test(
      normalizedFull,
    );

    if (!isVersionedSpecFile && !isNestedVersionSpec) continue;

    const feature = extractFeatureFromPath(full);
    const version = parseVersionFromPath(full);

    if (!feature || !version) continue;

    out.push({ file: full, feature, version });
  }

  return out;
}

function selectFilesToLint(files: SpecFileInfo[]): string[] {
  if (lintAllVersions) {
    return files.map((item) => item.file).sort();
  }

  const latestByFeature = new Map<string, SpecFileInfo>();

  for (const item of files) {
    const existing = latestByFeature.get(item.feature);

    if (!existing || compareVersions(item.version, existing.version) > 0) {
      latestByFeature.set(item.feature, item);
    }
  }

  return [...latestByFeature.values()]
    .sort((a, b) => a.feature.localeCompare(b.feature))
    .map((item) => item.file);
}

function canonicalizeSectionName(raw: string): string {
  const normalized = normalizeSectionName(raw);

  for (const [canonical, aliases] of Object.entries(sectionAliases)) {
    if (aliases.includes(normalized)) {
      return canonical;
    }
  }

  return normalized;
}

function getSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = normalizeWhitespace(text).split("\n");

  let current = "__root__";
  sections[current] = "";

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+?)\s*$/);

    if (h2) {
      current = canonicalizeSectionName(h2[1]);
      sections[current] ??= "";
      continue;
    }

    sections[current] ??= "";
    sections[current] += `${line}\n`;
  }

  return sections;
}

function pushIssue(
  issues: LintIssue[],
  severity: Severity,
  message: string,
): void {
  issues.push({ severity, message });
}

function lintTopLevel(text: string, issues: LintIssue[]): void {
  for (const rule of requiredTopLevelPatterns) {
    if (!rule.pattern.test(text)) {
      pushIssue(
        issues,
        rule.severity,
        `Missing required pattern: ${rule.name}`,
      );
    }
  }
}

function lintRequiredSections(
  sections: Record<string, string>,
  issues: LintIssue[],
): void {
  const alwaysRequired = [
    "objective",
    "scope",
    "out of scope",
    "acceptance criteria",
    "dependencies",
    "tests",
  ];

  for (const canonicalName of alwaysRequired) {
    if (!sections[canonicalName] || !sections[canonicalName].trim()) {
      pushIssue(
        issues,
        "BLOCKER",
        `Missing required section: "## ${canonicalName}"`,
      );
    }
  }
}

function lintVagueLanguage(text: string, issues: LintIssue[]): void {
  for (const term of vagueTermsWarn) {
    const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, "i");
    if (re.test(text)) {
      pushIssue(issues, "WARN", `Vague term found: "${term}"`);
    }
  }

  const hasResolvedOpenQuestions =
    /##\s+open questions\s*\n+\s*(none|nenhuma)\.?\s*$/im.test(text) ||
    /##\s+questões em aberto\s*\n+\s*(none|nenhuma)\.?\s*$/im.test(text);

  for (const marker of unresolvedMarkersBlocker) {
    const re = new RegExp(`\\b${escapeRegExp(marker)}\\b`, "i");
    if (re.test(text)) {
      pushIssue(issues, "BLOCKER", `Unresolved marker found: "${marker}"`);
    }
  }

  if (!hasResolvedOpenQuestions) {
    for (const marker of unresolvedMarkersWarn) {
      const re = new RegExp(`\\b${escapeRegExp(marker)}\\b`, "i");
      if (re.test(text)) {
        pushIssue(
          issues,
          "WARN",
          `Potential unresolved marker found: "${marker}"`,
        );
      }
    }
  }

  for (const pattern of subjectivePatternsWarn) {
    if (pattern.test(text)) {
      pushIssue(
        issues,
        "WARN",
        `Subjective or unverifiable wording found: ${pattern}`,
      );
    }
  }
}

function extractAcceptanceCriteriaItems(acText: string): string[] {
  const lines = acText.split("\n");
  const items: string[] = [];
  let current = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^(- |\* )?AC[-\s]?\d+[:.)]/i.test(line)) {
      if (current) items.push(current.trim());
      current = line.replace(/^(- |\* )/, "");
      continue;
    }

    if (current) {
      current += ` ${line}`;
    }
  }

  if (current) {
    items.push(current.trim());
  }

  return items;
}

function lintAcceptanceCriteria(
  acText: string | undefined,
  issues: LintIssue[],
): void {
  if (!acText || !acText.trim()) {
    pushIssue(issues, "BLOCKER", "Acceptance criteria block not found.");
    return;
  }

  const items = extractAcceptanceCriteriaItems(acText);

  if (items.length === 0) {
    pushIssue(
      issues,
      "BLOCKER",
      "Acceptance criteria block has no list items.",
    );
    return;
  }

  items.forEach((item, index) => {
    const label = `AC-${index + 1}`;

    if (item.length < 12) {
      pushIssue(issues, "WARN", `${label}: too short to be testable.`);
    }

    if (
      /\b(friendly|clear|simple|easy|intuitive|fast|quick|good|amigável|claro|simples|fácil|intuitivo|rápido|bom)\b/i.test(
        item,
      )
    ) {
      pushIssue(
        issues,
        "WARN",
        `${label}: contains subjective wording: "${item}"`,
      );
    }

    if (!observableBehaviorPattern.test(item)) {
      pushIssue(
        issues,
        "WARN",
        `${label}: may not define observable behavior clearly: "${item}"`,
      );
    }

    if (!explicitContextPattern.test(item)) {
      pushIssue(
        issues,
        "WARN",
        `${label}: may not define an explicit trigger or context: "${item}"`,
      );
    }

    if (/\bshould\b/i.test(item)) {
      pushIssue(
        issues,
        "BLOCKER",
        `${label}: uses "should", which is not strict enough: "${item}"`,
      );
    }
  });
}

function lintTestsSection(
  testsText: string | undefined,
  issues: LintIssue[],
): void {
  if (!testsText || !testsText.trim()) {
    pushIssue(issues, "BLOCKER", "Tests section not found.");
    return;
  }

  const meaningfulContent = testsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith(">"));

  if (meaningfulContent.length === 0) {
    pushIssue(issues, "BLOCKER", "Tests section is empty.");
  }
}

function lintOpenQuestions(
  sections: Record<string, string>,
  issues: LintIssue[],
): void {
  const openQuestions = sections["open questions"];

  if (!openQuestions) return;

  const normalized = openQuestions.trim().toLowerCase();

  if (!normalized) return;

  const isExplicitlyNone = /^(none|nenhuma)\.?$/i.test(normalized);

  if (isExplicitlyNone) return;

  pushIssue(
    issues,
    "WARN",
    'Open questions section is not explicitly resolved as "None" or "Nenhuma".',
  );
}

function lintFile(file: string): LintIssue[] {
  const raw = fs.readFileSync(file, "utf8");
  const text = normalizeWhitespace(raw);
  const sections = getSections(text);
  const issues: LintIssue[] = [];

  lintTopLevel(text, issues);
  lintRequiredSections(sections, issues);
  lintVagueLanguage(text, issues);
  lintAcceptanceCriteria(sections["acceptance criteria"], issues);
  lintTestsSection(sections["tests"], issues);
  lintOpenQuestions(sections, issues);

  return issues;
}

const specFiles = collectSpecFiles(root);
const filesToLint = selectFilesToLint(specFiles);

let hasBlocker = false;
let hasWarn = false;

for (const file of filesToLint) {
  const issues = lintFile(file);

  if (issues.length === 0) continue;

  console.error(`\n[spec-lint] ${file}`);

  for (const issue of issues) {
    if (issue.severity === "BLOCKER") hasBlocker = true;
    if (issue.severity === "WARN") hasWarn = true;
    console.error(` - [${issue.severity}] ${issue.message}`);
  }
}

if (hasBlocker) {
  process.exit(1);
}

if (hasWarn) {
  console.log("spec-lint passed with warnings");
  process.exit(0);
}

console.log("spec-lint passed");
