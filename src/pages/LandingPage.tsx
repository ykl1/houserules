import { Link } from 'react-router-dom';const LandingPage = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 to-amber-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-stone-800 mb-8 flex items-center justify-center">
            <span>House Rules</span>
            <span className="text-sm align-top ml-2">(alpha)</span>
          </h1>
          <p className="text-xl text-stone-700 mb-12">
            Pitch yourself. Sabotage your rivals. Win the lease.
          </p>
  
          <div className="space-y-4 mb-16">
            <Link
              to="/create"
              className="w-full max-w-md mx-auto block py-3 px-6 border border-transparent shadow-sm text-lg font-medium rounded-md text-white bg-stone-600 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-colors"
            >
              Create New House
            </Link>
            
            <Link
              to="/join"
              className="w-full max-w-md mx-auto block py-3 px-6 border-2 border-stone-600 shadow-sm text-lg font-medium rounded-md text-stone-700 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-colors"
            >
              Join House
            </Link>
          </div>
  
          {/* Game Overview */}
          <div className="mt-16 text-stone-700">
            <h2 className="text-2xl font-semibold mb-6">How House Rules Works</h2>
            <div className="text-left max-w-3xl mx-auto space-y-4">
              <div className="flex items-start">
                <span className="mr-3 text-lg">🏠</span>
                <span><strong>Core Concept:</strong> Players pitch themselves as ideal roommates using positive traits while navigating sabotaging flaws</span>
              </div>
              <div className="flex items-start">
                <span className="mr-3 text-lg">👥</span>
                <span><strong>Players:</strong> 4-10 players (perfect for parties and game nights)</span>
              </div>
              <div className="flex items-start">
                <span className="mr-3 text-lg">🎯</span>
                <span><strong>Goal:</strong> Get selected to join the household by making the best pitch</span>
              </div>
              <div className="flex items-start">
                <span className="mr-3 text-lg">🃏</span>
                <span><strong>Gameplay:</strong> Use 2 Green Cards (positive traits) + 1 Red Card (flaw) to pitch yourself</span>
              </div>
              <div className="flex items-start">
                <span className="mr-3 text-lg">🏆</span>
                <span><strong>Winning:</strong> Be among the final residents when the house reaches capacity</span>
              </div>
              <div className="flex items-start">
                <span className="mr-3 text-lg">✨</span>
                <span><strong>Innovation:</strong> The household grows each round, creating escalating social dynamics</span>
              </div>
            </div>
          </div>
  
          {/* Development Status */}
          <div className="mt-16 pt-8 border-t border-stone-300 text-stone-600">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold mb-4">🚧 In Development</h3>
              <p className="text-sm">
                House Rules is currently in active development. We're building the core game mechanics, 
                card system, and multiplayer functionality. Follow our progress and get notified when we launch!
              </p>
            </div>
            
            {/* Social Links */}
            <div className="mt-8 flex items-center justify-center space-x-6">
              <a
                href="https://www.instagram.com/youngkwangleee/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-stone-600 hover:text-stone-800 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 mr-2"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>Instagram</span>
              </a>
              <a
                href="https://www.linkedin.com/in/youngkwanglee/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-stone-600 hover:text-stone-800 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 mr-2"
                >
                  <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 21h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
                </svg>
                <span>LinkedIn</span>
              </a>
            </div>
            
            <div className="mt-4">
              <span className="text-md">Built with ♥</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default LandingPage;