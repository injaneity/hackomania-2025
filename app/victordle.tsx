import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import { playerManager } from "@/utils/playerManager";
import { QueueManager } from "@/utils/queueManager";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { gameManager, GameState, GuessColors } from "@/utils/gameManager";
import OnScreenKeyboard, {
  ENTER,
  BACKSPACE,
} from "@/components/ui/OnScreenKeyboard";
import { Typography } from "@/constants/Typography";

const calculateGuessColors = (guess: string, targetWord: string): string[] => {
  const colors = Array(5).fill("#787c7e"); // Default gray
  const letterCount: { [key: string]: number } = {};

  // Count letters in target word
  for (const char of targetWord) {
    letterCount[char] = (letterCount[char] || 0) + 1;
  }

  // First pass: Mark exact matches (green)
  for (let i = 0; i < 5; i++) {
    if (guess[i] === targetWord[i]) {
      colors[i] = "#6aaa64"; // green
      letterCount[guess[i]]--;
    }
  }

  // Second pass: Mark yellow matches
  for (let i = 0; i < 5; i++) {
    if (colors[i] !== "#6aaa64" && letterCount[guess[i]] > 0) {
      colors[i] = "#c9b458"; // yellow
      letterCount[guess[i]]--;
    }
  }

  return colors;
};

