/**
 * Form Validation Utilities for BarterWave
 * Provides real-time validation with user-friendly error messages
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// International phone number regex (supports multiple African countries)
// Supports: Nigeria (+234), Ghana (+233), Kenya (+254), South Africa (+27), Egypt (+20), etc.
const PHONE_REGEX = /^(\+|00)?[1-9]\d{7,14}$/;

// Password requirements
const PASSWORD_MIN_LENGTH = 8;

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult {
    if (!email.trim()) {
        return { isValid: false, error: 'Email is required' };
    }
    if (!EMAIL_REGEX.test(email)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): ValidationResult {
    if (!password) {
        return { isValid: false, error: 'Password is required' };
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
        return { isValid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one number' };
    }
    return { isValid: true };
}

/**
 * Calculates password strength score (0-4)
 */
export function getPasswordStrength(password: string): {
    score: number;
    label: string;
    color: string;
} {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
        { label: 'Very Weak', color: 'bg-red-500' },
        { label: 'Weak', color: 'bg-orange-500' },
        { label: 'Fair', color: 'bg-yellow-500' },
        { label: 'Good', color: 'bg-lime-500' },
        { label: 'Strong', color: 'bg-green-500' },
    ];

    return {
        score: Math.min(score, 4),
        ...levels[Math.min(score, 4)],
    };
}

/**
 * Validates phone number (international format)
 */
export function validatePhone(phone: string): ValidationResult {
    if (!phone.trim()) {
        return { isValid: false, error: 'Phone number is required' };
    }
    const cleanPhone = phone.replace(/\s|-/g, '');
    if (!PHONE_REGEX.test(cleanPhone)) {
        return { isValid: false, error: 'Please enter a valid phone number with country code' };
    }
    return { isValid: true };
}

/**
 * Validates name (non-empty, min length)
 */
export function validateName(name: string, fieldName = 'Name'): ValidationResult {
    if (!name.trim()) {
        return { isValid: false, error: `${fieldName} is required` };
    }
    if (name.trim().length < 2) {
        return { isValid: false, error: `${fieldName} must be at least 2 characters` };
    }
    return { isValid: true };
}

/**
 * Validates price (positive number)
 */
export function validatePrice(price: string | number): ValidationResult {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) {
        return { isValid: false, error: 'Please enter a valid price' };
    }
    if (numPrice <= 0) {
        return { isValid: false, error: 'Price must be greater than 0' };
    }
    if (numPrice > 999999999) {
        return { isValid: false, error: 'Price is too high' };
    }
    return { isValid: true };
}

/**
 * Validates required field
 */
export function validateRequired(value: string, fieldName = 'This field'): ValidationResult {
    if (!value.trim()) {
        return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
}

/**
 * Validates password confirmation
 */
export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
    if (!confirmPassword) {
        return { isValid: false, error: 'Please confirm your password' };
    }
    if (password !== confirmPassword) {
        return { isValid: false, error: 'Passwords do not match' };
    }
    return { isValid: true };
}

/**
 * Validates listing description
 */
export function validateDescription(description: string, minLength = 20): ValidationResult {
    if (!description.trim()) {
        return { isValid: false, error: 'Description is required' };
    }
    if (description.trim().length < minLength) {
        return { isValid: false, error: `Description must be at least ${minLength} characters` };
    }
    return { isValid: true };
}
