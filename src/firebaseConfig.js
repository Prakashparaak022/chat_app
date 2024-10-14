// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDE1jFoP6Y8oDuSJJ8rIPSrQmWF5cWZVu0",
  authDomain: "chatapp2-b7e83.firebaseapp.com",
  projectId: "chatapp2-b7e83",
  storageBucket: "chatapp2-b7e83.appspot.com",
  messagingSenderId: "561252802739",
  appId: "1:561252802739:web:0c3f999f842b2734b190c6",
  measurementId: "G-D63TX6DZSY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const provider = new GoogleAuthProvider()
export const auth = getAuth(app)
export const db = getFirestore(app)