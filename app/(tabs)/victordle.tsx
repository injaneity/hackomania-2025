import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { playerManager } from '@/utils/playerManager';

const WORDS = ['REACT', 'LOGIC', 'DEBUG', 'ALIAS', 'ARRAY', 'STACK', 'INDEX', 'TOKEN', 'CLASS', 'FRAME', 
               'CACHE', 'PROTO', 'INPUT', 'SHIFT', 'LOOPS', 'CODES', 'VIRUS', 'PATCH', 'FETCH', 'LINES', 
               'QUERY', 'BLOCK', 'CLEAR', 'PARSE', 'SCOPE', 'ALERT', 'CHAIN', 'CLONE'];

// this is hardcoded rn, when its good enough ill see if can query an api for words
// ~gong

const Victordle = () => {
  const [word, setWord] = useState('');
  const [grid, setGrid] = useState(Array(6).fill('').map(() => Array(5).fill('')));
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [players, setPlayers] = useState(playerManager.getPlayers());
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(30);
  const [sessionID, setSessionID] = useState('');

  // TODO
  // rn we just hardcoding the 2 players 
  // will need to edit the logic below to handle dynamic loading of 2 logged on players
  // ~gong

  useEffect(() => {
    if (players.length < 2) { 
      playerManager.addPlayer('100', 'Set Lin v1');
      playerManager.addPlayer('101', 'Set Lin v2');
      setPlayers(playerManager.getPlayers());
    }
    startNewGame();
    setSessionID(generateSessionID());
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : handleTimeout()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
  }
});

export default Victordle;