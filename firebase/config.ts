import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBfgB6Kvy56jnEwzZoBPl9sjF5vpslnS10',
  authDomain: 'hisab-kitab-6240f.firebaseapp.com',
  projectId: 'hisab-kitab-6240f',
  storageBucket: 'hisab-kitab-6240f.firebasestorage.app',
  messagingSenderId: '1036034352274',
  appId: '1:1036034352274:web:65aa5478d86a7280def24b',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export default app;
