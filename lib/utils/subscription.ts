/**
 * Utility functions for checking subscription status and user tiers
 */

export interface UserSubscription {
  status: string;
  subscription_plans?: {
    tier: string;
  } | null;
}

/**
 * Check if a user is on the free tier (no active paid subscription)
 */
export function isUserOnFreeTier(subscriptions?: UserSubscription[] | null): boolean {
  if (!subscriptions || subscriptions.length === 0) {
    return true; // No subscriptions = free user
  }

  const hasActivePaidSubscription = subscriptions.some(sub =>
    sub.status === 'active' &&
    sub.subscription_plans?.tier &&
    sub.subscription_plans.tier !== 'free'
  );

  return !hasActivePaidSubscription;
}

/**
 * Get the user's current subscription tier
 */
export function getUserTier(subscriptions?: UserSubscription[] | null): string {
  if (!subscriptions || subscriptions.length === 0) {
    return 'free';
  }

  const activePaidSubscription = subscriptions.find(sub =>
    sub.status === 'active' &&
    sub.subscription_plans?.tier &&
    sub.subscription_plans.tier !== 'free'
  );

  return activePaidSubscription?.subscription_plans?.tier || 'free';
}

/**
 * Format time remaining until auto-deletion for display
 */
export function formatTimeRemaining(createdAt: string): {
  hours: number;
  minutes: number;
  isExpiringSoon: boolean;
  timeString: string;
} {
  const created = new Date(createdAt);
  const now = new Date();
  const twoHoursFromCreation = new Date(created.getTime() + 2 * 60 * 60 * 1000);
  const timeRemaining = twoHoursFromCreation.getTime() - now.getTime();

  if (timeRemaining <= 0) {
    return {
      hours: 0,
      minutes: 0,
      isExpiringSoon: true,
      timeString: "Expired"
    };
  }

  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const isExpiringSoon = timeRemaining <= 30 * 60 * 1000; // 30 minutes

  let timeString = "";
  if (hours > 0) {
    timeString = `${hours}h ${minutes}m`;
  } else {
    timeString = `${minutes}m`;
  }

  return {
    hours,
    minutes,
    isExpiringSoon,
    timeString
  };
}