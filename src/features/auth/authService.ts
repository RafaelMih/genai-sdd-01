import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/auth";
import { e2eSignIn } from "./e2eAuth";

const isE2EMode = import.meta.env.VITE_E2E_MODE === "1";

export function signIn(email: string, password: string) {
  if (isE2EMode) {
    return e2eSignIn(email, password);
  }

  return signInWithEmailAndPassword(auth, email, password);
}
