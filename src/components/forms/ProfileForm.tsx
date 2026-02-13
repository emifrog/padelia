'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { profileSchema, type ProfileFormValues } from '@/lib/validations/profile'
import { HAND_OPTIONS, SIDE_OPTIONS, STYLE_OPTIONS, GOAL_OPTIONS, LEVEL_OPTIONS } from '@/lib/constants/profile'

interface ProfileFormProps {
  defaultValues?: Partial<ProfileFormValues>
  onSubmit: (data: ProfileFormValues) => Promise<void>
  submitLabel?: string
}

export function ProfileForm({ defaultValues, onSubmit, submitLabel = 'Enregistrer' }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      full_name: '',
      city: '',
      level: 3,
      dominant_hand: 'right',
      preferred_side: 'right',
      play_style: 'mixed',
      goal: 'casual',
      bio: '',
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        id="username"
        label="Pseudo"
        placeholder="tonpseudo"
        error={errors.username?.message}
        {...register('username')}
      />
      <Input
        id="full_name"
        label="Nom complet"
        placeholder="Jean Dupont"
        error={errors.full_name?.message}
        {...register('full_name')}
      />
      <Input
        id="city"
        label="Ville"
        placeholder="Paris, Nice, Lyon..."
        error={errors.city?.message}
        {...register('city')}
      />

      <Select
        id="level"
        label="Niveau (1 à 10)"
        options={LEVEL_OPTIONS}
        error={errors.level?.message}
        {...register('level', { valueAsNumber: true })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          id="dominant_hand"
          label="Main dominante"
          options={HAND_OPTIONS}
          error={errors.dominant_hand?.message}
          {...register('dominant_hand')}
        />
        <Select
          id="preferred_side"
          label="Côté préféré"
          options={SIDE_OPTIONS}
          error={errors.preferred_side?.message}
          {...register('preferred_side')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          id="play_style"
          label="Style de jeu"
          options={STYLE_OPTIONS}
          error={errors.play_style?.message}
          {...register('play_style')}
        />
        <Select
          id="goal"
          label="Objectif"
          options={GOAL_OPTIONS}
          error={errors.goal?.message}
          {...register('goal')}
        />
      </div>

      <Textarea
        id="bio"
        label="Bio (optionnel)"
        placeholder="Parle un peu de toi et de ton jeu..."
        rows={3}
        error={errors.bio?.message}
        {...register('bio')}
      />

      <Button type="submit" className="w-full" loading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  )
}
