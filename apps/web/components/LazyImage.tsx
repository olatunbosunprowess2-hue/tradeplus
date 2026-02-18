'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { sanitizeUrl } from '@/lib/utils';

interface LazyImageProps extends Omit<ImageProps, 'onLoad'> {
    fallback?: string;
    blurDataURL?: string;
    threshold?: number;
}

/**
 * LazyImage component that loads images only when they enter the viewport.
 * Includes smooth fade-in animation and error fallback handling.
 */
export default function LazyImage({
    src,
    alt,
    fallback = '/placeholder-image.png',
    threshold = 0.1,
    className = '',
    ...props
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [error, setError] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold, rootMargin: '50px' }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [threshold]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setError(true);
        setIsLoaded(true);
    };

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${className}`}
            style={{ minHeight: props.height || 200 }}
        >
            {/* Skeleton placeholder */}
            <div
                className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse transition-opacity duration-300 ${isLoaded ? 'opacity-0' : 'opacity-100'
                    }`}
            />

            {/* Actual image - only render when in view */}
            {isInView && (
                <Image
                    src={error ? fallback : sanitizeUrl(src as string)}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    loading="lazy"
                    {...props}
                />
            )}
        </div>
    );
}

/**
 * Simple lazy image with native lazy loading.
 * Use this for simpler cases where you just need native lazy loading.
 */
export function SimpleLazyImage({
    src,
    alt,
    className = '',
    width,
    height,
    ...props
}: ImageProps) {
    return (
        <Image
            src={sanitizeUrl(src as string)}
            alt={alt}
            width={width}
            height={height}
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k="
            className={className}
            {...props}
        />
    );
}
