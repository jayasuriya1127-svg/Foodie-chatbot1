// =====================================================
// FOODIEBOT AI - FIREBASE CONFIGURATION
// =====================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyBHh2QqxJ5C22yCtF_-qvazi8TK-LV9HdI",

    authDomain:
        "foodie-chatbot-14c8b.firebaseapp.com",

    projectId:
        "foodie-chatbot-14c8b",

    storageBucket:
        "foodie-chatbot-14c8b.firebasestorage.app",

    messagingSenderId:
        "646462452893",

    appId:
        "1:646462452893:web:67f7d04a9e3f5ad2d55074",

    measurementId:
        "G-GZ0WEQEBDJ"
};


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app =
    initializeApp(firebaseConfig);


// =====================================================
// INITIALIZE FIRESTORE
// =====================================================

const db =
    getFirestore(app);


// =====================================================
// EXPORT
// =====================================================

export {
    app,
    db
};