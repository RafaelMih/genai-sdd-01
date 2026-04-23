import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/auth";

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}
