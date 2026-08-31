export const PRIVACY_POLICY_URL = 'https://astilion.github.io/fortivo-privacy/';

// Must equal the date in the header of the document actually served at
// PRIVACY_POLICY_URL. Swapping the policy without swapping this constant voids
// the point of the consent metadata: we would be recording that the user agreed
// to a document they never saw.
export const PRIVACY_POLICY_VERSION = '2026-08-31';
