import fs from "node:fs";
import path from "node:path";
const root = path.resolve("specs/features");
const requiredTopLevelPatterns = [
  {
    name: 'H1 "# Feature Spec:"',
    pattern: /^#\s+Feature Spec:/m,
    severity: "BLOCKER",
  },
  {
    name: "Version line",
    pattern: /^Version:\s+v?\d+\.\d+\.\d+/m,
    severity: "BLOCKER",
  },
  {
    name: "Status line",
    pattern: /^Status:\s+(Draft|Approved|Blocked|Deprecated)$/m,
    severity: "BLOCKER",
  },
];
const sectionAliases = {
  objective: ["objective", "goal", "goals"],
  scope: ["scope", "in scope", "in-scope"],
  "out of scope": ["out of scope", "out-of-scope", "excluded", "non-goals", "non goals"],
  "acceptance criteria": ["acceptance criteria", "acceptance criterion", "acceptance", "criteria"],
  dependencies: ["dependencies", "depends on", "dependency"],
  tests: ["tests", "test strategy", "test cases", "testing"],
};
const vagueTermsWarn = [
  "rápido",
  "intuitivo",
  "bonito",
  "moderno",
  "amigável",
  "eficiente",
  "otimizado",
  "friendly",
  "simple",
  "easy",
  "seamless",
  "robust",
  "user-friendly",
];
const unresolvedMarkersWarn = [
  "todo",
  "tbd",
  "to decide",
  "undecided",
  "open question",
  "open questions",
  "decide later",
  "placeholder",
];
const subjectivePatternsWarn = [
  /friendly auth error/i,
  /good user experience/i,
  /better performance/i,
  /fast login/i,
  /clear error/i,
];
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function normalizeWhitespace(value) {
  return value.replace(/\r\n/g, "\n");
}
function normalizeSectionName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (/spec-v\d+\.\d+\.\d+\.md$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}
function canonicalizeSectionName(raw) {
  const normalized = normalizeSectionName(raw);
  for (const [canonical, aliases] of Object.entries(sectionAliases)) {
    if (aliases.includes(normalized)) {
      return canonical;
    }
  }
  return normalized;
}
function getSections(text) {
  const sections = {};
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
function pushIssue(issues, severity, message) {
  issues.push({ severity, message });
}
function lintTopLevel(text, issues) {
  for (const rule of requiredTopLevelPatterns) {
    if (!rule.pattern.test(text)) {
      pushIssue(issues, rule.severity, `Missing required pattern: ${rule.name}`);
    }
  }
}
function lintRequiredSections(sections, issues) {
  for (const canonicalName of Object.keys(sectionAliases)) {
    if (!sections[canonicalName] || !sections[canonicalName].trim()) {
      pushIssue(issues, "BLOCKER", `Missing required section: "## ${canonicalName}"`);
    }
  }
}
function lintVagueLanguage(text, issues) {
  for (const term of vagueTermsWarn) {
    const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, "i");
    if (re.test(text)) {
      pushIssue(issues, "WARN", `Vague term found: "${term}"`);
    }
  }
  for (const marker of unresolvedMarkersWarn) {
    const re = new RegExp(`\\b${escapeRegExp(marker)}\\b`, "i");
    if (re.test(text)) {
      pushIssue(issues, "WARN", `Unresolved marker found: "${marker}"`);
    }
  }
  for (const pattern of subjectivePatternsWarn) {
    if (pattern.test(text)) {
      pushIssue(issues, "WARN", `Subjective or unverifiable wording found: ${pattern}`);
    }
  }
}
function lintAcceptanceCriteria(acText, issues) {
  if (!acText || !acText.trim()) {
    pushIssue(issues, "BLOCKER", "Acceptance criteria block not found.");
    return;
  }
  const lines = acText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^(- |\* )|^AC-\d+:/i.test(line));
  if (lines.length === 0) {
    pushIssue(issues, "BLOCKER", "Acceptance criteria block has no list items.");
    return;
  }
  lines.forEach((line, index) => {
    const item = line.replace(/^(- |\* )/, "").trim();
    if (item.length < 12) {
      pushIssue(issues, "WARN", `AC-${index + 1}: too short to be testable.`);
    }
    if (/\b(friendly|clear|simple|easy|intuitive|fast|quick|good)\b/i.test(item)) {
      pushIssue(issues, "WARN", `AC-${index + 1}: contains subjective wording: "${item}"`);
    }
    if (
      !/\b(must|shall|should|shows|redirects|returns|blocks|displays|creates|rejects|allows|prevents|disables)\b/i.test(
        item,
      )
    ) {
      pushIssue(
        issues,
        "WARN",
        `AC-${index + 1}: may not define observable behavior clearly: "${item}"`,
      );
    }
    if (!/[.?!]$/.test(item)) {
      pushIssue(issues, "WARN", `AC-${index + 1}: should end with punctuation for consistency.`);
    }
  });
}
function lintTestsSection(testsText, issues) {
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
function lintAuthSpec(text, sections, issues) {
  const fullText = text.toLowerCase();
  const acText = sections["acceptance criteria"] ?? "";
  const hasRedirectPath =
    /redirect(path)?\s*:\s*["'`]?\/[a-z0-9/_-]+["'`]?/i.test(text) ||
    /redirects?\s+to\s+["'`]?\/[a-z0-9/_-]+["'`]?/i.test(text);
  const hasProvisioning =
    /sign-up|signup|pre-seeded|pre seeded|admin-created|admin created|account provisioning|account creation|accounts are created/i.test(
      text,
    );
  const hasErrorContract =
    /auth\/[a-z-]+|error code|error mapping|invalid email or password|network-request-failed|wrong-password|user-not-found|friendly auth error/i.test(
      text,
    );
  const hasAlreadyAuthenticatedContract =
    /already-authenticated|already authenticated|if authenticated user visits \/login|signed-in user navigates to \/login|redirect immediately/i.test(
      text,
    );
  const hasLoadingState =
    /loading state|pending state|spinner|button disabled|disable submit during request|submitting/i.test(
      text,
    );
  const mentionsSecurityRules = /security-rules|security rules/i.test(text);
  const explainsFirestoreInteraction =
    /firestore|document creation|users\/\{uid\}|users\/\{uid\}|create.*user document|post-login write|post login write/i.test(
      text,
    );
  const hasOpenRedirectDecision =
    /dashboard\s+path\s+is\s+undecided|\/dashboard\s+vs\s+\/app|open question/i.test(fullText);
  if (!hasRedirectPath) {
    pushIssue(issues, "BLOCKER", "[auth] Missing explicit redirect path contract.");
  }
  if (!hasProvisioning) {
    pushIssue(issues, "BLOCKER", "[auth] Missing account provisioning strategy.");
  }
  if (!hasErrorContract) {
    pushIssue(issues, "BLOCKER", "[auth] Missing auth error contract or error-code mapping.");
  }
  if (!hasAlreadyAuthenticatedContract) {
    pushIssue(
      issues,
      "BLOCKER",
      "[auth] Missing behavior for already-authenticated users visiting /login.",
    );
  }
  if (!hasLoadingState) {
    pushIssue(issues, "BLOCKER", "[auth] Missing loading/pending state contract.");
  }
  if (mentionsSecurityRules && !explainsFirestoreInteraction) {
    pushIssue(
      issues,
      "WARN",
      "[auth] Mentions security rules without explaining Auth ↔ Firestore interaction.",
    );
  }
  if (hasOpenRedirectDecision) {
    pushIssue(issues, "BLOCKER", "[auth] Contains unresolved redirect path decision.");
  }
  if (
    /friendly auth error/i.test(acText) &&
    !/invalid email or password|mapped error|error code/i.test(acText)
  ) {
    pushIssue(
      issues,
      "BLOCKER",
      '[auth] Acceptance criteria mention "friendly auth error" without a concrete message or mapping.',
    );
  }
}
function lintFile(file) {
  const raw = fs.readFileSync(file, "utf8");
  const text = normalizeWhitespace(raw);
  const sections = getSections(text);
  const issues = [];
  lintTopLevel(text, issues);
  lintRequiredSections(sections, issues);
  lintVagueLanguage(text, issues);
  lintAcceptanceCriteria(sections["acceptance criteria"], issues);
  lintTestsSection(sections["tests"], issues);
  const isAuthLike =
    /[\\/]auth[\\/]/i.test(file) ||
    /\bfirebase auth\b/i.test(text) ||
    /\blogin\b/i.test(text) ||
    /\bauthentication\b/i.test(text);
  if (isAuthLike) {
    lintAuthSpec(text, sections, issues);
  }
  return issues;
}
const files = walk(root);
let hasBlocker = false;
let hasWarn = false;
for (const file of files) {
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
