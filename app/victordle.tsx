import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { playerManager } from '@/utils/playerManager';
import { QueueManager } from '@/utils/queueManager';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { gameManager, GameState } from '@/utils/gameManager';

const WORDS = ['REACT', 'LOGIC', 'DEBUG', 'ALIAS', 'ARRAY', 'STACK', 'INDEX', 'TOKEN', 'CLASS', 'FRAME', 
               'CACHE', 'PROTO', 'INPUT', 'SHIFT', 'LOOPS', 'CODES', 'VIRUS', 'PATCH', 'FETCH', 'LINES', 
               'QUERY', 'BLOCK', 'CLEAR', 'PARSE', 'SCOPE', 'ALERT', 'CHAIN', 'CLONE'];

const MatchmakingScreen = ({ onStartSearch }: { onStartSearch: () => void }) => {
  return (
    <View style={styles.matchmakingContainer}>
      <Text style={styles.matchmakingTitle}>Welcome to Victordle!</Text>
      <Text style={styles.matchmakingSubtitle}>Challenge other players in real-time</Text>
      <TouchableOpacity style={styles.searchButton} onPress={onStartSearch}>
        <Text style={styles.searchButtonText}>Search for Match</Text>
      </TouchableOpacity>
    </View>
  );
};

const SearchingScreen = () => {
  return (
    <View style={styles.matchmakingContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.searchingText}>Searching for players...</Text>
      <Text style={styles.searchingSubtext}>This may take a few moments</Text>
    </View>
  );
};

const Victordle = () => {
  const { currentUserId, username, isLoaded } = useCurrentUser();
  const [gameState, setGameState] = useState<'matchmaking' | 'searching' | 'playing'>('matchmaking');
  const [queueManager, setQueueManager] = useState<QueueManager | null>(null);
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);
  const [grid, setGrid] = useState(Array(6).fill('').map(() => Array(5).fill('')));
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [timer, setTimer] = useState(30);

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
  };

  const handleKeyPress = async (key: string) => {
    if (!currentGame || currentGame.currentTurn !== currentUserId) return;

    const newGrid = [...grid];
    if (key === 'ENTER') {
      if (currentCol === 5) {
        const guess = newGrid[currentRow].join('');
        await submitGuess(guess);
      }
      return;
    }

    if (key === 'BACKSPACE') {
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
      currentTurn: Object.keys(currentGame.players).find(id => id !== currentUserId)!,
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
    return <MatchmakingScreen onStartSearch={handleSearchStart} />;
  }

  if (gameState === 'searching') {
    return <SearchingScreen />;
  }

  return (
    <View style={styles.container}>
      {currentGame && (
        <>
          <View style={styles.playerInfo}>
            <Text style={[styles.player, currentGame.currentTurn === Object.keys(currentGame.players)[0] && styles.activePlayer]}>
              {currentGame.players[Object.keys(currentGame.players)[0]].username}
            </Text>
            <Text style={styles.timer}>⏱ {timer}s</Text>
            <Text style={[styles.player, currentGame.currentTurn === Object.keys(currentGame.players)[1] && styles.activePlayer]}>
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
                      letter && currentGame.word[colIndex] === letter && styles.correct,
                      letter && currentGame.word.includes(letter) && currentGame.word[colIndex] !== letter && styles.misplaced,
                      letter && !currentGame.word.includes(letter) && styles.incorrect,
                    ]}
                  >
                    <Text style={styles.cellText}>{letter}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.keyboard}>
            {'QWERTYUIOPASDFGHJKLZXCVBNM'.split('').map((key) => (
              <TouchableOpacity 
                key={key} 
                onPress={() => handleKeyPress(key)}
                disabled={currentGame.currentTurn !== currentUserId}
                style={styles.key}
              >
                <Text style={styles.keyText}>{key}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              onPress={() => handleKeyPress('BACKSPACE')} 
              disabled={currentGame.currentTurn !== currentUserId}
              style={[styles.key, styles.specialKey]}
            >
              <Text style={styles.keyText}>⌫</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleKeyPress('ENTER')} 
              disabled={currentGame.currentTurn !== currentUserId}
              style={[styles.key, styles.specialKey]}
            >
              <Text style={styles.keyText}>Enter</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
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
  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
  },
  key: {
    width: 40,
    height: 50,
    marginHorizontal: 5,
    marginVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d3d6da', 
    borderRadius: 5,
  },
  keyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000', 
  },
  specialKey: {
    width: 60, 
    backgroundColor: '#a8a8a8', 
  },
  newGameButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    alignSelf: 'center',
  },
  newGameButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
  },
  matchmakingSubtitle: {
    fontSize: 16,
    color: '#666',
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
  },
  searchingSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

export default Victordle;