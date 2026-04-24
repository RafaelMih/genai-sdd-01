import { getAuth, type Auth } from "firebase/auth";
import { app } from "./app";

const isE2EMode = import.meta.env.VITE_E2E_MODE === "1";

export const auth = (isE2EMode ? ({} as Auth) : getAuth(app)) as Auth;
