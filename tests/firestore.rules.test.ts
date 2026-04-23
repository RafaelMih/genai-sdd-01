// @vitest-environment node
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

// Matches emulators.firestore.port in firebase.json
const FIRESTORE_PORT = 8889;
const PROJECT_ID = "demo-genai-sdd";

let testEnv: RulesTestEnvironment;

// Valid document matching firestore-schema-v1.0.0.md: users/{uid}
const userDoc = {
  displayName: "Test User",
  email: "test@example.com",
  provider: "password",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: FIRESTORE_PORT,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

// ─── READ ───��────────────────────────────────────────────────────────────────

describe("read — users/{userId}", () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice"), userDoc);
      await setDoc(doc(ctx.firestore(), "users/bob"), userDoc);
    });
  });

  it("owner can read their own document", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(getDoc(doc(alice.firestore(), "users/alice")));
  });

  it("authenticated user cannot read another user's document", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(getDoc(doc(alice.firestore(), "users/bob")));
  });

  it("unauthenticated user cannot read any document", async () => {
    const unauth = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(unauth.firestore(), "users/alice")));
  });
});

// ─── CREATE ──────────────────────────────────────────────────────────────────

describe("create — users/{userId}", () => {
  it("owner can create their own document", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(
      setDoc(doc(alice.firestore(), "users/alice"), userDoc)
    );
  });

  it("authenticated user cannot create a document for another user", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(
      setDoc(doc(alice.firestore(), "users/bob"), userDoc)
    );
  });

  it("unauthenticated user cannot create any document", async () => {
    const unauth = testEnv.unauthenticatedContext();
    await assertFails(
      setDoc(doc(unauth.firestore(), "users/alice"), userDoc)
    );
  });
});

// ─── UPDATE ──────────────────────────────────────────────────────────────────

describe("update — users/{userId}", () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice"), userDoc);
      await setDoc(doc(ctx.firestore(), "users/bob"), userDoc);
    });
  });

  it("owner can update their own document", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(
      updateDoc(doc(alice.firestore(), "users/alice"), {
        displayName: "Alice Updated",
        updatedAt: new Date().toISOString(),
      })
    );
  });

  it("authenticated user cannot update another user's document", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(
      updateDoc(doc(alice.firestore(), "users/bob"), {
        displayName: "Hacked",
      })
    );
  });

  it("unauthenticated user cannot update any document", async () => {
    const unauth = testEnv.unauthenticatedContext();
    await assertFails(
      updateDoc(doc(unauth.firestore(), "users/alice"), {
        displayName: "Hacked",
      })
    );
  });
});

// ─── DELETE ──────────────────────────────────────────────────────────────────

describe("delete — users/{userId}", () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice"), userDoc);
      await setDoc(doc(ctx.firestore(), "users/bob"), userDoc);
    });
  });

  it("owner can delete their own document", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(deleteDoc(doc(alice.firestore(), "users/alice")));
  });

  it("authenticated user cannot delete another user's document", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(deleteDoc(doc(alice.firestore(), "users/bob")));
  });

  it("unauthenticated user cannot delete any document", async () => {
    const unauth = testEnv.unauthenticatedContext();
    await assertFails(deleteDoc(doc(unauth.firestore(), "users/alice")));
  });
});
