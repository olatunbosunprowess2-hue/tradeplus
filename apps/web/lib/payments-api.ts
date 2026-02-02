import apiClient from './api-client';

export interface InitializePaymentResponse {
    authorizationUrl: string;
    reference: string;
}

export type PurchaseType =
    | 'chat_pass'
    | 'cross_list'
    | 'aggressive_boost'
    | 'spotlight_3'
    | 'spotlight_7'
    | 'premium';

/**
 * Initialize a payment transaction
 */
export async function initializePayment(
    type: PurchaseType,
    listingId?: string,
    currency: 'NGN' | 'USD' = 'NGN',
): Promise<InitializePaymentResponse> {
    const response = await apiClient.post<InitializePaymentResponse>('/payments/initialize', {
        type,
        listingId,
        currency,
    });
    return response.data;
}

/**
 * Verify a payment transaction
 */
export async function verifyPayment(reference: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string }>('/payments/verify', {
        reference,
    });
    return response.data;
}

/**
 * Get current monetization status
 */
export async function getMonetizationStatus() {
    const response = await apiClient.get('/monetization/status');
    return response.data;
}

/**
 * Check chat limit
 */
export async function checkChatLimit() {
    const response = await apiClient.get('/monetization/chat-limit');
    return response.data;
}

/**
 * Check listing limit
 */
export async function checkListingLimit() {
    const response = await apiClient.get('/monetization/listing-limit');
    return response.data;
}

/**
 * Get pricing information (public)
 */
export async function getPricing() {
    const response = await apiClient.get('/monetization/pricing');
    return response.data;
}

/**
 * Use a free premium spotlight credit
 */
export async function useSpotlightCredit(listingId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/monetization/use-spotlight-credit/${listingId}`);
    return response.data;
}

/**
 * Helper to redirect to Paystack checkout
 */
export function redirectToPaystack(authorizationUrl: string): void {
    window.location.href = authorizationUrl;
}
