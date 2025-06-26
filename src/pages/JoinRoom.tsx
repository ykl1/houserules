import { useState } from 'react';
import { Link } from 'react-router-dom';

const JoinRoom = () => {
  const [formData, setFormData] = useState({
    playerName: '',
    roomCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // TODO: Implement room joining logic with backend
    console.log('Joining room with:', formData);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setError('Backend not implemented yet. Coming soon!');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 to-amber-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Link 
            to="/" 
            className="text-stone-600 hover:text-stone-800 transition-colors inline-flex items-center mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Home
          </Link>
          <h2 className="text-3xl font-bold text-stone-800">Join House</h2>
          <p className="mt-2 text-stone-600">Enter the room code to move in</p>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-stone-700">
              Your Name
            </label>
            <input
              type="text"
              id="playerName"
              value={formData.playerName}
              onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
              className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500"
              placeholder="Enter your name"
              required
            />
            <p className="mt-1 text-xs text-stone-500">This is how other roommates will know you</p>
          </div>

          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium text-stone-700">
              Room Code
            </label>
            <input
              type="text"
              id="roomCode"
              value={formData.roomCode}
              onChange={(e) => setFormData({ ...formData, roomCode: e.target.value.toUpperCase() })}
              placeholder="Enter 4-character code"
              className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 uppercase text-center text-lg font-mono tracking-widest"
              maxLength={4}
              required
            />
            <p className="mt-1 text-xs text-stone-500">
              Get this code from your friend who created the house
            </p>
          </div>

          <div className="bg-stone-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-stone-800 mb-2">What to Expect</h3>
            <div className="text-xs text-stone-600 space-y-1">
              <p>• Wait for all roommates to join the house</p>
              <p>• Pitch yourself with positive traits and quirky flaws</p>
              <p>• Vote together on who gets to stay</p>
              <p>• Have fun getting to know your potential roommates!</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || formData.roomCode.length !== 4}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-stone-600 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:bg-stone-400 transition-colors"
          >
            {isLoading ? 'Joining House...' : 'Join House'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-stone-600">
            Need to create a new house?{' '}
            <Link to="/create" className="text-stone-700 hover:text-stone-800 font-medium">
              Create Room
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
