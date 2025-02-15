import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { playerManager } from '@/utils/playerManager';
import { QueueManager } from '@/utils/queueManager';
import { useCurrentUser } from '@/hooks/useCurrentUser';

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
  const [word, setWord] = useState('');
  const [grid, setGrid] = useState(Array(6).fill('').map(() => Array(5).fill('')));
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  // const [players, setPlayers] = useState(playerManager.getPlayers());
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(30);
  const [sessionID, xzsetSessionID] = useState('');
  const [gameState, setGameState] = useState<'matchmaking' | 'searching' | 'playing'>('matchmaking');
  const [queueManager, setQueueManager] = useState<QueueManager | null>(null);

  const initializePlayers = (player1: { id: string, username: string }, player2: { id: string, username: string }) => {
    playerManager.addPlayer(player1.id, player1.username);
    playerManager.addPlayer(player2.id, player2.username);
    setPlayers(playerManager.getPlayers());
  };

  useEffect(() => {
    if (!isLoaded || !currentUserId) return;

    const initGame = async () => {
      try {
        await playerManager.addPlayer(currentUserId, username);
        startNewGame();
        setSessionID(generateSessionID());
      } catch (error) {
        console.error('Error initializing game:', error);
      }
    };

    initGame();
  }, [currentUserId, isLoaded]);

  const generateSessionID = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const startNewGame = () => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(randomWord);
    setGrid(Array(6).fill('').map(() => Array(5).fill('')));
    setCurrentRow(0);
    setCurrentCol(0);
    setGameOver(false);
    setTimer(30);
  };

  const handleTimeout = () => {
    if (!gameOver) {
      switchPlayer();
      return 30; 
    }
    return timer;
  };

  const switchPlayer = () => {
    setCurrentPlayer((prev) => (prev === 0 ? 1 : 0));
    setTimer(30); 
  };

  const handleKeyPress = (key: string) => {
    if (gameOver || currentRow >= grid.length) return;
    const newGrid = [...grid];
    if (key === 'ENTER') {
      if (currentCol === grid[0].length) {
        checkGuess();
      }
      return;
    } else if (key === 'BACKSPACE') {
      if (currentCol > 0) {
        newGrid[currentRow][currentCol - 1] = '';
        setCurrentCol(currentCol - 1);
      }
      return;
    }

    if (currentCol < grid[0].length) {
      newGrid[currentRow][currentCol] = key;
      setCurrentCol(currentCol + 1);
    }
    setGrid(newGrid);
  };

  const checkGuess = () => {
    const guess = grid[currentRow].join('');
    if (guess === word) {
      playerManager.updateScore(players[currentPlayer].id, 10);
      playerManager.updateScore(players[1 - currentPlayer].id, 1);
      setPlayers(playerManager.getPlayers());
      setGameOver(true);
      return;
    }

    if (currentRow === grid.length - 1) {
      playerManager.updateScore(players[0].id, 1);
      playerManager.updateScore(players[1].id, 1);
      setPlayers(playerManager.getPlayers());
      setGameOver(true);
      return;
    }

    setCurrentRow(currentRow + 1);
    setCurrentCol(0);
    switchPlayer();
  };

  const handleSearchStart = async () => {
    if (!currentUserId) return;
    
    setGameState('searching');
    try {
      const manager = new QueueManager(currentUserId);
      setQueueManager(manager);
      await manager.joinQueue();
    } catch (error) {
      console.error('Queue error:', error);
      setGameState('matchmaking');
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
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
      <Text>Session ID: {sessionID}</Text>
      <View style={styles.playerInfo}>
        <Text style={[styles.player, currentPlayer === 0 && styles.activePlayer]}>
          {players[0].username} ({players[0].score})
        </Text>
        <Text style={styles.timer}>⏱ {timer}s</Text>
        <Text style={[styles.player, currentPlayer === 1 && styles.activePlayer]}>
          {players[1].username} ({players[1].score})
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
                  letter
                    ? letter === word[colIndex]
                      ? styles.correct
                      : word.includes(letter)
                      ? styles.misplaced
                      : styles.incorrect
                    : null,
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
          <TouchableOpacity key={key} onPress={() => handleKeyPress(key)} style={styles.key}>
            <Text style={styles.keyText}>{key}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => handleKeyPress('BACKSPACE')} style={[styles.key, styles.specialKey]}>
          <Text style={styles.keyText}>⌫</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleKeyPress('ENTER')} style={[styles.key, styles.specialKey]}>
          <Text style={styles.keyText}>Enter</Text>
        </TouchableOpacity>
      </View>
      
      {gameOver && (
        <TouchableOpacity style={styles.newGameButton} onPress={startNewGame}>
          <Text style={styles.newGameButtonText}>New Game</Text>
        </TouchableOpacity>
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
  },
  activePlayer: {
    color: 'blue', 
  },
  timer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
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