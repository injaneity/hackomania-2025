import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { playerManager } from '@/utils/playerManager';
import { QueueManager } from '@/utils/queueManager';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { gameManager, GameState } from '@/utils/gameManager';
import OnScreenKeyboard, { ENTER, BACKSPACE } from '@/components/ui/OnScreenKeyboard';
import { Typography } from '@/constants/Typography';

const Victordle = () => {
  const { currentUserId, username, isLoaded } = useCurrentUser();
  const [gameState, setGameState] = useState<'matchmaking' | 'searching' | 'playing'>('matchmaking');
  const [queueManager, setQueueManager] = useState<QueueManager | null>(null);
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);
  const [grid, setGrid] = useState<string[][]>(Array(6).fill('').map(() => Array(5).fill('')));
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [currentCol, setCurrentCol] = useState<number>(0);
  const [timer, setTimer] = useState<number>(30);

  // Optional: Arrays to control letter colors on the keyboard.
  // You might update these based on game feedback.
  const [greenLetters, setGreenLetters] = useState<string[]>([]);
  const [yellowLetters, setYellowLetters] = useState<string[]>([]);
  const [grayLetters, setGrayLetters] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoaded || !currentUserId) return;
    
    const initPlayer = async () => {
      await playerManager.addPlayer(currentUserId, username);
    };

    initPlayer();
  }, [currentUserId, isLoaded, username]);

  const handleMatchFound = (matchId: string) => {
    gameManager.subscribeToGame(matchId, (game) => {
      setCurrentGame(game);
      setGameState('playing');
      resetGameBoard();
    });
  };

  const handleSearchStart = async () => {
    if (!currentUserId) return;
    
    setGameState('searching');
    try {
      const manager = new QueueManager(currentUserId);
      setQueueManager(manager);
      await manager.joinQueue(handleMatchFound);
    } catch (error) {
      console.error('Queue error:', error);
      setGameState('matchmaking');
    }
  };

  const resetGameBoard = () => {
    setGrid(Array(6).fill('').map(() => Array(5).fill('')));
    setCurrentRow(0);
    setCurrentCol(0);
    setTimer(30);
    // Reset keyboard letter colors if needed
    setGreenLetters([]);
    setYellowLetters([]);
    setGrayLetters([]);
  };

  const handleKeyPress = async (key: string) => {
    // Ensure the game exists and it's the current player's turn.
    if (!currentGame || currentGame.currentTurn !== currentUserId) return;

    // Convert letter keys to uppercase for consistency
    if (key !== ENTER && key !== BACKSPACE) {
      key = key.toUpperCase();
    }

    const newGrid = [...grid];

    if (key === ENTER) {
      if (currentCol === 5) {
        const guess = newGrid[currentRow].join('');
        await submitGuess(guess);
      }
      return;
    }

    if (key === BACKSPACE) {
      if (currentCol > 0) {
        newGrid[currentRow][currentCol - 1] = '';
        setCurrentCol(currentCol - 1);
      }
      return;
    }

    if (currentCol < 5) {
      newGrid[currentRow][currentCol] = key;
      setCurrentCol(currentCol + 1);
    }
    setGrid(newGrid);
  };

  const submitGuess = async (guess: string) => {
    if (!currentGame) return;

    const updates: Partial<GameState> = {
      currentTurn: Object.keys(currentGame.players).find((id) => id !== currentUserId)!,
      lastMoveTimestamp: Date.now(),
    };

    // Update player's guesses
    const playerGuesses = [...(currentGame.players[currentUserId].guesses || []), guess];
    updates.players = {
      ...currentGame.players,
      [currentUserId]: {
        ...currentGame.players[currentUserId],
        guesses: playerGuesses,
      },
    };

    // You might want to add logic here to update the keyboard letter colors based on the guess.

    if (guess === currentGame.word) {
      updates.status = 'finished';
      // Update scores
      await playerManager.updateScore(currentUserId, 10);
    } else if (currentRow === 5) {
      updates.status = 'finished';
    }

    await gameManager.updateGameState(currentGame.id, updates);
    setCurrentRow(currentRow + 1);
    setCurrentCol(0);
  };

  useEffect(() => {
    return () => {
      queueManager?.leaveQueue();
    };
  }, [queueManager]);

  if (!isLoaded || !currentUserId) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (gameState === 'matchmaking') {
    return (
      <View style={styles.matchmakingContainer}>
        <Text style={[styles.matchmakingTitle, Typography.header]}>Welcome to Victordle!</Text>
        <Text style={[styles.matchmakingSubtitle, Typography.subheader]}>Challenge other players in real-time</Text>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearchStart}>
          <Text style={[styles.searchButtonText, Typography.body]}>Search for Match</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (gameState === 'searching') {
    return (
      <View style={styles.matchmakingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.searchingText}>Searching for players...</Text>
        <Text style={styles.searchingSubtext}>This may take a few moments</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentGame && (
        <>
          <View style={styles.playerInfo}>
            <Text
              style={[
                styles.player,
                currentGame.currentTurn === Object.keys(currentGame.players)[0] && styles.activePlayer,
              ]}
            >
              {currentGame.players[Object.keys(currentGame.players)[0]].username}
            </Text>
            <Text style={styles.timer}>⏱ {timer}s</Text>
            <Text
              style={[
                styles.player,
                currentGame.currentTurn === Object.keys(currentGame.players)[1] && styles.activePlayer,
              ]}
            >
              {currentGame.players[Object.keys(currentGame.players)[1]].username}
            </Text>
          </View>

          <View style={styles.grid}>
            {grid.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((letter, colIndex) => (
                  <View
                    key={colIndex}
                    style={[
                      styles.cell,
                      letter &&
                        currentGame.word[colIndex] === letter &&
                        styles.correct,
                      letter &&
                        currentGame.word.includes(letter) &&
                        currentGame.word[colIndex] !== letter &&
                        styles.misplaced,
                      letter &&
                        !currentGame.word.includes(letter) &&
                        styles.incorrect,
                    ]}
                  >
                    <Text style={styles.cellText}>{letter}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* Integrate the custom OnScreenKeyboard */}
          <OnScreenKeyboard
            onKeyPressed={handleKeyPress}
            greenLetters={greenLetters}
            yellowLetters={yellowLetters}
            grayLetters={grayLetters}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#222' },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  player: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  activePlayer: {
    color: 'blue',
  },
  timer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  grid: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: '#d3d3d3',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    backgroundColor: '#f9f9f9',
  },
  cellText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  correct: {
    backgroundColor: '#6aaa64',
    borderColor: '#6aaa64',
  },
  misplaced: {
    backgroundColor: '#c9b458',
    borderColor: '#c9b458',
  },
  incorrect: {
    backgroundColor: '#787c7e',
    borderColor: '#787c7e',
  },
  matchmakingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  matchmakingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  matchmakingSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 30,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchingText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#fff',
  },
  searchingSubtext: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 10,
  },
});

export default Victordle;