const Victordle = () => {
  const { currentUserId, username, isLoaded } = useCurrentUser();
  const [gameState, setGameState] = useState<
    "matchmaking" | "searching" | "playing"
  >("matchmaking");
  const [queueManager, setQueueManager] = useState<QueueManager | null>(null);
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);
  const [grid, setGrid] = useState<string[][]>(
    Array.from({ length: 6 }, () => Array(5).fill(""))
  );
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [currentCol, setCurrentCol] = useState<number>(0);
  const [timer, setTimer] = useState<number>(10);
  const [winner, setWinner] = useState<string | null>(null);

  // Optional: Arrays to control keyboard letter colors.
  const [greenLetters, setGreenLetters] = useState<string[]>([]);
  const [yellowLetters, setYellowLetters] = useState<string[]>([]);
  const [grayLetters, setGrayLetters] = useState<string[]>([]);

  // State for the floating help modal
  const [helpVisible, setHelpVisible] = useState(false);

  useEffect(() => {
    if (!isLoaded || !currentUserId) return;
    (async () => {
      await playerManager.addPlayer(currentUserId, username);
    })();
  }, [currentUserId, isLoaded, username]);

  const handleMatchFound = (matchId: string) => {
    gameManager.subscribeToGame(matchId, (game) => {
      setCurrentGame(game);
      setGameState("playing");
      resetGameBoard();
    });
  };

  const handleSearchStart = async () => {
    if (!currentUserId) return;
    setGameState("searching");
    try {
      const manager = new QueueManager(currentUserId);
      setQueueManager(manager);
      await manager.joinQueue(handleMatchFound);
    } catch (error) {
      console.error("Queue error:", error);
      setGameState("matchmaking");
    }
  };

  const resetGameBoard = () => {
    setGrid(
      Array(6)
        .fill("")
        .map(() => Array(5).fill(""))
    );
    setCurrentRow(0);
    setCurrentCol(0);
    setTimer(10);
    setGreenLetters([]);
    setYellowLetters([]);
    setGrayLetters([]);
  };

  const handleTurnTimeout = async () => {
    if (!currentGame) return;

    // Find the other player's ID (currentGame.currentTurn holds the ID of the active player)
    const nextTurn = Object.keys(currentGame.players).find(
      (id) => id !== currentGame.currentTurn
    );

    if (!nextTurn) return;

    const updates: Partial<GameState> = {
      currentTurn: nextTurn,
      lastMoveTimestamp: Date.now(),
    };

    // Update the game state on Firestore
    await gameManager.updateGameState(currentGame.id, updates);

    // Reset the timer for the new turn
    setTimer(10);
  };

  useEffect(() => {
    // Only run the countdown if the game is active
    if (!currentGame || currentGame.status === "finished") return;

    const countdown = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          // Time's up for the current turn: pass the turn
          handleTurnTimeout();
          // Reset timer for the new turn
          return 10;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [currentGame?.currentTurn, currentGame?.status]);

  useEffect(() => {
    if (currentGame) {
      const newGrid = Array(6)
        .fill("")
        .map(() => Array(5).fill(""));

      // Combine guesses from both players in alternating order
      const combinedGuesses: Array<{ word: string; colors: string[] }> = [];
      const maxGuesses = Math.max(
        currentGame.players[currentGame.playerOrder[0]].guesses.length,
        currentGame.players[currentGame.playerOrder[1]].guesses.length
      );

      for (let i = 0; i < maxGuesses; i++) {
        for (const playerId of currentGame.playerOrder) {
          const guess = currentGame.players[playerId].guesses[i];
          if (guess) {
            combinedGuesses.push(guess);
          }
        }
      }

      // Fill grid with ordered guesses
      combinedGuesses.forEach(({ word }, index) => {
        for (let i = 0; i < 5; i++) {
          newGrid[index][i] = word[i];
        }
      });

      setGrid(newGrid);
      setCurrentRow(combinedGuesses.length);
      setCurrentCol(0);
    }
  }, [currentGame]);

  const updateLetterStates = (guesses: string[], word: string) => {
    const green: string[] = [];
    const yellow: string[] = [];
    const gray: string[] = [];

    guesses.forEach((guess) => {
      for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];
        if (word[i] === letter) {
          green.push(letter);
        } else if (word.includes(letter)) {
          yellow.push(letter);
        } else {
          gray.push(letter);
        }
      }
    });

    setGreenLetters(green);
    setYellowLetters(yellow);
    setGrayLetters(gray);
  };

  const submitGuess = async (guess: string) => {
    if (!currentGame || currentGame.currentTurn !== currentUserId) return;

    // Calculate colors immediately
    const colors = calculateGuessColors(guess, currentGame.word);

    const updates: Partial<GameState> = {
      currentTurn: Object.keys(currentGame.players).find(
        (id) => id !== currentUserId
      )!,
      lastMoveTimestamp: Date.now(),
    };

    // Update guesses with colors
    const playerGuesses = [
      ...currentGame.players[currentUserId].guesses,
      { word: guess, timestamp: Date.now(), colors },
    ];

    updates.players = {
      ...currentGame.players,
      [currentUserId]: {
        ...currentGame.players[currentUserId],
        guesses: playerGuesses,
      },
    };

    // Check win/loss conditions
    if (guess === currentGame.word) {
      updates.status = "finished";
      await playerManager.updateScore(currentUserId, 10);
    } else if (playerGuesses.length === 6) {
      updates.status = "finished";
    }
    console.log("Updates: ", updates);
    // Update game state in Firestore
    await gameManager.updateGameState(currentGame.id, updates);
  };

  // Modified handleKeyPress
  const handleKeyPress = async (key: string) => {
    if (
      !currentGame ||
      currentGame.currentTurn !== currentUserId ||
      currentGame.status === "finished"
    )
      return;

    // Use a deep copy of the grid so that each row is recreated.
    const newGrid = grid.map((row) => [...row]);

    if (key === "ENTER") {
      if (currentCol === 5) {
        // Capture the guessed word from the current row.
        const guess = newGrid[currentRow].join("");
        // The guess remains on the grid; simply submit it.
        await submitGuess(guess);
      }
      return;
    }

    if (key === "BACKSPACE") {
      if (currentCol > 0) {
        newGrid[currentRow][currentCol - 1] = "";
        setCurrentCol(currentCol - 1);
      }
      setGrid(newGrid);
      return;
    }

    if (currentCol < 5) {
      newGrid[currentRow][currentCol] = key.toUpperCase();
      setCurrentCol(currentCol + 1);
    }
    setGrid(newGrid);
  };

  // Add game completion check
  useEffect(() => {
    if (currentGame?.status === "finished") {
      // Find winner by checking who submitted the correct guess
      const winner = Object.entries(currentGame.players).find(([_, player]) =>
        player.guesses.some((g) => g.word === currentGame.word)
      );
      if (winner) {
        setWinner(winner[0]);
      }
    }
  }, [currentGame?.status]);

  // Update letter states based on all guesses when game state changes
  useEffect(() => {
    if (currentGame) {
      const greenSet = new Set<string>();
      const yellowSet = new Set<string>();
      const graySet = new Set<string>();

      // Get all guesses from both players in timestamp order
      const allGuesses = currentGame.playerOrder
        .reduce(
          (acc, playerId) => [...acc, ...currentGame.players[playerId].guesses],
          [] as GuessColors[]
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      allGuesses.forEach((guess) => {
        const word = guess.word;
        const colors = guess.colors;

        for (let i = 0; i < word.length; i++) {
          const letter = word[i].toUpperCase();
          const color = colors[i];

          if (color === "#6aaa64") {
            yellowSet.delete(letter);
            graySet.delete(letter);
            greenSet.add(letter);
          } else if (color === "#c9b458" && !greenSet.has(letter)) {
            graySet.delete(letter);
            yellowSet.add(letter);
          } else if (!greenSet.has(letter) && !yellowSet.has(letter)) {
            graySet.add(letter);
          }
        }
      });

      setGreenLetters(Array.from(greenSet));
      setYellowLetters(Array.from(yellowSet));
      setGrayLetters(Array.from(graySet));
    }
  }, [currentGame?.players]);

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

  if (gameState === "matchmaking") {
    return (
      <View style={styles.matchmakingContainer}>
        <Text style={styles.matchmakingTitle}>Welcome to Victordle!</Text>
        <Text style={styles.matchmakingSubtitle}>
          Challenge other players in real-time
        </Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchStart}
        >
          <Text style={styles.searchButtonText}>Search for Match</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (gameState === "searching") {
    return (
      <View style={styles.matchmakingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.searchingText}>Searching for players...</Text>
        <Text style={styles.searchingSubtext}>
          This may take a few moments
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentGame && (
        <>
          <View style={styles.playerInfo}>
            <View style={styles.playerContainer}>
              <Text
                style={[
                  styles.player,
                  currentGame.currentTurn === currentGame.playerOrder[0] &&
                    styles.activePlayer,
                ]}
              >
                {currentGame.players[currentGame.playerOrder[0]].username}
              </Text>
              {currentGame.playerOrder[0] === currentUserId ? (
                currentGame.currentTurn === currentUserId ? (
                  <Text style={styles.turnIndicator}>Your Turn</Text>
                ) : (
                  <Text style={styles.turnIndicator}>Waiting</Text>
                )
              ) : (
                currentGame.currentTurn === currentGame.playerOrder[0] && (
                  <Text style={styles.turnIndicator}>Opponent's Turn</Text>
                )
              )}
            </View>

            <Text style={styles.timer}>⏱ {timer}s</Text>

            <View style={styles.playerContainer}>
              <Text
                style={[
                  styles.player,
                  currentGame.currentTurn === currentGame.playerOrder[1] &&
                    styles.activePlayer,
                ]}
              >
                {currentGame.players[currentGame.playerOrder[1]].username}
              </Text>
              {currentGame.playerOrder[1] === currentUserId ? (
                currentGame.currentTurn === currentUserId ? (
                  <Text style={styles.turnIndicator}>Your Turn</Text>
                ) : (
                  <Text style={styles.turnIndicator}>Waiting</Text>
                )
              ) : (
                currentGame.currentTurn === currentGame.playerOrder[1] && (
                  <Text style={styles.turnIndicator}>Opponent's Turn</Text>
                )
              )}
            </View>
          </View>
          <View style={styles.grid}>
            {grid.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((letter, colIndex) => {
                  // Get the colors from the stored guesses
                  let backgroundColor = "#f9f9f9";
                  if (currentGame) {
                    const allGuesses = currentGame.playerOrder.reduce(
                      (acc, playerId) => [
                        ...acc,
                        ...currentGame.players[playerId].guesses,
                      ],
                      [] as GuessColors[]
                    );
                    const sortedGuesses = allGuesses.sort(
                      (a, b) => a.timestamp - b.timestamp
                    );
                    if (sortedGuesses[rowIndex]) {
                      backgroundColor =
                        sortedGuesses[rowIndex].colors[colIndex];
                    }
                  }
                  return (
                    <View
                      key={colIndex}
                      style={[styles.cell, letter && { backgroundColor }]}
                    >
                      <Text style={styles.cellText}>{letter}</Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {currentGame.status === "finished" ? (
            <View style={styles.gameOverContainer}>
              <Text style={styles.gameOverText}>
                {winner
                  ? winner === currentUserId
                    ? "You won! 🎉"
                    : "Better luck next time!"
                  : "Game Over!"}
              </Text>
              <Text style={styles.wordReveal}>
                The word was: {currentGame.word}
              </Text>
            </View>
          ) : (
            <OnScreenKeyboard
              onKeyPressed={handleKeyPress}
              greenLetters={greenLetters}
              yellowLetters={yellowLetters}
              grayLetters={grayLetters}
            />
          )}
        </>
      )}

      {/* Floating Help Button */}
      <TouchableOpacity
        style={styles.helpButton}
        onPress={() => setHelpVisible(true)}
      >
        <Text style={styles.helpButtonText}>?</Text>
      </TouchableOpacity>

      {/* Help Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={helpVisible}
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How to Play</Text>
            <Text style={styles.modalText}>
              Enter your guess using the on-screen keyboard. Green letters mean
              the letter is correct and in the right place; yellow means it is
              in the word but in the wrong place; gray means the letter is not
              in the word. Try to guess the word in six attempts!
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setHelpVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#222" },
  playerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  playerContainer: {
    flex: 1,
    alignItems: "center",
  },
  player: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  activePlayer: {
    color: "blue", // active player's name is highlighted
  },
  timer: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  turnIndicator: {
    fontSize: 12,
    color: "lightgray",
    marginTop: 4,
    textAlign: "center",
  },
  grid: {
    alignSelf: "center",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: "#d3d3d3",
    justifyContent: "center",
    alignItems: "center",
    margin: 2,
    backgroundColor: "#f9f9f9",
  },
  cellText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  matchmakingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  matchmakingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
  },
  matchmakingSubtitle: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 30,
    textAlign: "center",
  },
  searchButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
  },
  searchButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  searchingText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    color: "#fff",
  },
  searchingSubtext: {
    fontSize: 16,
    color: "#ccc",
    marginTop: 10,
  },
  gameOverContainer: {
    alignItems: "center",
    marginTop: 20,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
  },
  gameOverText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  wordReveal: {
    fontSize: 18,
    color: "#fff",
    opacity: 0.8,
  },
  // Floating help button styles
  helpButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#4CAF50",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  helpButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  // Help modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalCloseButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  modalCloseText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default Victordle;
