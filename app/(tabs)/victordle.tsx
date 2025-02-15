import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { playerManager } from '@/utils/playerManager';

const WORDS = ['REACT', 'LOGIC', 'DEBUG', 'ALIAS', 'ARRAY', 'STACK', 'INDEX', 'TOKEN', 'CLASS', 'FRAME', 
               'CACHE', 'PROTO', 'INPUT', 'SHIFT', 'LOOPS', 'CODES', 'VIRUS', 'PATCH', 'FETCH', 'LINES', 
               'QUERY', 'BLOCK', 'CLEAR', 'PARSE', 'SCOPE', 'ALERT', 'CHAIN', 'CLONE'];

// this is hardcoded rn, when its good enough ill see if can query an api for words
// ~gong

const Victordle = () => {
  const [word, setWord] = useState('');
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [players, setPlayers] = useState(playerManager.getPlayers());

  // how are we handling player registration???
  // ~gong

  useEffect(() => {
    if (players.length < 2) { 
      playerManager.addPlayer('1', 'Player 1');
      playerManager.addPlayer('2', 'Player 2');
      setPlayers(playerManager.getPlayers());
    }
    startNewGame();
  }, []);

  const startNewGame = () => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(randomWord);
    setGuess('');
    setAttempts([]);
    setGameOver(false);
    setCurrentPlayer(0);
  };

  const handleGuess = () => {
    if (guess.length !== 5) return;
    
    setAttempts([...attempts, guess]);
    if (guess === word) {
      setGameOver(true);
      playerManager.updateScore(players[currentPlayer].id, 10); // im gonna give winner 10
      playerManager.updateScore(players[1 - currentPlayer].id, 1); // im gonna give loser 1 
    } else if (attempts.length === 5) {
      setGameOver(true);
      playerManager.updateScore(players[0].id, 1);
      playerManager.updateScore(players[1].id, 1);
    } else {
      setCurrentPlayer(1 - currentPlayer);
    }
    setGuess('');
    setPlayers(playerManager.getPlayers());
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Victordle</ThemedText>
      <ThemedText>Current Player: {players[currentPlayer]?.username}</ThemedText>
      {players.map(player => (
        <ThemedText key={player.id}>{player.username}: {player.score} points</ThemedText>
      ))}
      {attempts.map((attempt, index) => (
        <View key={index} style={styles.attemptRow}>
          {attempt.split('').map((letter, i) => (
            <View key={i} style={[
              styles.letter,
              { backgroundColor: letter === word[i] ? 'green' : word.includes(letter) ? 'yellow' : 'gray' }
            ]}>
              <Text style={styles.letterText}>{letter}</Text>
            </View>
          ))}
        </View>
      ))}
      {!gameOver && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={guess}
            onChangeText={setGuess}
            maxLength={5}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.button} onPress={handleGuess}>
            <Text style={styles.buttonText}>Guess</Text>
          </TouchableOpacity>
        </View>
      )}
      {gameOver && (
        <View>
          <ThemedText style={styles.gameOverText}>
            {guess === word ? `${players[currentPlayer].username} won!` : `Game Over. The word was ${word}`}
          </ThemedText>
          <TouchableOpacity style={styles.button} onPress={startNewGame}>
            <Text style={styles.buttonText}>New Game</Text>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  attemptRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  letter: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  letterText: {
    fontSize: 20,
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    width: 150,
    marginRight: 10,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  gameOverText: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default Victordle;