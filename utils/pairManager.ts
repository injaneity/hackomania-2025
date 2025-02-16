import { db } from '../firebase/firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { playerManager } from './playerManager';

export interface UserPair {
  userId: string;
  targetId: string;
  timestamp: number;
  completed: boolean;
}

class PairManager {
  private pairsRef = 'pairs';

  async createPair(userId: string, targetId: string): Promise<void> {
    const pairData: UserPair = {
      userId,
      targetId,
      timestamp: Date.now(),
      completed: false
    };
    await setDoc(doc(db, this.pairsRef, userId), pairData);
  }

  async getCurrentPair(userId: string): Promise<UserPair | null> {
    const pairDoc = await getDoc(doc(db, this.pairsRef, userId));
    return pairDoc.exists() ? pairDoc.data() as UserPair : null;
  }

  async verifyAndCompletePair(scannerId: string, scannedId: string): Promise<boolean> {
    const pair = await this.getCurrentPair(scannerId);
    if (pair && pair.targetId === scannedId && !pair.completed) {
      // Just mark as completed, no score handling here
      await updateDoc(doc(db, this.pairsRef, scannerId), {
        completed: true
      });
      return true;
    }
    return false;
  }

  async removePair(userId: string): Promise<void> {
    await deleteDoc(doc(db, this.pairsRef, userId));
  }
}

export const pairManager = new PairManager();
