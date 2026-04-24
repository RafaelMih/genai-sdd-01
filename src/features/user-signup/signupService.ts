import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth } from "../../firebase/auth";
import { db } from "../../firebase/firestore";

export async function createAccount(
  name: string,
  email: string,
  password: string,
  phone?: string
): Promise<void> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  try {
    const profileData: Record<string, unknown> = {
      displayName: name,
      email,
      provider: "password",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (phone) {
      profileData.phone = phone;
    }
    await setDoc(doc(db, "users", user.uid), profileData);
  } catch (firestoreError) {
    await signOut(auth);
    throw firestoreError;
  }
}
