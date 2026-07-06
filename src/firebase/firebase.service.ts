import { Injectable, OnModuleInit } from '@nestjs/common';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private db: Firestore;
  private messaging: Messaging;

  onModuleInit() {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
      console.warn('Firebase Admin env vars are not available. Firebase features will be disabled.');
      return;
    }

    let app;
    if (getApps().length === 0) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      app = getApp();
    }

    this.db = getFirestore(app);
    this.messaging = getMessaging(app);
  }

  getDb(): Firestore {
    return this.db;
  }

  getMessaging(): Messaging {
    return this.messaging;
  }
}
