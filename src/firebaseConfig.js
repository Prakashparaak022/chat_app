// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyD9Ken0BJ-HtNTK-pzp7fgKkIdrtiyj0wM",
  authDomain: "chatapp-d900e.firebaseapp.com",
  projectId: "chatapp-d900e",
  storageBucket: "chatapp-d900e.appspot.com",
  messagingSenderId: "451012755899",
  appId: "1:451012755899:web:c7df8b262a1f4f50c2049e",
  measurementId: "G-B8GJNXLDV5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const provider = new GoogleAuthProvider()
export const auth = getAuth(app)
export const db = getFirestore(app)