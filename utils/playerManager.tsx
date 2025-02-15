interface Player {
  id: string;
  username: string;
  score: number;
}
// urrr sorry ill add more code here when i know what exact data the user will need
// ~ gong

class PlayerManager {
  private players: Player[] = [];

  addPlayer(id: string, username: string): void {
    if (this.players.length < 2) {
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