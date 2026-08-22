export const DEFAULT_USER_URL = "http://localhost:3000";
export const DEFAULT_MUNICIPALITY_URL = "http://localhost:3001";

/** Public origin for the personal/user-facing StayBridge deployment. */
export const USER_URL = process.env.BASE_URL || DEFAULT_USER_URL;

/** Public root for the municipality/preparedness StayBridge deployment. */
export const MUNICIPALITY_URL =
  process.env.MUNICIPALITY_URL || DEFAULT_MUNICIPALITY_URL;

/** The exact application revision tested by a deployment-triggered run. */
export const TARGET_COMMIT = process.env.TARGET_COMMIT || null;

export const TARGET_URLS = {
  user: USER_URL,
  municipality: MUNICIPALITY_URL,
} as const;
