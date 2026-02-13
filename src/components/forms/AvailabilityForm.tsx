'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Select } from '@/components/ui'
import { availabilitySchema, type AvailabilityFormValues } from '@/lib/validations/availability'

const DAY_OPTIONS = [
  { value: '0', label: 'Lundi' },
  { value: '1', label: 'Mardi' },
  { value: '2', label: 'Mercredi' },
  { value: '3', label: 'Jeudi' },
  { value: '4', label: 'Vendredi' },
  { value: '5', label: 'Samedi' },
  { value: '6', label: 'Dimanche' },
]

interface AvailabilityFormProps {
  onSubmit: (data: AvailabilityFormValues) => Promise<void>
  onCancel: () => void
  defaultValues?: Partial<AvailabilityFormValues>
}

export function AvailabilityForm({ onSubmit, onCancel, defaultValues }: AvailabilityFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      day_of_week: 0,
      start_time: '18:00',
      end_time: '20:00',
      is_recurring: true,
      specific_date: '',
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        id="day_of_week"
        label="Jour"
        options={DAY_OPTIONS}
        error={errors.day_of_week?.message}
        {...register('day_of_week', { valueAsNumber: true })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="start_time"
          label="De"
          type="time"
          error={errors.start_time?.message}
          {...register('start_time')}
        />
        <Input
          id="end_time"
          label="À"
          type="time"
          error={errors.end_time?.message}
          {...register('end_time')}
        />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" className="flex-1" loading={isSubmitting}>
          Ajouter
        </Button>
      </div>
    </form>
  )
}
