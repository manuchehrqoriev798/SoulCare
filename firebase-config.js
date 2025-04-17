// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";


const firebaseConfig = {
    apiKey: "AIzaSyA3oeJOz3t6lgV6ug3yyARV4Mfd_DTFsRw",
    authDomain: "soulcare-a1080.firebaseapp.com",
    databaseURL: "https://soulcare-a1080-default-rtdb.firebaseio.com",
    projectId: "soulcare-a1080",
    storageBucket: "soulcare-a1080.firebasestorage.app",
    messagingSenderId: "138584834732",
    appId: "1:138584834732:web:fb16b37c916ca5f38a1509",
    measurementId: "G-C0G4V9RG81"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
        // The current browser does not support persistence
        console.log('The current browser does not support persistence');
    }
});

// Export auth, db, and analytics for use in other files
export { auth, db, analytics }; 