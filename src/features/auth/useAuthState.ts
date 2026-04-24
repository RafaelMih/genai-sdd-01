import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../../firebase/auth";
import { getE2ECurrentUser, subscribeToE2EAuthState } from "./e2eAuth";

const isE2EMode = import.meta.env.VITE_E2E_MODE === "1";

// undefined = still resolving, null = unauthenticated, User = authenticated
export function useAuthState(): User | null | undefined {
  // Initialize state with current user if in E2E mode, otherwise undefined
  const [user, setUser] = useState<User | null | undefined>(
    isE2EMode ? (getE2ECurrentUser() as User | null) : undefined,
  );

  useEffect(() => {
    if (isE2EMode) {
      // Only subscribe to changes, don't set state synchronously here
      return subscribeToE2EAuthState((nextUser) => {
        setUser(nextUser as User | null);
      });
    }

    return onAuthStateChanged(auth, setUser);
  }, []);

  return user;
}
