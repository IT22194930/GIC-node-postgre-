import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfJgoyn3l3YqSk3FevE7aulgGmebvglgY",
  authDomain: "agripeace-a600c.firebaseapp.com",
  projectId: "agripeace-a600c",
  storageBucket: "agripeace-a600c.appspot.com",
  messagingSenderId: "577021192153",
  appId: "1:577021192153:web:b86166d73d890730fb9bc8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { app, storage };