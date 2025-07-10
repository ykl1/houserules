// backend/src/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { roomManager } from './roomManager';
import { Player, Room } from './types';

const app = express();
const MAX_PLAYER_LIMIT = 10;
const httpServer = createServer(app);

// Add CORS middleware for Express
app.use(cors({
  origin: "*", // restrict this origin after setting up frontend domain
  methods: ["GET", "POST"]
}));

const io = new Server(httpServer, {
  cors: {
    origin: "*", // restrict this origin after setting up frontend domain
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('create_room', ({ playerName, houseCapacity }, callback) => {
    try {
      const room = roomManager.createRoom(playerName, houseCapacity, socket.id);
      socket.join(room.code);
      callback({ success: true, room });
      console.log(`Room: ${room.code} has been created`);

      // Notify all players in the room of all current players
      const players = room.players;
      emitAllPlayers(room.code, players);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  socket.on('join_room', ({ roomCode, playerName }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) throw new Error('Room not found');

      if (room.players.length >= MAX_PLAYER_LIMIT) {
        throw new Error(`Cannot join room ${roomCode}. The room reached its max capacity of ${MAX_PLAYER_LIMIT} players`);
      }
      
      if (room.gameState !== "waiting") {
        throw new Error(`Cannot join room ${roomCode}. The room is currently playing a game`);
      }

      // Check if house has enough applicant slots
      const currentApplicants = room.players.filter(p => !p.isInHouse).length;
      const maxApplicants = MAX_PLAYER_LIMIT - room.houseCapacity;
      
      if (currentApplicants >= maxApplicants) {
        throw new Error(`Cannot join room ${roomCode}. Too many applicants for this house size`);
      }

      const player = roomManager.addPlayer(roomCode, playerName, socket.id);
      socket.join(roomCode);

      console.log(`Room ${roomCode} has sockets:`, 
        Array.from(io.sockets.adapter.rooms.get(roomCode) || []));

      callback({ success: true, room, player });
      console.log(`Player has joined room: ${room.code}`);
      
      // Notify all players of the updated player list
      emitAllPlayers(room.code, room.players);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  socket.on('rejoin_room', ({ playerId, roomCode }) => {
    try {
      // Validate room exists
      const room = roomManager.getRoom(roomCode);
      if (!room) throw new Error('Room not found');
      
      // Check if player was in this room before
      const existingPlayer = room.players.find(p => p.id === playerId);
      if (existingPlayer) {
        console.log(`Player ${existingPlayer.id} exists`);
        // Update the socket id for this user
        existingPlayer.socketId = socket.id;
        // Join the socket to the room
        socket.join(roomCode);
        
        // Emit all players to the rejoining client
        const players = room.players;
        socket.emit('emit_all_players', { players });
        
        const gameState = room.gameState;
        if (gameState === "waiting") {
          // Just rejoin waiting state
        } else if (gameState === "pitching") {
          socket.emit('pitching_state', { room });
        } else if (gameState === "voting") {
          socket.emit('voting_state', { room });
        } else if (gameState === "finished") {
          socket.emit('finished_state', { gameState });
        } else if (gameState === "error") {
          socket.emit('server_error', { gameState });
        }
        
        console.log(`Client has successfully rejoined room`);
      } else {
        throw new Error('Player not found in room');
      }
    } catch (error) {
      const message = error.message;
      console.log(`Server Error: ${message}`);
      if (message === "Room not found" || message === "Player not found in room") {
        socket.emit('server_error', { gameState: "error" });
      } else {
        emitServerError(roomCode, message);
      }
    }
  });

  socket.on('host_start_pitching_state', ({ roomCode }) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) throw new Error('Room not found');
      
      // Validate minimum players
      const totalPlayers = room.players.length;
      const requiredPlayers = room.houseCapacity + 1; // At least houseCapacity + 1 players
      
      if (totalPlayers < requiredPlayers) {
        throw new Error(`Need at least ${requiredPlayers} players to start. Currently have ${totalPlayers}`);
      }
      
      // Gracefully handle edge case where host emits event multiple times
      if (room.gameState === "pitching") {
        console.log(`Room: ${roomCode} is already in pitching state`);
        return;
      }
      
      room.gameState = "pitching";
      
      // Deal cards to all non-host players
      roomManager.dealCards(roomCode);
      
      io.to(roomCode).emit('pitching_state', { room });
    } catch (error) {
      emitServerError(roomCode, error.message);
    }
  });

  socket.on('host_start_round', ({ roomCode }) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) throw new Error('Room not found');
      
      // Validate all non-host players have submitted
      const nonHostPlayers = room.players.filter(p => !p.isHost);
      const submittedCount = nonHostPlayers.filter(p => p.hasSubmittedPitch).length;
      
      if (submittedCount !== nonHostPlayers.length) {
        throw new Error('Not all players have submitted applications');
      }
      
      // Change game state to pitching
      room.gameState = "pitching";
      
      // Randomly select first pitching player
      const randomIndex = Math.floor(Math.random() * nonHostPlayers.length);
      const firstPitchingPlayer = nonHostPlayers[randomIndex];
      
      // Get the actual card objects for the selected cards
      const selectedGreenCardObjects = (firstPitchingPlayer as any).selectedGreenCards.map((cardId: string) => 
        firstPitchingPlayer.greenCards.find(card => card.id === cardId)
      ).filter(Boolean);
      
      const selectedRedCardObject = (firstPitchingPlayer as any).redCards?.find((card: any) => 
        card.id === (firstPitchingPlayer as any).selectedRedCard
      );
      
      // Set current pitching player with actual card objects
      (room as any).currentPitchingPlayer = {
        id: firstPitchingPlayer.id,
        name: firstPitchingPlayer.name,
        selectedGreenCards: selectedGreenCardObjects,
        selectedRedCard: selectedRedCardObject
      };
      
      console.log(`Round started. ${firstPitchingPlayer.name} is first to pitch.`);
      
      // Notify all players
      io.to(roomCode).emit('round_started', { 
        room,
        currentPitchingPlayer: (room as any).currentPitchingPlayer
      });
      
    } catch (error) {
      emitServerError(roomCode, error.message);
    }
  });

  socket.on('submit_application', ({ roomCode, playerId, selectedGreenCards, selectedRedCard }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) throw new Error('Room not found');

      const player = room.players.find(p => p.id === playerId);
      if (!player) throw new Error('Player not found');
      
      // Gracefully handle if player quickly clicks submit button multiple times
      if (player.hasSubmittedPitch) {
        console.log(`Player (${player.id}) attempted to submit application more than once`);
        callback({ success: false, error: 'Application already submitted' });
        return;
      }

      // Store selected cards and unselected cards
      const allGreenCards = player.greenCards;
      const allRedCards = (player as any).redCards || [];
      
      const unselectedGreenCards = allGreenCards.filter(card => !selectedGreenCards.includes(card.id));
      const unselectedRedCards = allRedCards.filter((card: any) => card.id !== selectedRedCard);

      // Update player with selected and unselected cards
      (player as any).selectedGreenCards = selectedGreenCards;
      (player as any).selectedRedCard = selectedRedCard;
      (player as any).unselectedGreenCards = unselectedGreenCards;
      (player as any).unselectedRedCards = unselectedRedCards;
      
      player.hasSubmittedPitch = true;

      // Count total submissions
      const nonHostPlayers = room.players.filter(p => !p.isHost);
      const submittedCount = nonHostPlayers.filter(p => p.hasSubmittedPitch).length;

      console.log(`Player ${player.name} submitted application. ${submittedCount}/${nonHostPlayers.length} submitted.`);

      // Notify all players of submission count update
      io.to(roomCode).emit('application_count_update', {
        submittedCount,
        totalPlayers: nonHostPlayers.length
      });

      // If all non-host players have submitted, notify host
      if (submittedCount === nonHostPlayers.length) {
        const host = room.players.find(p => p.isHost);
        if (host) {
          io.to(host.socketId).emit('all_applications_submitted');
        }
      }

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
      emitServerError(roomCode, error.message);
    }
  });
  socket.on('get_current_players', ({ roomCode }) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) throw new Error('Room not found');
      emitAllPlayers(room.code, room.players);
    } catch (error) {
      emitServerError(roomCode, error.message);
    }
  });

  const emitAllPlayers = (roomCode: string, players: Player[]) => {
    io.to(roomCode).emit('emit_all_players', { players });
  };

  const emitServerError = (roomCode: string, error: string) => {
    // Get room and update its state if it exists
    const room = roomManager.getRoom(roomCode);
    if (room) {
      room.gameState = "error";
    }
    console.log(`Server Error: ${error}`);
    // Emit both the game state and the error message to all clients in the room
    io.to(roomCode).emit('server_error', {
      gameState: "error",
    });
  };

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
