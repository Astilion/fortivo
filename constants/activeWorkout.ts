// An active workout older than this is treated as an abandoned session
// (user forgot to finish) and is cleared on mount / boot rather than resumed.
export const ACTIVE_WORKOUT_TIMEOUT_MS = 12 * 60 * 60 * 1000;
