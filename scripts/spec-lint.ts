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
  "redirect contract": [
    "redirect contract",
    "redirects",
    "navigation contract",
    "contrato de redirect",
    "contrato de redirecionamento",
  ],
  "auth contract": [
    "auth contract",
    "authentication contract",
    "authorization contract",
    "contrato de autenticação",
    "contrato de auth",
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

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
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
    if (item.length < 12) {
      pushIssue(issues, "WARN", `AC-${index + 1}: too short to be testable.`);
    }

    if (
      /\b(friendly|clear|simple|easy|intuitive|fast|quick|good|amigável|claro|simples|fácil|intuitivo|rápido|bom)\b/i.test(
        item,
      )
    ) {
      pushIssue(
        issues,
        "WARN",
        `AC-${index + 1}: contains subjective wording: "${item}"`,
      );
    }

    if (
      !/\b(must|shall|shows|show|redirects|redirect|returns|return|blocks|block|displays|display|creates|create|rejects|reject|allows|allow|prevents|prevent|disables|disable|deve|exibe|exibir|redireciona|redirecionar|retorna|retornar|bloqueia|bloquear|cria|criar|rejeita|rejeitar|permite|permitir|previne|prevenir|desabilita|desabilitar|navigates|navigate|visible|opens|open)\b/i.test(
        item,
      )
    ) {
      pushIssue(
        issues,
        "WARN",
        `AC-${index + 1}: may not define observable behavior clearly: "${item}"`,
      );
    }

    if (/\bshould\b/i.test(item)) {
      pushIssue(
        issues,
        "BLOCKER",
        `AC-${index + 1}: uses "should", which is not strict enough: "${item}"`,
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

function lintAuthSpec(
  text: string,
  sections: Record<string, string>,
  issues: LintIssue[],
): void {
  const fullText = text;
  const fullTextLower = text.toLowerCase();
  const acText = sections["acceptance criteria"] ?? "";
  const redirectText =
    sections["redirect contract"] ??
    `${sections["acceptance criteria"] ?? ""}\n${text}`;

  const hasExplicitRedirectDestination = hasAny(redirectText, [
    /redirect(path)?\s*:\s*["'`]?\/[a-z0-9/_-]+["'`]?/i,
    /redirects?\s+to\s+["'`]?\/[a-z0-9/_-]+["'`]?/i,
    /redireciona(?:r)?\s+para\s+["'`]?\/[a-z0-9/_-]+["'`]?/i,
    /destino\s+do\s+redirect\s*:\s*["'`]?\/[a-z0-9/_-]+["'`]?/i,

    /path after successful sign-?in\s*:\s*["'`]?\/[a-z0-9/_-]+["'`]?/i,
    /path for already-authenticated users.*:\s*["'`]?\/[a-z0-9/_-]+["'`]?/i,

    /\|\s*successful sign-?in\s*\|[^|\n]*\|\s*\/[a-z0-9/_-]+\s*\|/i,
    /\|\s*user already authenticated\s*\|[^|\n]*\|\s*\/[a-z0-9/_-]+\s*\|/i,
    /\|\s*login bem-?sucedido\s*\|[^|\n]*\|\s*\/[a-z0-9/_-]+\s*\|/i,
    /\|\s*usuário já autenticado\s*\|[^|\n]*\|\s*\/[a-z0-9/_-]+\s*\|/i,
  ]);

  const hasPostLoginRedirectTrigger = hasAny(redirectText, [
    /after login/i,
    /on successful sign-?in/i,
    /successful sign-?in/i,
    /upon successful authentication/i,
    /após login/i,
    /após autenticação/i,
    /em caso de login bem-sucedido/i,
    /no sucesso do login/i,

    /\|\s*successful sign-?in\s*\|/i,
    /\|\s*login bem-?sucedido\s*\|/i,
  ]);

  const hasAlreadyAuthenticatedBehavior = hasAny(fullText, [
    /already-authenticated/i,
    /already authenticated/i,
    /if authenticated user visits \/login/i,
    /signed-in user navigates to \/login/i,
    /usuário autenticado.*\/login/i,
    /se o usuário já estiver autenticado/i,
    /ao acessar \/login já autenticado/i,

    /\|\s*user already authenticated\s*\|/i,
    /\|\s*usuário já autenticado\s*\|/i,
  ]);

  const hasRedirectNavigationMode = hasAny(redirectText, [
    /\breplace:\s*true\b/i,
    /\bpush\b/i,
    /\breplace\b/i,
    /navigation\s+mode\s*:\s*(push|replace)/i,
    /tipo\s+de\s+navegação\s*:\s*(push|replace)/i,
    /usar\s+replace/i,
    /usar\s+push/i,

    /\|\s*successful sign-?in\s*\|[^|\n]*\|[^|\n]*\|\s*(push|replace)\s*\|/i,
    /\|\s*user already authenticated\s*\|[^|\n]*\|[^|\n]*\|\s*(push|replace)\s*\|/i,
    /\|\s*login bem-?sucedido\s*\|[^|\n]*\|[^|\n]*\|\s*(push|replace)\s*\|/i,
    /\|\s*usuário já autenticado\s*\|[^|\n]*\|[^|\n]*\|\s*(push|replace)\s*\|/i,
  ]);

  const hasProvisioning = hasAny(fullText, [
    /sign-up/i,
    /signup/i,
    /pre-seeded/i,
    /pre seeded/i,
    /admin-created/i,
    /admin created/i,
    /account provisioning/i,
    /account creation/i,
    /accounts are created/i,
    /cadastro/i,
    /provisionamento/i,
    /conta.*criada/i,
    /contas são criadas/i,
  ]);

  const hasErrorContract = hasAny(fullText, [
    /auth\/[a-z-]+/i,
    /error code/i,
    /error mapping/i,
    /invalid email or password/i,
    /network-request-failed/i,
    /wrong-password/i,
    /user-not-found/i,
    /código de erro/i,
    /mapeamento de erro/i,
    /email ou senha inválidos/i,
    /erro de autenticação/i,
    /mensagem de erro/i,
  ]);

  const hasLoadingState = hasAny(fullText, [
    /loading state/i,
    /pending state/i,
    /spinner/i,
    /button disabled/i,
    /disable submit during request/i,
    /submitting/i,
    /estado de carregamento/i,
    /estado pendente/i,
    /botão desabilitado/i,
    /desabilita.*submit/i,
    /enviando/i,
    /loading indicator/i,
    /indicador de carregamento/i,
  ]);

  const mentionsSecurityRules = hasAny(fullText, [
    /security-rules/i,
    /security rules/i,
    /regras de segurança/i,
  ]);

  const explainsFirestoreInteraction = hasAny(fullText, [
    /firestore/i,
    /document creation/i,
    /users\/\{uid\}/i,
    /create.*user document/i,
    /post-login write/i,
    /post login write/i,
    /criação de documento/i,
    /documento do usuário/i,
    /escrita pós-login/i,
  ]);

  const hasExplicitRedirectUndecided = hasAny(fullTextLower, [
    /dashboard\s+path\s+is\s+undecided/i,
    /\/dashboard\s+vs\s+\/app/i,
    /redirect\s+path\s+undecided/i,
    /destino\s+do\s+redirect\s+indefinido/i,
    /redirect\s+entre\s+\/dashboard\s+e\s+\/app/i,
    /redirecionamento\s+ainda\s+não\s+decidido/i,
  ]);

  const mentionsRedirect = hasAny(fullText, [
    /\bredirect\b/i,
    /\bredirecion/i,
    /\/login/i,
    /\/dashboard/i,
  ]);

  if (hasExplicitRedirectUndecided) {
    pushIssue(
      issues,
      "BLOCKER",
      "[auth] Contains unresolved redirect path decision.",
    );
  }

  if (mentionsRedirect && !sections["redirect contract"]) {
    pushIssue(
      issues,
      "WARN",
      '[auth] Redirect behavior exists without a dedicated "## redirect contract" section.',
    );
  }

  if (!hasExplicitRedirectDestination) {
    pushIssue(
      issues,
      "BLOCKER",
      "[auth] Missing explicit redirect destination path.",
    );
  }

  if (!hasPostLoginRedirectTrigger) {
    pushIssue(
      issues,
      "BLOCKER",
      "[auth] Missing explicit post-login redirect trigger.",
    );
  }

  if (!hasAlreadyAuthenticatedBehavior) {
    pushIssue(
      issues,
      "BLOCKER",
      "[auth] Missing behavior for already-authenticated users visiting /login.",
    );
  }

  if (!hasRedirectNavigationMode) {
    pushIssue(
      issues,
      "BLOCKER",
      "[auth] Missing redirect navigation semantics (push vs replace).",
    );
  }

  if (!hasProvisioning) {
    pushIssue(
      issues,
      "BLOCKER",
      "[auth] Missing account provisioning strategy.",
    );
  }

  if (!hasErrorContract) {
    pushIssue(
      issues,
      "BLOCKER",
      "[auth] Missing auth error contract or error-code mapping.",
    );
  }

  if (!hasLoadingState) {
    pushIssue(
      issues,
      "BLOCKER",
      "[auth] Missing loading/pending state contract.",
    );
  }

  if (mentionsSecurityRules && !explainsFirestoreInteraction) {
    pushIssue(
      issues,
      "WARN",
      "[auth] Mentions security rules without explaining Auth ↔ Firestore interaction.",
    );
  }

  if (
    /friendly auth error|erro amigável/i.test(acText) &&
    !/invalid email or password|mapped error|error code|email ou senha inválidos|código de erro|mapeamento de erro/i.test(
      acText,
    )
  ) {
    pushIssue(
      issues,
      "BLOCKER",
      "[auth] Acceptance criteria mention friendly auth error without concrete message or mapping.",
    );
  }
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

  const isAuthLike =
    /[\\/]auth[\\/]/i.test(file) ||
    /\bfirebase auth\b/i.test(text) ||
    /\blogin\b/i.test(text) ||
    /\bauthentication\b/i.test(text) ||
    /\bautenticação\b/i.test(text);

  if (isAuthLike) {
    lintAuthSpec(text, sections, issues);
  }

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
