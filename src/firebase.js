// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';



// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA2pdxArjW6AAWAsSNOTQWSVr20afh4llI",
  authDomain: "plataforma-fisica-gamificada.firebaseapp.com",
  projectId: "plataforma-fisica-gamificada",
  storageBucket: "plataforma-fisica-gamificada.firebasestorage.app",
  messagingSenderId: "470403297317",
  appId: "1:470403297317:web:49f232301c94abb7d20fcc",
  measurementId: "G-1NZRYY81SB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// 👇 Esto es lo importante
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };