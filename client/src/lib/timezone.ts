export function formatInTimezone(date: Date, timezone: string = 'UTC'): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch (error) {
    // Fallback to UTC if timezone is invalid
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date) + ' UTC';
  }
}

export function formatRelativeTime(date: Date, locale: string = 'en'): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    return locale === 'ar' ? 'منذ أقل من ساعة' : 'Less than an hour ago';
  } else if (diffInHours < 24) {
    return locale === 'ar' 
      ? `منذ ${diffInHours} ${diffInHours === 1 ? 'ساعة' : 'ساعات'}`
      : `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else if (diffInDays < 7) {
    return locale === 'ar'
      ? `منذ ${diffInDays} ${diffInDays === 1 ? 'يوم' : 'أيام'}`
      : `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  } else {
    return formatInTimezone(date);
  }
}

export function getTimeUntilDeadline(deadline: Date): {
  isOverdue: boolean;
  isUrgent: boolean;
  timeLeft: string;
} {
  const now = new Date();
  const diffInMs = deadline.getTime() - now.getTime();
  
  if (diffInMs <= 0) {
    return {
      isOverdue: true,
      isUrgent: false,
      timeLeft: 'Deadline passed',
    };
  }

  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  const remainingHours = diffInHours % 24;

  const isUrgent = diffInHours <= 48;

  let timeLeft: string;
  if (diffInDays === 0) {
    timeLeft = `${diffInHours} hour${diffInHours === 1 ? '' : 's'} left`;
  } else if (diffInDays < 7) {
    timeLeft = remainingHours > 0 
      ? `${diffInDays} day${diffInDays === 1 ? '' : 's'}, ${remainingHours} hour${remainingHours === 1 ? '' : 's'} left`
      : `${diffInDays} day${diffInDays === 1 ? '' : 's'} left`;
  } else {
    const weeks = Math.floor(diffInDays / 7);
    const remainingDays = diffInDays % 7;
    timeLeft = remainingDays > 0
      ? `${weeks} week${weeks === 1 ? '' : 's'}, ${remainingDays} day${remainingDays === 1 ? '' : 's'} left`
      : `${weeks} week${weeks === 1 ? '' : 's'} left`;
  }

  return {
    isOverdue: false,
    isUrgent,
    timeLeft,
  };
}

export function getCurrentTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return 'UTC';
  }
}

export const commonTimezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Riyadh', label: 'Riyadh (AST)' },
  { value: 'Asia/Cairo', label: 'Cairo (EET/EEST)' },
  { value: 'Asia/Amman', label: 'Amman (EET/EEST)' },
  { value: 'Asia/Baghdad', label: 'Baghdad (AST)' },
  { value: 'Asia/Kuwait', label: 'Kuwait (AST)' },
  { value: 'Asia/Qatar', label: 'Qatar (AST)' },
];
