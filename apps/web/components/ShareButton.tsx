'use client';

import { useState } from 'react';
import { useToastStore } from '@/lib/toast-store';

interface ShareButtonProps {
    url: string;
    title: string;
    description?: string;
    imageUrl?: string;
    price?: string;
    allowCash?: boolean;
    allowBarter?: boolean;
    className?: string;
    iconOnly?: boolean;
    onShare?: (platform: string) => void;
}

const createShareMessage = (
    title: string,
    price?: string,
    allowCash?: boolean,
    allowBarter?: boolean
): string => {
    let tradeOptions = '';

    if (allowCash && allowBarter) {
        tradeOptions = 'Cash or Barter accepted';
    } else if (allowBarter) {
        tradeOptions = 'Open to Barter';
    } else if (allowCash && price) {
        tradeOptions = `Only ${price}`;
    }

    const emoji = price && price !== 'Free' ? '🔥' : '✨';

    if (tradeOptions) {
        return `${emoji} Check out this amazing deal! ${title} - ${tradeOptions}! 🛍️`;
    }

    return `${emoji} Check this out! ${title}`;
};

export default function ShareButton({
    url,
    title,
    description,
    imageUrl,
    price,
    allowCash = true,
    allowBarter = false,
    className = '',
    iconOnly = false,
    onShare,
}: ShareButtonProps) {
    const [showMenu, setShowMenu] = useState(false);
    const { addToast } = useToastStore();

    const canUseNativeShare = typeof navigator !== 'undefined' && navigator.share;

    const handleNativeShare = async () => {
        if (!canUseNativeShare) return;

        const shareText = createShareMessage(title, price, allowCash, allowBarter);

        try {
            await navigator.share({
                title: `${title}`,
                text: shareText,
                url,
            });
            onShare?.('native');
            addToast('success', 'Shared successfully!');
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing:', error);
                addToast('error', 'Failed to share');
            }
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            onShare?.('clipboard');
            addToast('success', 'Link copied to clipboard!');
            setShowMenu(false);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            addToast('error', 'Failed to copy link');
        }
    };

    const shareToSocial = (platform: string) => {
        const encodedUrl = encodeURIComponent(url);
        const shareText = createShareMessage(title, price, allowCash, allowBarter);
        const encodedShareText = encodeURIComponent(shareText);

        let shareUrl = '';

        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedShareText}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodedShareText}%20${encodedUrl}`;
                break;
            default:
                return;
        }

        window.open(shareUrl, '_blank', 'width=600,height=400');
        onShare?.(platform);
        setShowMenu(false);
    };

    const handleClick = () => {
        if (canUseNativeShare) {
            handleNativeShare();
        } else {
            setShowMenu(!showMenu);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={handleClick}
                className={className || `group flex items-center justify-center w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200`}
                title="Share this listing"
            >
                <svg
                    className="w-[18px] h-[18px] text-gray-600 group-hover:text-blue-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                </svg>
            </button>

            {/* Share Menu Dropdown */}
            {showMenu && !canUseNativeShare && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />

                    <div className="absolute top-full mt-3 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 min-w-[220px] animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900">Share this listing</p>
                        </div>

                        {/* Copy Link */}
                        <button
                            onClick={handleCopyLink}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 group"
                        >
                            <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-medium text-gray-900">Copy Link</span>
                                <p className="text-xs text-gray-500">Click to copy URL</p>
                            </div>
                        </button>

                        <div className="h-px bg-gray-100 mx-3" />

                        {/* WhatsApp */}
                        <button
                            onClick={() => shareToSocial('whatsapp')}
                            className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors flex items-center gap-3 group"
                        >
                            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            </div>
                            <span className="font-medium text-gray-900">WhatsApp</span>
                        </button>

                        {/* Facebook */}
                        <button
                            onClick={() => shareToSocial('facebook')}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 group"
                        >
                            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </div>
                            <span className="font-medium text-gray-900">Facebook</span>
                        </button>

                        {/* Twitter/X */}
                        <button
                            onClick={() => shareToSocial('twitter')}
                            className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors flex items-center gap-3 group"
                        >
                            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </div>
                            <span className="font-medium text-gray-900">X (Twitter)</span>
                        </button>

                        {/* LinkedIn */}
                        <button
                            onClick={() => shareToSocial('linkedin')}
                            className="w-full px-4 py-3 text-left hover:bg-sky-50 transition-colors flex items-center gap-3 group"
                        >
                            <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            </div>
                            <span className="font-medium text-gray-900">LinkedIn</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
