/**
 * Timezone conversion utilities for business-specific time handling
 */

export function convertToTimezone(date: Date, timezone: string): Date {
  // Convert date to the specified timezone
  // Note: This is a basic implementation. For production, consider using a library like 'date-fns-tz'
  const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
  const targetDate = new Date(utcDate.toLocaleString("en-US", {timeZone: timezone}));
  return targetDate;
}

export function convertFromTimezone(date: Date, timezone: string): Date {
  // Convert date from the specified timezone to UTC
  // This is the inverse operation
  const localDate = new Date(date.toLocaleString("en-US", {timeZone: timezone}));
  const utcDate = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000));
  return utcDate;
}

export function getBusinessWorkingHours(business: any, dayOfWeek: number): { start: string, end: string } | null {
  if (!business.workingHours) {
    return { start: '09:00', end: '18:00' }; // Default hours
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];

  const hours = business.workingHours[dayName];
  if (!hours) {
    return { start: '09:00', end: '18:00' }; // Default if no hours specified
  }

  return {
    start: hours.start || '09:00',
    end: hours.end || '18:00'
  };
}

export function isBusinessClosed(business: any, dayOfWeek: number): boolean {
  if (!business.closedDays) return false;
  return business.closedDays.includes(dayOfWeek);
}