/**
 * Standardized result type for all monetization activation methods.
 * Ensures consistent API responses and frontend handling.
 */
export interface ActivationResult {
    success: boolean;
    message: string; // The "premium" text for the UI
    data?: any;      // Optional extra data (e.g., new expiry date)
}
