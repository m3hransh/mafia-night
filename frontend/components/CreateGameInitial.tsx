interface CreateGameInitialProps {
  loading: boolean;
  error: string;
  onCreateGame: () => void;
}

export function CreateGameInitial({ loading, error, onCreateGame }: CreateGameInitialProps) {
  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/30">
      <div className="text-center">
        <p className="text-purple-200 mb-6">
          Click the button below to create a new game. You'll get a unique game code that players can use to join.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <button
          onClick={onCreateGame}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold text-xl px-3 py-3 md:px-12 md:py-6 rounded-xl transition-all transform hover:scale-105 shadow-2xl"
        >
          {loading ? 'Creating Game...' : 'Create Game'}
        </button>
      </div>
    </div>
  );
}
