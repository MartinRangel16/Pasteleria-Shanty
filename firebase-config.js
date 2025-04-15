// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyB4sYnng9AIxnYnrha7mo7IK7QhxG-wA4E",
  authDomain: "encuesta-prueba-74ef5.firebaseapp.com",
  projectId: "encuesta-prueba-74ef5",
  storageBucket: "encuesta-prueba-74ef5.firebasestorage.app",
  messagingSenderId: "950618110640",
  appId: "1:950618110640:web:460f9127e1f4a94f0d5975",
  measurementId: "G-7VVYNE4V3S"
};
// Inicializa Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
window.db = firebase.firestore();
