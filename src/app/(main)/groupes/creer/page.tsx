'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { createGroupSchema, type CreateGroupData, GROUP_VISIBILITY_LABELS, GROUP_VISIBILITY_DESCRIPTIONS } from '@/lib/validations/group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Globe, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const VISIBILITY_OPTIONS = [
  { value: 'public' as const, icon: Globe },
  { value: 'private' as const, icon: Lock },
  { value: 'invite_only' as const, icon: Mail },
];

export default function CreateGroupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CreateGroupData>({ resolver: zodResolver(createGroupSchema) as any, defaultValues: {
    visibility: 'public',
    max_members: 50,
  }});

  const visibility = watch('visibility');

  async function onSubmit(data: CreateGroupData) {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Non connecté'); return; }

      // Generate slug from name
      const slug = data.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36);

      const { data: group, error } = await supabase
        .from('groups')
        .insert({
          name: data.name,
          slug,
          description: data.description || null,
          visibility: data.visibility,
          city: data.city,
          max_members: data.max_members,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Add creator as admin
      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin',
      });

      toast.success('Groupe créé !');
      router.push(`/groupes/${group.id}`);
    } catch {
      toast.error('Erreur de création');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/groupes"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-xl font-bold">Nouveau groupe</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Nom du groupe *</Label>
          <Input
            id="name"
            placeholder="Ex: Padel Bordeaux Centre"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            placeholder="Décris ton groupe en quelques mots..."
            className="min-h-[80px] w-full resize-none rounded-xl border bg-muted px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <Label>Visibilité</Label>
          <div className="grid grid-cols-3 gap-2">
            {VISIBILITY_OPTIONS.map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue('visibility', value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all',
                  visibility === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-accent',
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">
                  {GROUP_VISIBILITY_LABELS[value]}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {GROUP_VISIBILITY_DESCRIPTIONS[visibility]}
          </p>
        </div>

        {/* City */}
        <div className="space-y-1.5">
          <Label htmlFor="city">Ville *</Label>
          <Input
            id="city"
            placeholder="Ex: Bordeaux"
            {...register('city')}
          />
          {errors.city && (
            <p className="text-xs text-red-500">{errors.city.message}</p>
          )}
        </div>

        {/* Max members */}
        <div className="space-y-1.5">
          <Label htmlFor="max_members">Nombre max de membres</Label>
          <Input
            id="max_members"
            type="number"
            min={2}
            max={500}
            {...register('max_members', { valueAsNumber: true })}
          />
          {errors.max_members && (
            <p className="text-xs text-red-500">{errors.max_members.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création...
            </>
          ) : (
            'Créer le groupe'
          )}
        </Button>
      </form>
    </div>
  );
}
