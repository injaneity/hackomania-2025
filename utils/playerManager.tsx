interface Player {
  id: string;
  username: string;
  score: number;
}
// urrr sorry ill add more code here when i know what exact data the user will need
// ~ gong

class PlayerManager {

  private players: Player[] = [
    { id: '100', username: 'Placerholder 1', score: 0 },
    { id: '101', username: 'Placerholder 2', score: 0 }
  ]; // im initalizing 2 players here to bypass the null issue later

  addPlayer(id: string, username: string): void {
    const existingPlayerIndex = this.players.findIndex(p => p.id === id);
    if (existingPlayerIndex !== -1) {
      this.players[existingPlayerIndex].username = username;
    } else if (this.players.length < 2) {
      this.players.push({ id, username, score: 0 });
    }
  }

  getPlayers(): Player[] {
    return this.players;
  }

  updateScore(id: string, points: number): void {
    const player = this.players.find(p => p.id === id);
    if (player) {
      player.score += points;
    }
  }

  reset(): void {
    this.players = [];
  }

}

export const playerManager = new PlayerManager();