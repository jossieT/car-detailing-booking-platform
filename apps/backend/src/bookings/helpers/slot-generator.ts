import { BUSINESS_HOURS, CLOSED_DAYS } from '../bookings.constants';
import { getBusinessWorkingHours, isBusinessClosed } from './timezone-utils';

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
  business?: any,            // Business object with workingHours and closedDays
): TimeSlot[] {
  const dayOfWeek = date.getDay();

  // Check if business is closed
  if (business && isBusinessClosed(business, dayOfWeek)) return [];
  if (!business && CLOSED_DAYS.includes(dayOfWeek)) return [];

  // Get working hours
  let startHour: number, endHour: number;

  if (business) {
    const hours = getBusinessWorkingHours(business, dayOfWeek);
    if (!hours) return [];

    [startHour, endHour] = hours.start.split(':').map(Number);
  } else {
    // Fallback to constants
    startHour = BUSINESS_HOURS.START_HOUR;
    endHour = BUSINESS_HOURS.END_HOUR;
  }

  // Working hours boundaries
  const dayStart = new Date(date);
  dayStart.setHours(startHour, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, 0, 0, 0);

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