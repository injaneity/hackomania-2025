import { db } from '../firebase/firebaseConfig';
import { doc, setDoc, onSnapshot, updateDoc, serverTimestamp, collection, query, where, orderBy, deleteDoc, Timestamp, getDoc } from 'firebase/firestore';
import { gameManager } from './gameManager';

interface QueueEntry {
  userId: string;
  timestamp: Timestamp;
  status: 'gettingReady' | 'searching' | 'matched';
  lastPing: Timestamp;
  matchId?: string;
}

export class QueueManager {
  private queueRef = collection(db, 'queue');
  private userId: string;
  private cleanup: (() => void)[] = [];
  private onMatchFound?: (matchId: string) => void;

  constructor(userId: string) {
    this.userId = userId;
  }

  async joinQueue(onMatchFound: (matchId: string) => void) {
    this.onMatchFound = onMatchFound;
    
    try {
      // First, add player with 'gettingReady' status
      const queueEntry = {
        userId: this.userId,
        timestamp: serverTimestamp(),
        status: 'gettingReady',
        lastPing: serverTimestamp()
      };

      console.log('Initializing queue entry:', this.userId);
      await setDoc(doc(this.queueRef, this.userId), queueEntry);

      // Set up ping interval
      const pingInterval = setInterval(() => this.updateLastPing(), 10000);
      this.cleanup.push(() => clearInterval(pingInterval));

      // Set up all listeners
      this.listenForMatch();

      // Wait a moment for listeners to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update status to 'searching' once everything is set up
      await updateDoc(doc(this.queueRef, this.userId), {
        status: 'searching'
      });
      
      console.log('Player ready for matching:', this.userId);
    } catch (error) {
      console.error('Error joining queue:', error);
      // Cleanup if there's an error during setup
      this.leaveQueue();
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
    let matchHandled = false; // Flag to prevent multiple triggers

    // Listen for changes to the current user's queue entry
    const userStatusUnsubscribe = onSnapshot(doc(this.queueRef, this.userId), async (docSnapshot) => {
      if (docSnapshot.exists() && !matchHandled) {
        const data = docSnapshot.data() as QueueEntry;
        console.log('User status update:', this.userId, data);
        
        if (data.status === 'matched' && data.matchId) {
          matchHandled = true; // Set flag to prevent multiple triggers
          console.log('Match found for player:', this.userId, 'matchId:', data.matchId);
          
          try {
            const gameDoc = await getDoc(doc(db, 'games', data.matchId));
            if (gameDoc.exists()) {
              this.onMatchFound?.(data.matchId);
            } else {
              console.log('Waiting for game document creation...');
              const unsubGame = onSnapshot(doc(db, 'games', data.matchId), (gameSnapshot) => {
                if (gameSnapshot.exists() && !matchHandled) {
                  this.onMatchFound?.(data.matchId!);
                  unsubGame(); // Clean up game listener
                }
              });
              this.cleanup.push(unsubGame);
            }
          } catch (error) {
            console.error('Error checking game document:', error);
            matchHandled = false; // Reset flag if there's an error
          }
        }
      }
    });

    // Search query listener
    const searchingQuery = query(
      this.queueRef,
      where('status', '==', 'searching'), // Only query for 'searching' status
      orderBy('timestamp')
    );
    
    const searchingUnsubscribe = onSnapshot(searchingQuery, async (snapshot) => {
      if (matchHandled) return; // Skip if match already handled

      console.log('Queue snapshot received:', snapshot.docs.length, 'documents');
      
      const players = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp,
          } as QueueEntry;
        })
        .filter(player => {
          if (!player.lastPing) return false;
          
          const lastPingMs = player.lastPing.toMillis();
          const isActive = Date.now() - lastPingMs < 30000;
          
          // Only include searching players for matchmaking
          return isActive && player.status === 'searching';
        });

      console.log('Filtered active searching players:', players.length);

      if (players.length >= 2) {
        const [player1, player2] = players;
        console.log('Potential match found:', player1.id, player2.id);
        
        if (player1.id === this.userId) {
          // Add delay before creating match to ensure second player's listeners are ready
          const player2JoinTime = player2.timestamp.toMillis();
          const timeSinceJoin = Date.now() - player2JoinTime;
          const MINIMUM_WAIT_TIME = 2000; // 2 seconds minimum wait

          if (timeSinceJoin < MINIMUM_WAIT_TIME) {
            console.log(`Waiting ${MINIMUM_WAIT_TIME - timeSinceJoin}ms before creating match...`);
            await new Promise(resolve => setTimeout(resolve, MINIMUM_WAIT_TIME - timeSinceJoin));
          }

          console.log('Creating match as player1');
          try {
            const matchId = await this.createMatch(player1.id, player2.id);
            console.log('Match created:', matchId);
            
            // First update second player, then first player
            await updateDoc(doc(this.queueRef, player2.id), {
              status: 'matched',
              matchId
            });

            // Small delay before updating first player
            await new Promise(resolve => setTimeout(resolve, 500));

            await updateDoc(doc(this.queueRef, player1.id), {
              status: 'matched',
              matchId
            });

            // Then schedule cleanup after both players have been notified
            setTimeout(async () => {
              try {
                await Promise.all([
                  deleteDoc(doc(this.queueRef, player1.id)),
                  deleteDoc(doc(this.queueRef, player2.id))
                ]);
                console.log('Removed players from queue');
              } catch (error) {
                console.error('Error cleaning up queue:', error);
              }
            }, 5000);
          } catch (error) {
            console.error('Error creating match:', error);
          }
        }
      }
    }, (error) => {
      console.error('Queue listener error:', error);
    });

    this.cleanup.push(userStatusUnsubscribe);
    this.cleanup.push(searchingUnsubscribe);
  }

  private async createMatch(player1Id: string, player2Id: string) {
    const matchId = `match_${Date.now()}`;
    await gameManager.createGame(matchId, player1Id, player2Id);
    // Wait a moment to ensure game document is created
    await new Promise(resolve => setTimeout(resolve, 500));
    return matchId;
  }

  leaveQueue() {
    this.cleanup.forEach(cleanup => cleanup());
    this.cleanup = [];
    return deleteDoc(doc(this.queueRef, this.userId));
  }
}
