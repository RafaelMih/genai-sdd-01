type E2EAuthUser = {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
};

type E2EStoredUser = E2EAuthUser & {
  password: string;
  provider: "password";
  createdAt: string;
  updatedAt: string;
};

type E2EAuthErrorCode =
  | "auth/email-already-in-use"
  | "auth/invalid-credential"
  | "auth/network-request-failed";

const USERS_KEY = "genai-sdd:e2e-auth:users";
const CURRENT_USER_KEY = "genai-sdd:e2e-auth:current-user";
const AUTH_EVENT = "genai-sdd:e2e-auth:change";

function readUsers(): E2EStoredUser[] {
  const raw = window.localStorage.getItem(USERS_KEY);

  if (!raw) return [];

  try {
    return JSON.parse(raw) as E2EStoredUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: E2EStoredUser[]): void {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function writeCurrentUser(user: E2EAuthUser | null): void {
  if (user) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }

  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: user }));
}

function createAuthError(code: E2EAuthErrorCode): Error & { code: E2EAuthErrorCode } {
  const error = new Error(code) as Error & { code: E2EAuthErrorCode };
  error.code = code;
  return error;
}

function toSessionUser(user: E2EStoredUser): E2EAuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    phone: user.phone,
  };
}

export function getE2ECurrentUser(): E2EAuthUser | null {
  const raw = window.localStorage.getItem(CURRENT_USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as E2EAuthUser;
  } catch {
    return null;
  }
}

export function subscribeToE2EAuthState(listener: (user: E2EAuthUser | null) => void): () => void {
  listener(getE2ECurrentUser());

  const handleChange = (event: Event) => {
    const customEvent = event as CustomEvent<E2EAuthUser | null>;
    listener(customEvent.detail ?? getE2ECurrentUser());
  };

  window.addEventListener(AUTH_EVENT, handleChange);

  return () => {
    window.removeEventListener(AUTH_EVENT, handleChange);
  };
}

export async function e2eSignIn(email: string, password: string): Promise<E2EAuthUser> {
  const user = readUsers().find(
    (candidate) => candidate.email.toLowerCase() === email.toLowerCase(),
  );

  if (!user || user.password !== password) {
    throw createAuthError("auth/invalid-credential");
  }

  const sessionUser = toSessionUser(user);
  writeCurrentUser(sessionUser);
  return sessionUser;
}

export async function e2eCreateAccount(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<E2EAuthUser> {
  const users = readUsers();
  const emailAlreadyInUse = users.some(
    (candidate) => candidate.email.toLowerCase() === input.email.toLowerCase(),
  );

  if (emailAlreadyInUse) {
    throw createAuthError("auth/email-already-in-use");
  }

  const now = new Date().toISOString();
  const storedUser: E2EStoredUser = {
    uid: `e2e-${crypto.randomUUID()}`,
    email: input.email,
    displayName: input.name,
    password: input.password,
    provider: "password",
    createdAt: now,
    updatedAt: now,
    ...(input.phone ? { phone: input.phone } : {}),
  };

  users.push(storedUser);
  writeUsers(users);

  const sessionUser = toSessionUser(storedUser);
  writeCurrentUser(sessionUser);
  return sessionUser;
}

export async function e2eSignOut(): Promise<void> {
  writeCurrentUser(null);
}
