import { initializeApp } from "firebase/app";
import { getFirestore , collection, setDoc, getDocs, doc, onSnapshot, updateDoc, arrayUnion  } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDXa5qAOBwIeU6moSJxRbrKqzsuDvWGQ0M",
  authDomain: "airforshare-ef80f.firebaseapp.com",
  projectId: "airforshare-ef80f",
  storageBucket: "airforshare-ef80f.firebasestorage.app",
  messagingSenderId: "170168937984",
  appId: "1:170168937984:web:252fc668405fba1c9772e5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
    collection,
    setDoc,
    doc,
    db,
    onSnapshot,
    updateDoc,
    getDocs,
    arrayUnion
}