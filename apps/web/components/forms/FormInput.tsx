'use client';

import { useState, useCallback } from 'react';
import { getPasswordStrength } from '@/lib/validation';

interface FormInputProps {
    id: string;
    name: string;
    label: string;
    type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'textarea';
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    showPasswordStrength?: boolean;
    autoComplete?: string;
    className?: string;
    helpText?: string;
    maxLength?: number;
    min?: number;
    max?: number;
}

/**
 * FormInput - Accessible form input with real-time validation feedback
 */
export function FormInput({
    id,
    name,
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    required = false,
    disabled = false,
    showPasswordStrength = false,
    autoComplete,
    className = '',
    helpText,
    maxLength,
    min,
    max,
}: FormInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const passwordStrength = showPasswordStrength && type === 'password'
        ? getPasswordStrength(value)
        : null;

    const inputType = type === 'password' && showPassword ? 'text' : type;

    const hasError = !!error;
    const describedBy = [
        error ? `${id}-error` : null,
        helpText ? `${id}-help` : null,
    ].filter(Boolean).join(' ');

    const baseInputClasses = `
        w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
        text-gray-900 dark:text-gray-100 placeholder:text-gray-400
        bg-white dark:bg-gray-800
        focus:outline-none focus:ring-0
    `;

    const stateClasses = hasError
        ? 'border-red-400 dark:border-red-500 focus:border-red-500'
        : isFocused
            ? 'border-blue-500 dark:border-blue-400'
            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500';

    const InputElement = type === 'textarea' ? 'textarea' : 'input';

    return (
        <div className={`space-y-1 ${className}`}>
            {/* Label */}
            <label
                htmlFor={id}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
                {label}
                {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
            </label>

            {/* Input container */}
            <div className="relative">
                <InputElement
                    id={id}
                    name={name}
                    type={inputType}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                        onChange(e.target.value)
                    }
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    disabled={disabled}
                    required={required}
                    autoComplete={autoComplete}
                    aria-invalid={hasError}
                    aria-describedby={describedBy || undefined}
                    maxLength={maxLength}
                    min={min}
                    max={max}
                    className={`${baseInputClasses} ${stateClasses} ${type === 'password' ? 'pr-12' : ''
                        } ${type === 'textarea' ? 'min-h-[120px] resize-y' : ''}`}
                    rows={type === 'textarea' ? 4 : undefined}
                />

                {/* Password toggle */}
                {type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                )}

                {/* Error icon */}
                {hasError && type !== 'password' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Password strength indicator */}
            {passwordStrength && value.length > 0 && (
                <div className="space-y-1">
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-colors ${i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Password strength: <span className="font-medium">{passwordStrength.label}</span>
                    </p>
                </div>
            )}

            {/* Error message */}
            {error && (
                <p
                    id={`${id}-error`}
                    className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1"
                    role="alert"
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}

            {/* Help text */}
            {helpText && !error && (
                <p id={`${id}-help`} className="text-xs text-gray-500 dark:text-gray-400">
                    {helpText}
                </p>
            )}
        </div>
    );
}

/**
 * useFormValidation hook for real-time form validation
 */
export function useFormValidation<T extends Record<string, string>>(
    initialValues: T,
    validators: Partial<Record<keyof T, (value: string) => { isValid: boolean; error?: string }>>
) {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

    const setValue = useCallback((field: keyof T, value: string) => {
        setValues(prev => ({ ...prev, [field]: value }));

        // Validate on change if field has been touched
        if (touched[field] && validators[field]) {
            const result = validators[field]!(value);
            setErrors(prev => ({
                ...prev,
                [field]: result.error,
            }));
        }
    }, [touched, validators]);

    const setFieldTouched = useCallback((field: keyof T) => {
        setTouched(prev => ({ ...prev, [field]: true }));

        // Validate immediately when touched
        if (validators[field]) {
            const result = validators[field]!(values[field]);
            setErrors(prev => ({
                ...prev,
                [field]: result.error,
            }));
        }
    }, [values, validators]);

    const validateAll = useCallback((): boolean => {
        const newErrors: Partial<Record<keyof T, string>> = {};
        let isValid = true;

        Object.keys(validators).forEach((field) => {
            const validator = validators[field as keyof T];
            if (validator) {
                const result = validator(values[field as keyof T]);
                if (!result.isValid) {
                    newErrors[field as keyof T] = result.error;
                    isValid = false;
                }
            }
        });

        setErrors(newErrors);
        setTouched(Object.keys(validators).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
        return isValid;
    }, [values, validators]);

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    }, [initialValues]);

    return {
        values,
        errors,
        touched,
        setValue,
        setFieldTouched,
        validateAll,
        reset,
        isValid: Object.values(errors).every(e => !e),
    };
}
