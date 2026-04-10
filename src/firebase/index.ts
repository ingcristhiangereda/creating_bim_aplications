import * as Firestore from "firebase/firestore";
import { initializeApp } from "firebase/app"

const firebaseConfig = {
  apiKey: "AIzaSyA6xdn6lZjLFQEPJTEhKAJDhBo7Cuduw18",
  authDomain: "bim-dev-master-66e29.firebaseapp.com",
  projectId: "bim-dev-master-66e29",
  storageBucket: "bim-dev-master-66e29.firebasestorage.app",
  messagingSenderId: "545288092693",
  appId: "1:545288092693:web:c6b8f7bdcc57e59e1ca21c"
};

const app = initializeApp(firebaseConfig);
export const firestoreDB = Firestore.getFirestore(app);

export function getCollection<T>(path: string) {
  return Firestore.collection(firestoreDB, path) as Firestore.CollectionReference<T>
}

export async function deleteDocument(path: string, id: string) {
  const doc = Firestore.doc(firestoreDB, `${path}/${id}`)
  await Firestore.deleteDoc(doc)
}

export async function updateDocument<T extends Record<string, any>>(path: string, id: string, data: T) {
  const doc = Firestore.doc(firestoreDB, `${path}/${id}`)
  await Firestore.updateDoc(doc, data)
}
