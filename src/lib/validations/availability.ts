import { z } from 'zod/v4'

export const availabilitySchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  is_recurring: z.boolean(),
  specific_date: z.string().optional().or(z.literal('')),
}).refine(
  (data) => data.start_time < data.end_time,
  { message: "L'heure de fin doit être après l'heure de début", path: ['end_time'] },
)

export type AvailabilityFormValues = z.infer<typeof availabilitySchema>
