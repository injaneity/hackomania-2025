import { db } from '../firebase/firebaseConfig';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';

export interface PlayerScore {
  id: string;
  username: string;
  score: number;
  createdAt: Timestamp;
  lastActive: Timestamp;
}

class LeaderboardManager {
  private playersRef = collection(db, 'players');

  subscribeToLeaderboard(callback: (players: PlayerScore[]) => void, limitCount: number = 10) {
    const q = query(
      this.playersRef,
      orderBy('score', 'desc'),
      limit(limitCount)
    );
    
    return onSnapshot(q, (snapshot) => {
      const players = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as PlayerScore));
      
      callback(players);
    }, (error) => {
      console.error('Error fetching leaderboard:', error);
    });
  }
}

export const leaderboardManager = new LeaderboardManager();
