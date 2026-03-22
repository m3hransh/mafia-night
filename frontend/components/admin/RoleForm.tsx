import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/Button';
import { Role } from '@/lib/api';

interface RoleFormProps {
  initialData?: Role;
  onSubmit: (role: Omit<Role, 'id'>) => Promise<void>;
  onCancel: () => void;
}

type FormValues = {
  name: string;
  slug: string;
  description: string;
  team: 'mafia' | 'village' | 'independent';
  video: string;
  abilities: { value: string }[];
};

export function RoleForm({ initialData, onSubmit, onCancel }: RoleFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: initialData
      ? {
          name: initialData.name,
          slug: initialData.slug,
          description: initialData.description,
          team: initialData.team,
          video: initialData.video,
          abilities: initialData.abilities?.map(a => ({ value: a })) ?? [],
        }
      : {
          name: '',
          slug: '',
          description: '',
          team: 'village',
          video: 'https://res.cloudinary.com/m3hransh/video/upload/mafia-roles/Constantine.webm',
          abilities: [],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'abilities' });
  const [newAbility, setNewAbility] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Auto-generate slug from name when creating a new role
  const nameValue = watch('name');
  useEffect(() => {
    if (!initialData && nameValue) {
      setValue('slug', nameValue.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  }, [nameValue, initialData, setValue]);

  const onFormSubmit = handleSubmit(async (values) => {
    setSubmitError('');
    try {
      await onSubmit({
        name: values.name,
        slug: values.slug,
        description: values.description,
        team: values.team,
        video: values.video,
        abilities: values.abilities.map(a => a.value),
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save role');
    }
  });

  const addAbility = () => {
    if (newAbility.trim()) {
      append({ value: newAbility.trim() });
      setNewAbility('');
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-purple-500/30 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white">
          {initialData ? 'Edit Role' : 'Create New Role'}
        </h2>
        <button onClick={onCancel} className="text-purple-400 hover:text-white transition-colors">✕</button>
      </div>

      <form onSubmit={onFormSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-semibold mb-2">Name</label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">Slug</label>
            <input
              {...register('slug', { required: 'Slug is required' })}
              className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
            />
            {errors.slug && <p className="text-red-400 text-sm mt-1">{errors.slug.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-semibold mb-2">Team</label>
            <select
              {...register('team')}
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
              {...register('video')}
              className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Description</label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 min-h-[100px]"
          />
          {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>}
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
          {fields.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {fields.map((field, index) => (
                <div key={field.id} className="bg-purple-900/40 border border-purple-500/30 rounded-full px-3 py-1 flex items-center gap-2">
                  <span className="text-sm text-purple-200">{field.value}</span>
                  <button type="button" onClick={() => remove(index)} className="text-purple-400 hover:text-white">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {submitError && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">{submitError}</div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting} variant="success" size="lg" className="w-full sm:w-auto">
            {isSubmitting ? 'Saving...' : (initialData ? 'Update Role' : 'Create Role')}
          </Button>
          <Button type="button" onClick={onCancel} variant="secondary" size="lg" className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
