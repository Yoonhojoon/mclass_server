import { z } from 'zod';

export const MClassResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(120),
  description: z.string().nullable().optional(),
  recruitStartAt: z.date().nullable().optional(),
  recruitEndAt: z.date().nullable().optional(),
  startAt: z.date(),
  endAt: z.date(),
  selectionType: z.enum(['FIRST_COME', 'REVIEW']),
  capacity: z.number().int().positive().nullable().optional(),
  approvedCount: z.number().int().min(0),
  allowWaitlist: z.boolean(),
  waitlistCapacity: z.number().int().positive().nullable().optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED']),
  isOnline: z.boolean(),
  location: z.string().nullable().optional(),
  fee: z.number().int().min(0).nullable().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  phase: z.enum(['UPCOMING', 'RECRUITING', 'IN_PROGRESS', 'ENDED']),
});

export type MClassResponse = z.infer<typeof MClassResponseSchema>;
