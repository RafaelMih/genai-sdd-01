import { getFirestore, type Firestore } from "firebase/firestore";
import { app } from "./app";

const isE2EMode = import.meta.env.VITE_E2E_MODE === "1";

export const db = (isE2EMode ? ({} as Firestore) : getFirestore(app)) as Firestore;
