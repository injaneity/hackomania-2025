import { db } from '../firebase/firebaseConfig';
import { doc, setDoc, onSnapshot, updateDoc, serverTimestamp, collection, query, where, orderBy, deleteDoc } from 'firebase/firestore';

export class QueueManager {
  private queueRef = collection(db, 'queues');
  private matchesRef = collection(db, 'matches');
  private userId: string;
  private cleanup: (() => void)[] = [];

  constructor(userId: string) {
    this.userId = userId;
  }

  async joinQueue() {
    try {
      // Add timestamp for FIFO queue
      await setDoc(doc(this.queueRef, this.userId), {
        userId: this.userId,
        timestamp: serverTimestamp(),
        status: 'searching',
        lastPing: serverTimestamp()
      });

      // Keep-alive ping every 10 seconds
      const pingInterval = setInterval(() => {
        this.updateLastPing();
      }, 10000);

      this.cleanup.push(() => clearInterval(pingInterval));

      // Listen for matches
      return this.listenForMatch();
    } catch (error) {
      console.error('Error joining queue:', error);
      throw error;
    }
  }

  private async updateLastPing() {
    try {
      await updateDoc(doc(this.queueRef, this.userId), {
        lastPing: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating ping:', error);
    }
  }

  private listenForMatch() {
    // Listen for available players
    const q = query(
      this.queueRef,
      where('status', '==', 'searching'),
      orderBy('timestamp')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const players = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(player => {
          // Remove stale players (no ping for 30 seconds)
          const lastPing = player.lastPing?.toDate() || 0;
          return Date.now() - lastPing < 30000;
        });

      if (players.length >= 2) {
        const [player1, player2] = players;
        // First player creates the match
        if (player1.id === this.userId) {
          await this.createMatch(player1.id, player2.id);
        }
      }
    });

    this.cleanup.push(unsubscribe);
    return unsubscribe;
  }

  private async createMatch(player1Id: string, player2Id: string) {
    const matchId = `match_${Date.now()}`;
    try {
      const [player1, player2] = await Promise.all([
        playerManager.getPlayer(player1Id),
        playerManager.getPlayer(player2Id)
      ]);

      if (!player1 || !player2) throw new Error('Players not found');

      await setDoc(doc(this.matchesRef, matchId), {
        player1: {
          id: player1.id,
          username: player1.username,
          score: player1.score
        },
        player2: {
          id: player2.id,
          username: player2.username,
          score: player2.score
        },
        status: 'active',
        timestamp: serverTimestamp(),
        word: this.getRandomWord(),
        currentTurn: player1Id
      });

      // Update players' status
      await Promise.all([
        updateDoc(doc(this.queueRef, player1Id), { status: 'matched', matchId }),
        updateDoc(doc(this.queueRef, player2Id), { status: 'matched', matchId })
      ]);

      // Clean up queue entries
      setTimeout(async () => {
        await Promise.all([
          deleteDoc(doc(this.queueRef, player1Id)),
          deleteDoc(doc(this.queueRef, player2Id))
        ]);
      }, 5000);

    } catch (error) {
      console.error('Error creating match:', error);
    }
  }

  leaveQueue() {
    // Clean up listeners and intervals
    this.cleanup.forEach(cleanup => cleanup());
    this.cleanup = [];
    
    // Remove from queue
    return deleteDoc(doc(this.queueRef, this.userId));
  }

  private getRandomWord() {
    // Your word selection logic
    const words = ['REACT', 'LOGIC', 'DEBUG']; // Your word list
    return words[Math.floor(Math.random() * words.length)];
  }
}
