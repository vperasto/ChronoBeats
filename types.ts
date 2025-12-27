export interface Song {
  id: string;
  artist: string;
  title: string;
  year: number;
  youtubeId: string;
  startAt: number;
}

export interface Player {
  id: string;
  name: string;
  timeline: Song[];
  score: number;
  tokens: number;
}

export enum GamePhase {
  SETUP = 'SETUP',
  LISTENING = 'LISTENING',     // Active player placing
  CHALLENGING = 'CHALLENGING', // Others can challenge
  REVEAL = 'REVEAL',           // Results
  GAME_OVER = 'GAME_OVER'
}

export interface Challenge {
  playerId: string;
  slotIndex: number;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  deck: Song[];
  currentCard: Song | null;
  phase: GamePhase;
  winner: Player | null;
  activePlayerSlot: number | null;
  challenger: Challenge | null;
}
