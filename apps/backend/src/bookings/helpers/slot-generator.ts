import { toZonedTime } from 'date-fns-tz';
import { BUSINESS_HOURS, CLOSED_DAYS } from '../bookings.constants';
import { getBusinessDayRange, getBusinessWorkingHours, isBusinessClosed } from './timezone-utils';

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean; // will be set by service layer
}

/**
 * Generate all candidate time slots for a service on a given day.
 * This function returns per-interval slots within business hours.
 */
export function generateServiceSlots(
  date: Date,
  serviceDuration: number,
  bufferMinutes: number,
  business?: any,
): TimeSlot[] {
  const timezone = business?.timezone ?? 'UTC';
  const period = business ? getBusinessDayRange(date, business) : undefined;

  if (!business) {
    const dayOfWeek = date.getDay();
    if (CLOSED_DAYS.includes(dayOfWeek)) return [];

    const dayStart = new Date(date);
    dayStart.setHours(BUSINESS_HOURS.START_HOUR, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(BUSINESS_HOURS.END_HOUR, 0, 0, 0);

    return buildSlots(dayStart, dayEnd, serviceDuration);
  }

  if (!period || period.dayStart.getTime() === 0 || period.dayEnd.getTime() === 0) {
    return [];
  }

  const localStart = toZonedTime(period.dayStart, timezone);
  const dayOfWeek = localStart.getDay();
  if (isBusinessClosed(business, dayOfWeek)) return [];

  const workingHours = getBusinessWorkingHours(business, dayOfWeek);
  if (!workingHours) return [];

  return buildSlots(period.dayStart, period.dayEnd, serviceDuration);
}

function buildSlots(dayStart: Date, dayEnd: Date, serviceDuration: number): TimeSlot[] {
  const serviceDurationMs = serviceDuration * 60000;
  const intervalMs = BUSINESS_HOURS.INTERVAL_MINUTES * 60000;

  if (serviceDurationMs <= 0) return [];

  const slots: TimeSlot[] = [];
  let current = new Date(dayStart);

  while (current.getTime() + serviceDurationMs <= dayEnd.getTime()) {
    slots.push({
      start: new Date(current),
      end: new Date(current.getTime() + serviceDurationMs),
      available: true,
    });
    current = new Date(current.getTime() + intervalMs);
  }

  return slots;
}
