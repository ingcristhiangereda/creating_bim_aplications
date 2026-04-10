import * as Firestore from "firebase/firestore";
import * as Auth from "firebase/auth";
import { initializeApp } from "firebase/app"

const env = (import.meta as any).env ?? {}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.warn("Firebase config is incomplete. Set VITE_FIREBASE_* variables in your .env file.")
}

const app = initializeApp(firebaseConfig);
export const firestoreDB = Firestore.getFirestore(app);
export const auth = Auth.getAuth(app)

const normalizePath = (path: string) => path.replace(/^\/+|\/+$/g, "")
const removeUndefinedDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => removeUndefinedDeep(entry))
  }

  if (value && typeof value === "object") {
    const cleanedEntries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, removeUndefinedDeep(entry)])

    return Object.fromEntries(cleanedEntries)
  }

  return value
}

export function getCollection<T>(path: string) {
  return Firestore.collection(firestoreDB, normalizePath(path)) as Firestore.CollectionReference<T>
}

export async function deleteDocument(path: string, id: string) {
  const doc = Firestore.doc(firestoreDB, `${normalizePath(path)}/${id}`)
  await Firestore.deleteDoc(doc)
}

export async function updateDocument<T extends Record<string, any>>(path: string, id: string, data: T) {
  const doc = Firestore.doc(firestoreDB, `${normalizePath(path)}/${id}`)
  const cleanData = removeUndefinedDeep(data) as T
  await Firestore.setDoc(doc, cleanData, { merge: true })
}

export async function getDocument<T>(path: string, id: string) {
  const ref = Firestore.doc(firestoreDB, `${normalizePath(path)}/${id}`)
  const snapshot = await Firestore.getDoc(ref)
  if (!snapshot.exists()) return null
  return snapshot.data() as T
}

export function logFirebaseAuthState() {
  console.log("[Firebase Auth] currentUser:", auth.currentUser)
  return Auth.onAuthStateChanged(auth, (user) => {
    console.log("[Firebase Auth] onAuthStateChanged:", user)
  })
}
