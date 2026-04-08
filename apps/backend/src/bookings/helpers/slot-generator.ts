import { BUSINESS_HOURS, CLOSED_DAYS } from '../bookings.constants';

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;   // will be set by service layer
}

/**
 * Generate all possible start times for a service on a given day,
 * based on service duration and buffer. Does NOT check capacity or staff.
 */
export function generateServiceSlots(
  date: Date,
  serviceDuration: number,   // minutes
  bufferMinutes: number,     // minutes after each booking
): TimeSlot[] {
  const dayOfWeek = date.getDay();
  if (CLOSED_DAYS.includes(dayOfWeek)) return [];

  // Working hours boundaries
  const dayStart = new Date(date);
  dayStart.setHours(BUSINESS_HOURS.START_HOUR, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(BUSINESS_HOURS.END_HOUR, 0, 0, 0);

  const stepMinutes = serviceDuration + bufferMinutes;
  if (stepMinutes <= 0) return [];

  const slots: TimeSlot[] = [];
  let currentStart = new Date(dayStart);

  while (true) {
    const slotEnd = new Date(currentStart.getTime() + serviceDuration * 60000);
    if (slotEnd > dayEnd) break;

    slots.push({
      start: new Date(currentStart),
      end: slotEnd,
      available: true,   // will be refined later with capacity and staff checks
    });

    currentStart = new Date(currentStart.getTime() + stepMinutes * 60000);
  }

  return slots;
}