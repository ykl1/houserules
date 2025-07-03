// backend/src/roomManager.ts
import { Room, Player, GreenCard, RedCard } from './types';

class RoomManager {
  private rooms: Map<string, Room> = new Map();

  generateRoomCode(): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed some letters that could form offensive words
    const digits = '23456789'; // Removed 0/1 which can look like O/I
    let code: string;
    do {
      // Format: letter-number-letter-number
      code = letters[Math.floor(Math.random() * letters.length)] +
             digits[Math.floor(Math.random() * digits.length)] +
             letters[Math.floor(Math.random() * letters.length)] +
             digits[Math.floor(Math.random() * digits.length)];
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostName: string, houseCapacity: number, socketId: string): Room {
    const roomCode = this.generateRoomCode();
    const hostId = Math.random().toString(36).substring(2);
    
    const room: Room = {
      code: roomCode,
      hostId,
      houseCapacity,
      players: [{
        id: hostId,
        socketId: socketId,
        name: hostName,
        isHost: true,
        isInHouse: true, // Host starts as the lease holder (in house)
        greenCards: [],
        redCard: null,
        hasSubmittedPitch: false
      }],
      gameState: 'waiting',
      currentRound: 1,
      currentPlayerIdx: 0
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  deleteRoom(roomCode: string) {
    this.rooms.delete(roomCode);
  }

  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode);
  }

  addPlayer(roomCode: string, playerName: string, socketId: string): Player {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');
    if (room.players.length >= 10) throw new Error('Room is full'); // Max 10 players per House Rules

    // Check for duplicate names
    room.players.forEach(p => {
      if (p.name.toLowerCase() === playerName.toLowerCase()) {
        throw new Error(`Player ${playerName} already exists in the room. Choose a different name`);
      }
    });
    
    const player: Player = {
      id: Math.random().toString(36).substring(2),
      socketId: socketId,
      name: playerName,
      isHost: false,
      isInHouse: false, // New players start as applicants
      greenCards: [],
      redCard: null,
      hasSubmittedPitch: false
    };

    room.players.push(player);
    return player;
  }

  removePlayer(roomCode: string, playerId: string): void {
    const room = this.getRoom(roomCode);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);
    
    // If room is empty or host left, remove the room
    if (room.players.length === 0 || playerId === room.hostId) {
      this.rooms.delete(roomCode);
    }
  }

  // Generate sample cards for the game
  generateGreenCards(): GreenCard[] {
    const positiveTraits = [
      "Always pays rent on time",
      "Excellent cook who shares meals",
      "Super organized and clean",
      "Great at fixing things around the house",
      "Quiet and respectful",
      "Social butterfly who brings friends over",
      "Has a car and gives rides",
      "Works from home and provides security",
      "Loves to host dinner parties",
      "Has streaming subscriptions to share",
      "Great with plants and gardening",
      "Professional cleaner by trade",
      "Never hoards the bathroom",
      "Always replaces the toilet paper",
      "Excellent at conflict resolution",
      "Has connections for cheap furniture",
      "Morning person who can receive deliveries",
      "Night owl perfect for late shift coverage",
      "Minimalist with very few belongings",
      "Has a well-trained, friendly pet"
    ];

    return positiveTraits.map((trait, index) => ({
      id: `green_${index}`,
      text: trait
    }));
  }

  generateRedCards(): RedCard[] {
    const flaws = [
      "Plays music loudly at 3 AM",
      "Never does dishes",
      "Brings dates over every night",
      "Constantly 'borrows' food without asking",
      "Leaves wet towels everywhere",
      "Has 7 cats (didn't mention this before)",
      "Sleepwalks and rearranges furniture",
      "Only communicates through passive-aggressive notes",
      "Collects vintage mannequins as a hobby",
      "Burns everything they attempt to cook",
      "Takes 2-hour showers daily",
      "Practices interpretive dance at dawn",
      "Paranoid about government surveillance",
      "Talks to houseplants (very loudly)",
      "Leaves hair clogs in every drain",
      "Uses communal areas as personal art studio",
      "Throws parties when you're trying to study",
      "Never closes cabinet doors or drawers",
      "Obsessed with conspiracy theories",
      "Leaves dirty clothes in common areas"
    ];

    return flaws.map((flaw, index) => ({
      id: `red_${index}`,
      text: flaw
    }));
  }

  dealCards(roomCode: string): void {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    const greenCards = this.generateGreenCards();
    const redCards = this.generateRedCards();

    // Shuffle cards
    const shuffledGreen = [...greenCards].sort(() => Math.random() - 0.5);
    const shuffledRed = [...redCards].sort(() => Math.random() - 0.5);

    // Get all non-host players
    const nonHostPlayers = room.players.filter(p => !p.isHost);
    
    // Create sabotage assignments - each player sabotages exactly one other player
    const sabotageAssignments = this.createSabotageAssignments(nonHostPlayers);
    
    nonHostPlayers.forEach((player, playerIndex) => {
      // Give each player 4 unique green cards
      player.greenCards = [
        shuffledGreen[playerIndex * 4],
        shuffledGreen[playerIndex * 4 + 1],
        shuffledGreen[playerIndex * 4 + 2],
        shuffledGreen[playerIndex * 4 + 3]
      ];
      
      // Give each player 2 unique red cards  
      const redCardIndices = [playerIndex * 2, playerIndex * 2 + 1];
      player.redCard = null; // We'll store red cards in a separate array
      
      // Add red cards and sabotage target to player
      (player as any).redCards = [
        shuffledRed[redCardIndices[0]],
        shuffledRed[redCardIndices[1]]
      ];
      
      // Assign sabotage target
      (player as any).sabotageTarget = sabotageAssignments[player.id];
    });
  }

  private createSabotageAssignments(players: Player[]): { [playerId: string]: string } {
    const assignments: { [playerId: string]: string } = {};
    const playerIds = players.map(p => p.id);
    const playerNames = players.map(p => p.name);
    
    // Create a circular assignment so each player gets exactly one red card
    for (let i = 0; i < playerIds.length; i++) {
      const currentPlayerId = playerIds[i];
      const targetPlayerName = playerNames[(i + 1) % playerIds.length]; // Next player in circle
      assignments[currentPlayerId] = targetPlayerName;
    }
    
    return assignments;
  }
}

export const roomManager = new RoomManager();
