'use client';

import { useState } from 'react';
import { useToastStore } from '@/lib/toast-store';

interface ShareButtonProps {
    url: string;
    title: string;
    description?: string;
    imageUrl?: string;
    price?: string; // Formatted price string (e.g., "₦5,000")
    allowCash?: boolean;
    allowBarter?: boolean;
    className?: string;
    iconOnly?: boolean;
    onShare?: (platform: string) => void; // Optional analytics callback
}

// Helper function to create compelling share messages
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
        return `${emoji} Check out this amazing deal on TradePlus! ${title} - ${tradeOptions}! 🛍️`;
    }

    return `${emoji} Check out this on TradePlus! ${title}`;
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

    // Check if Web Share API is supported (typically mobile devices)
    const canUseNativeShare = typeof navigator !== 'undefined' && navigator.share;

    const handleNativeShare = async () => {
        if (!canUseNativeShare) return;

        const shareText = createShareMessage(title, price, allowCash, allowBarter);

        try {
            await navigator.share({
                title: `${title} - TradePlus`,
                text: shareText,
                url,
            });
            onShare?.('native');
            addToast('success', 'Shared successfully!');
        } catch (error: any) {
            // User cancelled the share or error occurred
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
                className={`flex items-center gap-2 transition-all ${className || 'bg-white text-gray-700 p-2.5 rounded-full hover:bg-gray-100 shadow-lg'
                    }`}
                title="Share this listing"
            >
                {/* Share Icon - Upload/Export Arrow */}
                <svg
                    className="w-5 h-5"
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
                {!iconOnly && <span className="font-medium">Share</span>}
            </button>

            {/* Desktop Fallback Menu */}
            {showMenu && !canUseNativeShare && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />

                    {/* Share Menu */}
                    <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 min-w-[200px]">
                        <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-bold text-gray-900">Share this listing</p>
                        </div>

                        {/* Copy Link */}
                        <button
                            onClick={handleCopyLink}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                            </svg>
                            <span className="font-medium">Copy Link</span>
                        </button>

                        <div className="border-t border-gray-100 my-1" />

                        {/* WhatsApp */}
                        <button
                            onClick={() => shareToSocial('whatsapp')}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700"
                        >
                            <div className="w-5 h-5 flex items-center justify-center">
                                <span className="text-lg">💬</span>
                            </div>
                            <span className="font-medium">WhatsApp</span>
                        </button>

                        {/* Facebook */}
                        <button
                            onClick={() => shareToSocial('facebook')}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700"
                        >
                            <div className="w-5 h-5 flex items-center justify-center">
                                <span className="text-lg">📘</span>
                            </div>
                            <span className="font-medium">Facebook</span>
                        </button>

                        {/* Twitter */}
                        <button
                            onClick={() => shareToSocial('twitter')}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700"
                        >
                            <div className="w-5 h-5 flex items-center justify-center">
                                <span className="text-lg">🐦</span>
                            </div>
                            <span className="font-medium">Twitter</span>
                        </button>

                        {/* LinkedIn */}
                        <button
                            onClick={() => shareToSocial('linkedin')}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700"
                        >
                            <div className="w-5 h-5 flex items-center justify-center">
                                <span className="text-lg">💼</span>
                            </div>
                            <span className="font-medium">LinkedIn</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
