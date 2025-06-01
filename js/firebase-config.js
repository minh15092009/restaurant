// js/firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyDFR8XrAVcf_8utvAbYiOFqRE-lNYlHUUI",
  authDomain: "restaurant-9f8f5.firebaseapp.com",
  projectId: "restaurant-9f8f5",
  storageBucket: "restaurant-9f8f5.firebasestorage.app",
  messagingSenderId: "349917333075",
  appId: "1:349917333075:web:a6ac9fb59e0092ed3268a6",
  measurementId: "G-PJVX3TC6EH"
  };
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = firebase.auth();

// Initialize Cloud Firestore and get a reference to the service
const db = firebase.firestore();
