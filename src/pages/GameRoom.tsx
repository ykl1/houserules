// src/pages/GameRoom.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../utils/socket';
import { Socket } from 'socket.io-client';
import { GameState, Player, PitchingPlayer, GreenCard, RedCard } from '../types/gameTypes';
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
  
  // Card selection state
  const [selectedGreenCards, setSelectedGreenCards] = useState<string[]>([]);
  const [selectedRedCard, setSelectedRedCard] = useState<string | null>(null);
  const [hasSubmittedApplication, setHasSubmittedApplication] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [totalNonHostPlayers, setTotalNonHostPlayers] = useState(0);
  const [allApplicationsSubmitted, setAllApplicationsSubmitted] = useState(false);
  const [currentPitchingPlayer, setCurrentPitchingPlayer] = useState<PitchingPlayer | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'mine'>('current');

  const handleHomeClick = () => {
    navigate("/");
  };

  // Calculate game readiness
  const totalPlayers = players.length;
  const requiredPlayers = houseCapacity + 1; // At least houseCapacity + 1 players
  const hasEnoughPlayers = totalPlayers >= requiredPlayers;
  const residentsCount = players.filter(p => p.isInHouse).length;
  const applicantsCount = players.filter(p => !p.isInHouse).length;

  // Card selection handlers
  const handleGreenCardClick = (cardId: string) => {
    if (selectedGreenCards.includes(cardId)) {
      // Deselect card
      setSelectedGreenCards(selectedGreenCards.filter(id => id !== cardId));
    } else if (selectedGreenCards.length < 2) {
      // Select card (max 2)
      setSelectedGreenCards([...selectedGreenCards, cardId]);
    }
  };

  const handleRedCardClick = (cardId: string) => {
    if (selectedRedCard === cardId) {
      // Deselect card
      setSelectedRedCard(null);
    } else {
      // Select card (only 1 allowed)
      setSelectedRedCard(cardId);
    }
  };

  // Check if ready to apply
  const isReadyToApply = selectedGreenCards.length === 2 && selectedRedCard !== null && !hasSubmittedApplication;

  // Submit application handler
  const handleSubmitApplication = () => {
    if (!isReadyToApply) return;
    
    socket.emit('submit_application', {
      roomCode: roomCode,
      playerId: currentPlayer?.id,
      selectedGreenCards: selectedGreenCards,
      selectedRedCard: selectedRedCard
    }, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        setHasSubmittedApplication(true);
        console.log('Application submitted successfully');
      } else {
        console.error('Failed to submit application:', response.error);
        // Could show error message to user here
      }
    });
  };

  // Start round handler for host
  const handleStartRound = () => {
    socket.emit('host_start_round', {
      roomCode: roomCode
    });
  };

  // Helper function to get card details by ID
  const getCardById = (cardId: string, cardType: 'green' | 'red') => {
    if (!currentPlayer) return null;
    
    if (cardType === 'green') {
      return currentPlayer.greenCards.find(card => card.id === cardId);
    } else {
      return (currentPlayer as any).redCards?.find((card: any) => card.id === cardId);
    }
  };

  // Get selected cards for current player
  const getMySelectedCards = () => {
    if (!currentPlayer) return { greenCards: [], redCard: null };
    
    const greenCards = selectedGreenCards.map(id => getCardById(id, 'green')).filter(Boolean);
    const redCard = selectedRedCard ? getCardById(selectedRedCard, 'red') : null;
    
    return { greenCards, redCard };
  };

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
    
    // Update current player's cards if they are a non-host player
    const updatedPlayer = roomObj["room"].players.find((p: Player) => p.id === currentPlayer?.id);
    if (updatedPlayer && !updatedPlayer.isHost) {
      setCurrentPlayer(updatedPlayer);
    }
    
    // Set total non-host players count
    const nonHostCount = roomObj["room"].players.filter((p: Player) => !p.isHost).length;
    setTotalNonHostPlayers(nonHostCount);
  });

  socket.on('application_count_update', (data) => {
    setSubmissionCount(data.submittedCount);
    setTotalNonHostPlayers(data.totalPlayers);
  });

  socket.on('all_applications_submitted', () => {
    setAllApplicationsSubmitted(true);
  });

  socket.on('round_started', (data) => {
    setGameState('pitching');
    setCurrentPitchingPlayer(data.currentPitchingPlayer);
    localStorage.setItem('gameState', 'pitching');
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

        {gameState === 'pitching' && currentPitchingPlayer && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            {isHost ? (
              // Host View - Show current pitching player's cards
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-stone-800 mb-2">
                    {currentPitchingPlayer.name} is Pitching
                  </h3>
                  <p className="text-sm text-stone-600">
                    Current applicant's resident qualities
                  </p>
                </div>

                {/* Display current pitching player's cards */}
                <div className="space-y-4">
                  {/* Green Cards */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-green-700">
                      POSITIVE TRAITS
                    </h4>
                    {currentPitchingPlayer.selectedGreenCards.map((card, index) => (
                      <div key={card.id} className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-bold text-sm">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-green-700 mb-1">
                              POSITIVE TRAIT
                            </div>
                            <p className="text-stone-800 font-medium leading-snug">
                              {card.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Red Card */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-red-700">
                      QUIRKY FLAW
                    </h4>
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">1</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-red-700 mb-1">
                            QUIRKY FLAW
                          </div>
                          <p className="text-stone-800 font-medium leading-snug">
                            {currentPitchingPlayer.selectedRedCard.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Host control button */}
                <button
                  className="w-full py-3 px-4 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors"
                >
                  Next Application (override)
                </button>
              </div>
            ) : (
              // Non-Host Player View
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-stone-800 mb-2">
                    Application Round
                  </h3>
                  {currentPitchingPlayer.id === currentPlayer?.id ? (
                    <p className="text-sm text-stone-600 font-medium text-green-700">
                      Your Turn to Pitch
                    </p>
                  ) : (
                    <p className="text-sm text-stone-600">
                      {currentPitchingPlayer.name} is currently pitching
                    </p>
                  )}
                </div>

                {/* Tab Navigation for non-pitching players */}
                {currentPitchingPlayer.id !== currentPlayer?.id && (
                  <div className="flex border-b border-stone-200 mb-4">
                    <button
                      onClick={() => setActiveTab('current')}
                      className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'current'
                          ? 'border-stone-600 text-stone-800'
                          : 'border-transparent text-stone-500 hover:text-stone-700'
                      }`}
                    >
                      Current Pitch: {currentPitchingPlayer.name}
                    </button>
                    <button
                      onClick={() => setActiveTab('mine')}
                      className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'mine'
                          ? 'border-stone-600 text-stone-800'
                          : 'border-transparent text-stone-500 hover:text-stone-700'
                      }`}
                    >
                      My Cards
                    </button>
                  </div>
                )}

                {/* Content based on active tab or current player */}
                {(activeTab === 'current' || currentPitchingPlayer.id === currentPlayer?.id) && (
                  <div className="space-y-4">
                    {/* Green Cards */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-green-700">
                        POSITIVE TRAITS
                      </h4>
                      {currentPitchingPlayer.selectedGreenCards.map((card, index) => (
                        <div key={card.id} className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white font-bold text-sm">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-medium text-green-700 mb-1">
                                POSITIVE TRAIT
                              </div>
                              <p className="text-stone-800 font-medium leading-snug">
                                {card.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Red Card */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-red-700">
                        QUIRKY FLAW
                      </h4>
                      <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-bold text-sm">1</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-red-700 mb-1">
                              QUIRKY FLAW
                            </div>
                            <p className="text-stone-800 font-medium leading-snug">
                              {currentPitchingPlayer.selectedRedCard.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Current player's action button */}
                    {currentPitchingPlayer.id === currentPlayer?.id && (
                      <button
                        className="w-full py-3 px-4 bg-stone-600 text-white rounded-lg font-medium hover:bg-stone-700 transition-colors"
                      >
                        Finished Pitch
                      </button>
                    )}
                  </div>
                )}

                {/* My Cards Tab Content */}
                {activeTab === 'mine' && currentPitchingPlayer.id !== currentPlayer?.id && (
                  <div className="space-y-4">
                    {(() => {
                      const myCards = getMySelectedCards();
                      return (
                        <>
                          {/* My Green Cards */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-green-700">
                              MY POSITIVE TRAITS
                            </h4>
                            {myCards.greenCards.map((card, index) => (
                              <div key={card.id} className="p-4 bg-green-50 border-2 border-green-200 rounded-lg opacity-75">
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-white font-bold text-sm">{index + 1}</span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-xs font-medium text-green-700 mb-1">
                                      POSITIVE TRAIT
                                    </div>
                                    <p className="text-stone-800 font-medium leading-snug">
                                      {card.text}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* My Red Card */}
                          {myCards.redCard && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-red-700">
                                MY QUIRKY FLAW
                              </h4>
                              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg opacity-75">
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-white font-bold text-sm">1</span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-xs font-medium text-red-700 mb-1">
                                      QUIRKY FLAW
                                    </div>
                                    <p className="text-stone-800 font-medium leading-snug">
                                      {myCards.redCard.text}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="p-3 bg-stone-50 rounded-lg">
                            <p className="text-xs text-stone-600 text-center">
                              These are the cards you'll pitch when it's your turn
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {gameState === 'pitching' && !isHost && !currentPitchingPlayer && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center p-8">
              <h3 className="text-xl font-semibold mb-4 text-stone-800">
                Waiting for round to start...
              </h3>
            </div>
          </div>
        )}

        {/* Original pitching state for application submission */}
        {gameState === 'pitching' && !currentPitchingPlayer && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            {isHost ? (
              <div className="text-center p-8">
                <h3 className="text-xl font-semibold mb-4 text-stone-800">
                  Waiting for all players to submit their resident applications
                </h3>
                
                {/* Submission Counter */}
                <div className="mb-6">
                  <div className="inline-flex items-center px-4 py-2 bg-amber-100 rounded-lg mb-4">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-amber-800">Applications: {submissionCount}/{totalNonHostPlayers}</span>
                  </div>
                </div>
                
                {/* Start Round Button */}
                <button
                  onClick={handleStartRound}
                  disabled={!allApplicationsSubmitted}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    allApplicationsSubmitted
                      ? 'bg-stone-600 text-white hover:bg-stone-700'
                      : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {allApplicationsSubmitted ? 'Start Round' : 'Waiting for Applications'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-stone-800 mb-2">
                    Choose Your Roommate Qualities
                  </h3>
                  <p className="text-sm text-stone-600">
                    Select 2 green cards (your qualities) and 1 red card (to sabotage {(currentPlayer as any)?.sabotageTarget})
                  </p>
                </div>
                
                {/* Show submission status if submitted */}
                {hasSubmittedApplication && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-800 font-medium">Application Submitted! Waiting for other players...</span>
                    </div>
                  </div>
                )}
                
                {/* Instructions */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <div className="text-xs text-blue-800 space-y-1">
                    <p><strong>Green Cards:</strong> Choose 2 positive traits to represent yourself</p>
                    <p><strong>Red Cards:</strong> Choose 1 flaw to sabotage {(currentPlayer as any)?.sabotageTarget}</p>
                  </div>
                </div>
                
                {/* Mobile-optimized card display */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Green Cards Section */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-green-700 px-2">
                      YOUR POSITIVE TRAITS (Choose 2)
                    </h4>
                    {currentPlayer?.greenCards.map((card, index) => {
                      const isSelected = selectedGreenCards.includes(card.id);
                      const isDisabled = hasSubmittedApplication;
                      return (
                        <div
                          key={card.id}
                          onClick={() => !isDisabled && handleGreenCardClick(card.id)}
                          className={`p-4 border-2 rounded-lg shadow-sm transition-all ${
                            isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                          } ${
                            isSelected 
                              ? 'bg-green-100 border-green-500 shadow-md scale-[1.02]' 
                              : 'bg-green-50 border-green-200 hover:shadow-md hover:border-green-300'
                          }`}
                        >
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                              isSelected ? 'bg-green-600' : 'bg-green-500'
                            }`}>
                              {isSelected ? (
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <span className="text-white font-bold text-sm">{index + 1}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-medium text-green-700 mb-1">
                                POSITIVE TRAIT
                              </div>
                              <p className="text-stone-800 font-medium leading-snug">
                                {card.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Red Cards Section */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-red-700 px-2">
                      SABOTAGE {((currentPlayer as any)?.sabotageTarget || '').toUpperCase()} (Choose 1)
                    </h4>
                    {(currentPlayer as any)?.redCards?.map((card: any, index: number) => {
                      const isSelected = selectedRedCard === card.id;
                      const isDisabled = hasSubmittedApplication;
                      return (
                        <div
                          key={card.id}
                          onClick={() => !isDisabled && handleRedCardClick(card.id)}
                          className={`p-4 border-2 rounded-lg shadow-sm transition-all ${
                            isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                          } ${
                            isSelected 
                              ? 'bg-red-100 border-red-500 shadow-md scale-[1.02]' 
                              : 'bg-red-50 border-red-200 hover:shadow-md hover:border-red-300'
                          }`}
                        >
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                              isSelected ? 'bg-red-600' : 'bg-red-500'
                            }`}>
                              {isSelected ? (
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <span className="text-white font-bold text-sm">{index + 1}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-medium text-red-700 mb-1">
                                QUIRKY FLAW
                              </div>
                              <p className="text-stone-800 font-medium leading-snug">
                                {card.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Selection Summary */}
                <div className="mt-4 p-3 bg-stone-50 rounded-lg">
                  <div className="text-xs text-stone-600 space-y-1">
                    <p>✅ Green Cards Selected: {selectedGreenCards.length}/2</p>
                    <p>✅ Red Card Selected: {selectedRedCard ? '1/1' : '0/1'}</p>
                  </div>
                </div>
                
                {/* Ready to Apply Button */}
                <button
                  onClick={handleSubmitApplication}
                  disabled={!isReadyToApply}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    isReadyToApply
                      ? 'bg-stone-600 text-white hover:bg-stone-700'
                      : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {hasSubmittedApplication 
                    ? 'Application Submitted' 
                    : isReadyToApply 
                      ? 'Ready to Apply' 
                      : 'Select Your Cards'
                  }
                </button>
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
