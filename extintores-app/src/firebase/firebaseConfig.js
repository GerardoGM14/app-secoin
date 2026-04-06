// src/firebase/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDzk1zx0YGoqtcumCjrPqfxitx2pYgHwXk",
    authDomain: "extintores-app.firebaseapp.com",
    projectId: "extintores-app",
    storageBucket: "extintores-app.firebasestorage.app",
    messagingSenderId: "422351828133",
    appId: "1:422351828133:web:832db7d47254f3be8e494c",
    measurementId: "G-7LHLVVM8DK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
