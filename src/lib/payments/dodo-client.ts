/**
 * Dodo Payments API Client
 *
 * This client handles all interactions with the Dodo Payments API.
 */

import DodoPayments from 'dodopayments';

export const dodoClient = new DodoPayments({
bearerToken: process.env.DODO_PAYMENTS_API_KEY,
});