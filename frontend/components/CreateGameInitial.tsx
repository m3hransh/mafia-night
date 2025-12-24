import { Button } from './Button';

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

        <Button
          onClick={onCreateGame}
          disabled={loading}
          size="xl"
          scaleOnHover
          className="shadow-2xl"
        >
          {loading ? 'Creating Game...' : 'Create Game'}
        </Button>
      </div>
    </div>
  );
}
