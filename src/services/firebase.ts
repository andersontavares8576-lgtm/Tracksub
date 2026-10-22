import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import configJson from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: (import.meta.env?.VITE_FIREBASE_API_KEY as string) || configJson.apiKey,
  authDomain: (import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN as string) || configJson.authDomain,
  projectId: (import.meta.env?.VITE_FIREBASE_PROJECT_ID as string) || configJson.projectId,
  storageBucket: (import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET as string) || configJson.storageBucket,
  messagingSenderId: (import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || configJson.messagingSenderId,
  appId: (import.meta.env?.VITE_FIREBASE_APP_ID as string) || configJson.appId,
  measurementId: (import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID as string) || configJson.measurementId || '',
};

// Inicialização segura do Firebase App (singleton)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicialização do Firebase Auth
export const auth = getAuth(app);

// Inicialização do Cloud Firestore apontando para a base provisionada
export const firestoreDatabaseId =
  (import.meta.env?.VITE_FIREBASE_DATABASE_ID as string) || configJson.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, firestoreDatabaseId);

// Interface para diagnóstico padronizado de erro do Firestore
export interface FirestoreErrorInfo {
  error: string;
  operation: string;
  path: string;
  authUid?: string | null;
  message: string;
}

/**
 * Validação mandatória de conectividade com o Cloud Firestore
 */
export async function testFirestoreConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { connected: true };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes('the client is offline') || msg.includes('offline') || msg.includes('Failed to get document')) {
      console.warn('Verifique a conectividade de rede com o Firebase Firestore:', msg);
      return { connected: false, error: 'O cliente Firestore está offline ou sem conexão com a nuvem.' };
    }
    // Se o documento 'test/connection' não existir ou der permissão, mas responder do servidor, o handshake foi efetuado
    return { connected: true };
  }
}
