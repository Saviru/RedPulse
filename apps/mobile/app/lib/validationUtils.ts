/**
 * Duplicate Request Prevention Utility
 * 
 * Tracks the last submission (bloodType + location) and its timestamp per session.
 * 10-minute window.
 */

interface LastSubmission {
  timestamp: number;
  bloodGroup: string;
  location: string;
}

const RECENT_SUBMISSIONS: Record<string, LastSubmission> = {};

/**
 * Checks if the current request is a duplicate (same blood group + same location)
 * within a 10-minute window (600,000 ms).
 * 
 * @param identifier Unique identifier for the user (username or email)
 * @param bloodGroup Requested blood type
 * @param location Trimmed location string
 * @returns boolean
 */
export function isDuplicateRequest(identifier: string, bloodGroup: string, location: string): boolean {
  if (!identifier) return false;
  
  const last = RECENT_SUBMISSIONS[identifier];
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;

  if (
    last &&
    last.bloodGroup === bloodGroup &&
    last.location.toLowerCase().trim() === location.toLowerCase().trim() &&
    now - last.timestamp < TEN_MINUTES
  ) {
    return true;
  }

  return false;
}

/**
 * Records a successful submission to prevent duplicates for the next 10 minutes.
 */
export function recordSubmission(identifier: string, bloodGroup: string, location: string) {
  if (!identifier) return;
  
  RECENT_SUBMISSIONS[identifier] = {
    timestamp: Date.now(),
    bloodGroup,
    location: location.toLowerCase().trim(),
  };
}

/**
 * Common string helpers for blood requests.
 */
export function cleanInput(val: string): string {
  return (val || "").trim();
}

export default function Ignore() { return null; }
