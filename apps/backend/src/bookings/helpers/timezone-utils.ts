import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { BUSINESS_HOURS, CLOSED_DAYS } from '../bookings.constants';

const DEFAULT_TIMEZONE = 'UTC';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function getBusinessWorkingHours(business: any, dayOfWeek: number): { start: string; end: string } {
  if (!business?.workingHours) {
    return { start: `${pad(BUSINESS_HOURS.START_HOUR)}:00`, end: `${pad(BUSINESS_HOURS.END_HOUR)}:00` };
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  const hours = business.workingHours?.[dayName];

  if (!hours) {
    return { start: `${pad(BUSINESS_HOURS.START_HOUR)}:00`, end: `${pad(BUSINESS_HOURS.END_HOUR)}:00` };
  }

  return {
    start: hours.start || `${pad(BUSINESS_HOURS.START_HOUR)}:00`,
    end: hours.end || `${pad(BUSINESS_HOURS.END_HOUR)}:00`,
  };
}

export function isBusinessClosed(business: any, dayOfWeek: number): boolean {
  if (!business?.closedDays) {
    return CLOSED_DAYS.includes(dayOfWeek);
  }
  return business.closedDays.includes(dayOfWeek);
}

export function getBusinessDayRange(date: Date, business: any): { dayStart: Date; dayEnd: Date } {
  const timezone = business?.timezone ?? DEFAULT_TIMEZONE;
  const localDate = toZonedTime(date, timezone);
  const dayOfWeek = localDate.getDay();

  if (isBusinessClosed(business, dayOfWeek)) {
    return { dayStart: new Date(0), dayEnd: new Date(0) };
  }

  const hours = getBusinessWorkingHours(business, dayOfWeek);
  const [startHour, startMinute] = hours.start.split(':').map(Number);
  const [endHour, endMinute] = hours.end.split(':').map(Number);

  const year = localDate.getFullYear();
  const month = localDate.getMonth() + 1;
  const day = localDate.getDate();

  const localStartString = `${year}-${pad(month)}-${pad(day)}T${pad(startHour)}:${pad(startMinute)}:00`;
  const localEndString = `${year}-${pad(month)}-${pad(day)}T${pad(endHour)}:${pad(endMinute)}:00`;

  return {
    dayStart: fromZonedTime(localStartString, timezone),
    dayEnd: fromZonedTime(localEndString, timezone),
  };
}
