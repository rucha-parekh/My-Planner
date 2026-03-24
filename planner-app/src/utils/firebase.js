import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// Replace with your Firebase project config
// Get it from: Firebase Console → Project Settings → Your Apps → Web App
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google provider — request Calendar scope so we get an access token for GCal
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/calendar.events");
provider.addScope("https://www.googleapis.com/auth/calendar.readonly");

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  // credential gives us the Google OAuth access token for Calendar API
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const googleAccessToken = credential?.accessToken || null;
  const firebaseToken = await result.user.getIdToken();
  return { user: result.user, googleAccessToken, firebaseToken };
}

export async function signOutUser() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function getFirebaseToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
