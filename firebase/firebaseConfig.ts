import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase credentials
const firebaseConfig = {
    apiKey: "AIzaSyBdoGiPJGYCHtLrKT2bvQmE4Pvi4CuqrwU",
    authDomain: "hackomania-b70cd.firebaseapp.com",
    projectId: "hackomania-b70cd",
    storageBucket: "hackomania-b70cd.firebasestorage.app",
    messagingSenderId: "414080059066",
    appId: "1:414080059066:web:1e4e13ca1aa34e4d2e2483",
    measurementId: "G-92DDXXPVHF"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
