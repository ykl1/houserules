// src/types/gameTypes.ts
export interface Room {
    code: string;
    hostId: string;
    houseCapacity: number;
    players: Player[];
    gameState: GameState;
    currentRound: number;
    currentPlayerIdx: number;
  }
  
  export interface Player {
    id: string;
    name: string;
    isHost: boolean;
    isInHouse: boolean; // true if player is a resident, false if still applicant
    greenCards: GreenCard[];
    redCard: RedCard | null;
    redCards?: RedCard[]; // Temporary property for multiple red cards
    hasSubmittedPitch: boolean;
  }
  
  export interface GreenCard {
    id: string;
    text: string;
  }
  
  export interface RedCard {
    id: string;
    text: string;
  }
  
  export interface Pitch {
    playerId: string;
    playerName: string;
    greenCards: GreenCard[];
    redCard: RedCard;
    pitchText?: string; // Optional custom pitch text
  }
  
  export type GameState = 'waiting' | 'pitching' | 'voting' | 'finished' | 'error';
  