import { z } from 'zod';

const TIME_SLOT_REGEX = /^\d{2}:\d{2}-\d{2}:\d{2}$/;

const timeSlotSchema = z
  .string()
  .regex(TIME_SLOT_REGEX, 'Format attendu: HH:MM-HH:MM');

export const availabilitySchema = z.object({
  lundi: z.array(timeSlotSchema).default([]),
  mardi: z.array(timeSlotSchema).default([]),
  mercredi: z.array(timeSlotSchema).default([]),
  jeudi: z.array(timeSlotSchema).default([]),
  vendredi: z.array(timeSlotSchema).default([]),
  samedi: z.array(timeSlotSchema).default([]),
  dimanche: z.array(timeSlotSchema).default([]),
});

export type AvailabilityData = z.infer<typeof availabilitySchema>;

export const DAYS = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
] as const;

export const TIME_SLOTS = [
  '06:00-08:00',
  '08:00-10:00',
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00',
  '20:00-22:00',
] as const;
