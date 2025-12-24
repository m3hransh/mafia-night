import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Role } from '@/lib/api';

interface RoleFormProps {
  initialData?: Role;
  onSubmit: (role: Omit<Role, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export function RoleForm({ initialData, onSubmit, onCancel }: RoleFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [team, setTeam] = useState<'mafia' | 'village' | 'independent'>('village');
  const [video, setVideo] = useState('https://res.cloudinary.com/m3hransh/video/upload/mafia-roles/Constantine.webm');
  const [abilities, setAbilities] = useState<string[]>([]);
  const [newAbility, setNewAbility] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSlug(initialData.slug);
      setDescription(initialData.description);
      setTeam(initialData.team);
      setVideo(initialData.video);
      setAbilities(initialData.abilities || []);
    }
  }, [initialData]);

  // Auto-generate slug from name if creating new role
  useEffect(() => {
    if (!initialData && name) {
      setSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  }, [name, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await onSubmit({
        name,
        slug,
        description,
        team,
        video,
        abilities
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  const addAbility = () => {
    if (newAbility.trim()) {
      setAbilities([...abilities, newAbility.trim()]);
      setNewAbility('');
    }
  };

  const removeAbility = (index: number) => {
    setAbilities(abilities.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-purple-500/30 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white">
          {initialData ? 'Edit Role' : 'Create New Role'}
        </h2>
        <button 
          onClick={onCancel}
          className="text-purple-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-semibold mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
              required
            />
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-semibold mb-2">Team</label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value as any)}
              className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400"
            >
              <option value="village">Village</option>
              <option value="mafia">Mafia</option>
              <option value="independent">Independent</option>
            </select>
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">Video URL (Optional)</label>
            <input
              type="text"
              value={video}
              onChange={(e) => setVideo(e.target.value)}
              className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 min-h-[100px]"
            required
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Abilities</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newAbility}
              onChange={(e) => setNewAbility(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAbility())}
              placeholder="Add an ability..."
              className="flex-1 bg-black/50 border border-purple-500/50 rounded-lg px-4 py-2 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
            />
            <Button type="button" onClick={addAbility} variant="secondary" size="sm">Add</Button>
          </div>
          
          {abilities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {abilities.map((ability, index) => (
                <div key={index} className="bg-purple-900/40 border border-purple-500/30 rounded-full px-3 py-1 flex items-center gap-2">
                  <span className="text-sm text-purple-200">{ability}</span>
                  <button 
                    type="button" 
                    onClick={() => removeAbility(index)}
                    className="text-purple-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button type="submit" disabled={submitting} variant="success" size="lg" className="w-full sm:w-auto">
            {submitting ? 'Saving...' : (initialData ? 'Update Role' : 'Create Role')}
          </Button>
          <Button type="button" onClick={onCancel} variant="secondary" size="lg" className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
