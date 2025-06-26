import { useState } from 'react';
import { Link } from 'react-router-dom';

const CreateRoom = () => {
  const [formData, setFormData] = useState({
    playerName: '',
    houseCapacity: 4,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // TODO: Implement room creation logic with backend
    console.log('Creating room with:', formData);
    
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
          <h2 className="text-3xl font-bold text-stone-800">Create Room</h2>
          <p className="mt-2 text-stone-600">Set up your house and invite roommates</p>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
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
            <p className="mt-1 text-xs text-stone-500">You'll be the lease holder (host) of this house</p>
          </div>

          <div>
            <label htmlFor="houseCapacity" className="block text-sm font-medium text-stone-700">
              House Capacity
            </label>
            <select
              id="houseCapacity"
              value={formData.houseCapacity}
              onChange={(e) => setFormData({ ...formData, houseCapacity: Number(e.target.value) })}
              className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500"
            >
              {[2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Resident' : 'Residents'}
                </option>
              ))}
            </select>
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-amber-800 font-medium">
                    Need {formData.houseCapacity + 1}+ players to start
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    With {formData.houseCapacity + 1} players: 1 won't make it into the house<br />
                    With {formData.houseCapacity + 4} players: 4 won't make it into the house
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-stone-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-stone-800 mb-2">Game Preview</h3>
            <div className="text-xs text-stone-600 space-y-1">
              <p>• Players will pitch themselves as ideal roommates</p>
              <p>• Each round, the household grows by one resident</p>
              <p>• Use positive traits to convince, navigate quirky flaws</p>
              <p>• Household votes together on new roommates</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-stone-600 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:bg-stone-400 transition-colors"
          >
            {isLoading ? 'Creating House...' : 'Create House'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-stone-600">
            Already have a room code?{' '}
            <Link to="/join" className="text-stone-700 hover:text-stone-800 font-medium">
              Join Room
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
