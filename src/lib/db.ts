import { db } from './firebase';

/**
 * Database connection handler for Cloud Firestore
 */
export async function connectToDatabase(): Promise<any> {
  // Cloud Firestore manages connections automatically via the Firebase Web SDK
  return db;
}

export default connectToDatabase;
