export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'expo-notifications') {
    return {
      url:
        'data:text/javascript,' +
        encodeURIComponent(`
          export const SchedulableTriggerInputTypes = {
            CALENDAR: 'calendar',
            DAILY: 'daily',
            WEEKLY: 'weekly',
            MONTHLY: 'monthly',
            YEARLY: 'yearly',
            DATE: 'date',
            TIME_INTERVAL: 'timeInterval',
          };
          export const AndroidImportance = {
            UNKNOWN: 0,
            UNSPECIFIED: 1,
            NONE: 2,
            MIN: 3,
            LOW: 4,
            DEFAULT: 5,
            HIGH: 6,
            MAX: 7,
          };
          export async function setNotificationChannelAsync() {}
          export function setNotificationHandler() {}
          export async function scheduleNotificationAsync() { return 'mock-id'; }
          export async function cancelScheduledNotificationAsync() {}
          export async function cancelAllScheduledNotificationsAsync() {}
          export async function getAllScheduledNotificationsAsync() { return []; }
          export async function getPermissionsAsync() { return { granted: true }; }
          export async function requestPermissionsAsync() { return { granted: true }; }
          export function addNotificationResponseReceivedListener() { return { remove() {} }; }
          export function getLastNotificationResponse() { return null; }
          export async function clearLastNotificationResponseAsync() {}
        `),
      shortCircuit: true,
      format: 'module',
    };
  }

  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        try {
          return await nextResolve(specifier + ext, context);
        } catch {
          // Continua tentando próximas extensões
        }
      }
    }
    throw err;
  }
}
