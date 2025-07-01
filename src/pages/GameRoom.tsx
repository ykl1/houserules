// src/pages/GameRoom.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../utils/socket';
import { Socket } from 'socket.io-client';
import { GameState, Player } from '../types/gameTypes';
import RoomCodeDisplay from '../components/RoomCodeDisplay';

const GameRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  
  const [currentSocket, setCurrentSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [houseCapacity, setHouseCapacity] = useState(2);

  const handleHomeClick = () => {
    navigate("/");
  };

  // Calculate game readiness
  const totalPlayers = players.length;
  const requiredPlayers = houseCapacity + 1; // At least houseCapacity + 1 players
  const hasEnoughPlayers = totalPlayers >= requiredPlayers;
  const residentsCount = players.filter(p => p.isInHouse).length;
  const applicantsCount = players.filter(p => !p.isInHouse).length;

  useEffect(() => {
    // Check for existing session data
    const gameState = localStorage.getItem('gameState');
    const currGameState = gameState ? (gameState as GameState) : 'waiting';
    const playerId = localStorage.getItem('playerId');
    const playerName = localStorage.getItem('playerName');
    const roomCode = localStorage.getItem('roomCode');
    const isHost = localStorage.getItem('isHost');
    const houseCapacity = localStorage.getItem('houseCapacity');
    const isInHouse = localStorage.getItem('isInHouse');

    if (playerId && playerName && roomCode && isHost && houseCapacity) {
      setIsHost(isHost === 'true');
      setHouseCapacity(parseInt(houseCapacity));
      
      const currPlayer: Player = {
        id: playerId,
        name: playerName,
        isHost: isHost === 'true',
        isInHouse: isInHouse === 'true',
        greenCards: [],
        redCard: null,
        hasSubmittedPitch: false
      };
      setCurrentPlayer(currPlayer);
    } else {
      console.log("couldn't find player data in local storage");
    }
    
    setGameState(currGameState);

    // Connect socket if not already connected
    if (!socket.connected) {
      console.log('Connected with ID:', socket.id);
      socket.connect();
    }

    if (gameState === "waiting") {
      socket.emit('get_current_players', { roomCode });
    }

    socket.on('connect', () => {
      console.log('Connected to server');
      // If we have session data, attempt to rejoin the room
      if (playerId && playerName && roomCode) {
        socket.emit('rejoin_room', {
          playerId: playerId,
          roomCode: roomCode
        });
      }
      setCurrentSocket(socket);

      return () => {
        socket.disconnect();
      };
    });
  }, []);

  /*
    Socket On Events
  */
  // Get all current players upon new join
  socket.on('emit_all_players', (currentPlayersInRoom) => {
    setPlayers(currentPlayersInRoom.players);
  });

  // Set game state to pitching phase 
  socket.on('pitching_state', (roomObj) => {
    setGameState(roomObj["room"].gameState);
    localStorage.setItem('gameState', roomObj["room"].gameState);
    
    // Update current player's cards if they are an applicant
    const updatedPlayer = roomObj["room"].players.find((p: Player) => p.id === currentPlayer?.id);
    if (updatedPlayer && !updatedPlayer.isInHouse) {
      setCurrentPlayer(updatedPlayer);
    }
  });

  socket.on('finished_state', (returnObj) => {
    console.log('Game finished:', returnObj);
    setGameState(returnObj["gameState"]);
    localStorage.setItem('gameState', returnObj["gameState"]);
  });

  socket.on('server_error', (returnObj) => {
    console.log(returnObj["gameState"]);
    setGameState(returnObj["gameState"]);
    localStorage.setItem('gameState', returnObj["gameState"]);
  });

  /*
    Socket Emit Events
  */
  const startPitchingState = () => {
    socket.emit('host_start_pitching_state', {
      roomCode: roomCode
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 to-amber-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Room Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              {roomCode && <RoomCodeDisplay roomCode={roomCode} />}
              <p className="text-stone-600">Player: {currentPlayer?.name} {isHost && '(Lease Holder)'}</p>
              <p className="text-stone-600">Game State: {gameState}</p>
              <p className="text-stone-600">House Capacity: {houseCapacity} residents</p>
            </div>
            <div className="text-right">
              {gameState === 'waiting' && (
                <>
                  <p className="text-sm text-stone-600">Total Players: {totalPlayers}</p>
                  <p className="text-sm text-stone-600">Residents: {residentsCount}</p>
                  <p className="text-sm text-stone-600">Applicants: {applicantsCount}</p>
                  {!hasEnoughPlayers && (
                    <p className="text-red-500 mt-1 text-sm">
                      Need {requiredPlayers - totalPlayers} more players to start
                    </p>
                  )}
                </>
              )}
              {isHost && gameState === 'waiting' && (
                <button
                  onClick={startPitchingState}
                  disabled={!hasEnoughPlayers}
                  className="mt-2 px-4 py-2 bg-stone-600 text-white rounded-md disabled:bg-stone-400 hover:bg-stone-700 transition-colors"
                >
                  Start Game
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Game Content */}
        {gameState === 'waiting' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Residents */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-stone-800 flex items-center">
                  <span className="mr-2">🏠</span>
                  Current Residents ({residentsCount}/{houseCapacity})
                </h3>
                <div className="space-y-2">
                  {players
                    .filter(player => player.isInHouse)
                    .map(player => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md"
                      >
                        <span className="font-medium text-stone-800">
                          {player.name} {player.isHost && '(Lease Holder)'}
                        </span>
                        <span className="text-green-600 text-sm">✓ Resident</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Applicants */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-stone-800 flex items-center">
                  <span className="mr-2">📋</span>
                  Applicants ({applicantsCount})
                </h3>
                <div className="space-y-2">
                  {players
                    .filter(player => !player.isInHouse)
                    .map(player => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-md"
                      >
                        <span className="font-medium text-stone-800">{player.name}</span>
                        <span className="text-amber-600 text-sm">📝 Applicant</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Game Info */}
            <div className="mt-6 p-4 bg-stone-50 rounded-lg">
              <h4 className="font-semibold text-stone-800 mb-2">Game Rules Reminder</h4>
              <div className="text-sm text-stone-600 space-y-1">
                <p>• Applicants will pitch themselves using 2 positive traits and 1 quirky flaw</p>
                <p>• Current residents vote on which applicant to accept</p>
                <p>• The house grows by one resident each round until reaching capacity</p>
                <p>• Goal: Be selected to join the household!</p>
              </div>
            </div>
          </div>
        )}

        {gameState === 'pitching' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            {isHost ? (
              <div className="text-center p-8">
                <h3 className="text-xl font-semibold mb-4 text-stone-800">
                  Waiting for all players to submit their resident applications
                </h3>
                <div className="inline-flex items-center px-4 py-2 bg-amber-100 rounded-lg">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-amber-800">Waiting for applications...</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 bg-stone-50 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-stone-800">
                  TODO: implement card drawing logic
                </h3>
              </div>
            )}
          </div>
        )}

        {gameState === 'finished' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-stone-800">Game Complete!</h3>
            <div className="text-center">
              <p className="text-stone-600 mb-6">
                The house is now full! Thanks for playing House Rules.
              </p>
              <button
                onClick={handleHomeClick}
                className="px-6 py-2 bg-stone-600 text-white rounded-md hover:bg-stone-700 transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        )}

        {gameState === 'error' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-red-600">Oops! Something went wrong</h3>
              <p className="text-stone-700 mb-6">
                There was an unexpected issue with the game server. Please try again later.
              </p>
              <button
                onClick={handleHomeClick}
                className="px-6 py-2 bg-stone-600 text-white rounded-md hover:bg-stone-700 transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameRoom;
