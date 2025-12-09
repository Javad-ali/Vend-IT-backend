import { z } from 'zod';
export const dispenseCommandSchema = z.object({
  machineId: z.string().min(1, 'machineId is required'),
  slotNumber: z.string().min(1, 'slotNumber is required')
});
