import { z } from 'zod';

export const clubReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional().or(z.literal('')),
});

export type ClubReviewData = z.infer<typeof clubReviewSchema>;

export const createBookingSchema = z.object({
  court_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  duration_minutes: z.number().min(60).max(180),
});

export type CreateBookingData = z.infer<typeof createBookingSchema>;
