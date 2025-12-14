'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationsStore } from '@/lib/notifications-store';
import { formatDistanceToNow } from 'date-fns';
import { NotificationsListSkeleton } from '@/components/ui/Skeleton';

export default function NotificationsPage() {
    const router = useRouter();
    const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationsStore();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const getNotificationLink = (notification: any): string => {
        const data = notification.data || {};

        switch (notification.type) {
            // Message notifications
            case 'message':
            case 'NEW_MESSAGE':
                return data.conversationId
                    ? `/messages/${data.conversationId}`
                    : data.senderId
                        ? `/messages/${data.senderId}`
                        : '/messages';

            // Offer notifications
            case 'NEW_OFFER':
            case 'offer':
            case 'OFFER_ACCEPTED':
            case 'OFFER_REJECTED':
            case 'OFFER_COUNTERED':
                return data.offerId ? `/offers?id=${data.offerId}` : '/offers';

            // Order notifications
            case 'order':
            case 'ORDER_CONFIRMED':
            case 'ORDER_CANCELLED':
                return data.orderId ? `/orders/${data.orderId}` : '/profile';

            // Escrow notifications
            case 'ESCROW_HELD':
            case 'ESCROW_CODE':
            case 'ESCROW_RELEASED':
            case 'ESCROW_COMPLETE':
            case 'ESCROW_EXPIRED':
                return data.orderId ? `/orders/${data.orderId}` : '/profile';

            // Verification notifications
            case 'VERIFICATION_APPROVED':
            case 'VERIFICATION_REJECTED':
            case 'VERIFICATION_REQUEST': // Assuming there is a request type for admins
                // If it's an admin notification about a user, link to admin panel
                return data.userEmail
                    ? `/admin/users?search=${encodeURIComponent(data.userEmail)}`
                    : '/profile';

            // Listing notifications
            case 'LISTING_SOLD':
            case 'LISTING_EXPIRED':
                return data.listingId ? `/listings/${data.listingId}` : '/my-listings';

            // Review notifications
            case 'NEW_REVIEW':
                return '/profile';

            // Role/Admin notifications
            case 'ROLE_ASSIGNED':
            case 'ROLE_REVOKED':
                return '/admin';

            // Account status notifications
            case 'USER_SUSPENDED':
            case 'USER_BANNED':
                return '/appeals'; // Link to appeals page where they can submit an appeal
            case 'SUSPENSION_REMOVED':
                return '/profile'; // Account restored, go to profile

            // System notifications
            case 'system':
            case 'SYSTEM':
                return data.link || '/notifications';

            default:
                // Check if there's a link in the data
                if (data.link) return data.link;
                if (data.listingId) return `/listings/${data.listingId}`;
                if (data.orderId) return `/orders/${data.orderId}`;
                if (data.offerId) return `/offers`;
                return '/notifications';
        }
    };

    const handleNotificationClick = async (e: React.MouseEvent, notification: any) => {
        e.preventDefault(); // Prevent default link behavior

        // Get the target link first
        const targetLink = getNotificationLink(notification);

        // Navigate immediately
        router.push(targetLink);

        // Mark as read in background if not already
        if (!notification.readAt) {
            try {
                await markAsRead(notification.id);
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }
    };

    const getNotificationIcon = (type: string): string => {
        switch (type) {
            // Messages
            case 'message':
            case 'NEW_MESSAGE':
                return '💬';

            // Offers
            case 'NEW_OFFER':
            case 'offer':
                return '🔄';
            case 'OFFER_ACCEPTED':
                return '✅';
            case 'OFFER_REJECTED':
                return '❌';
            case 'OFFER_COUNTERED':
                return '↩️';

            // Orders
            case 'order':
            case 'ORDER_CONFIRMED':
                return '📦';
            case 'ORDER_CANCELLED':
                return '🚫';

            // Escrow
            case 'ESCROW_HELD':
                return '🔒';
            case 'ESCROW_CODE':
                return '🔑';
            case 'ESCROW_RELEASED':
            case 'ESCROW_COMPLETE':
                return '🎉';
            case 'ESCROW_EXPIRED':
                return '⏰';

            // Verification
            case 'VERIFICATION_APPROVED':
                return '✅';
            case 'VERIFICATION_REJECTED':
                return '⚠️';

            // Listing
            case 'LISTING_SOLD':
                return '💰';
            case 'LISTING_EXPIRED':
                return '⏳';

            // Reviews
            case 'NEW_REVIEW':
                return '⭐';

            // Role
            case 'ROLE_ASSIGNED':
            case 'ROLE_REVOKED':
                return '👤';

            // Account status
            case 'USER_SUSPENDED':
                return '⚠️';
            case 'USER_BANNED':
                return '🚫';
            case 'SUSPENSION_REMOVED':
                return '🎉';

            // System
            case 'system':
            case 'SYSTEM':
                return '🔔';

            default:
                return '📢';
        }
    };

    const unreadCount = notifications.filter(n => !n.readAt).length;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white">
                <div className="container mx-auto px-4 max-w-2xl py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Notifications</h1>
                                <p className="text-amber-100">
                                    {unreadCount > 0 ? `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}` : 'You\'re all caught up! 🎉'}
                                </p>
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 text-sm font-medium hover:bg-white/30 transition"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-2xl">

                {isLoading ? (
                    <NotificationsListSkeleton count={6} />
                ) : notifications.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="text-4xl mb-4">🔕</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                        <p className="text-gray-500">We'll let you know when something important happens.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => {
                            const isSuspension = ['USER_SUSPENDED', 'USER_BANNED'].includes(notification.type);

                            if (isSuspension) {
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={(e) => handleNotificationClick(e, notification)}
                                        className={`block rounded-xl p-5 shadow-sm border transition hover:shadow-md cursor-pointer ${notification.readAt
                                                ? 'bg-red-50 border-red-200'
                                                : 'bg-white border-red-300 ring-1 ring-red-100'
                                            }`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl flex-shrink-0 animate-pulse-slow">
                                                {notification.type === 'USER_BANNED' ? '🚫' : '⛔'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-red-800 text-lg mb-1">
                                                        {notification.type === 'USER_BANNED' ? 'Account Banned' : 'Account Suspended'}
                                                    </h4>
                                                    {!notification.readAt && (
                                                        <span className="flex w-3 h-3 bg-red-600 rounded-full"></span>
                                                    )}
                                                </div>

                                                <div className="bg-white/60 rounded-lg p-3 border border-red-100 mb-2">
                                                    <p className="text-gray-900 font-medium">
                                                        {notification.data.message}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-red-700/70">
                                                    <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                                                    <span>•</span>
                                                    <span className="font-medium hover:underline">Tap to appeal &rarr;</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={notification.id}
                                    onClick={(e) => handleNotificationClick(e, notification)}
                                    className={`block bg-white rounded-xl p-4 shadow-sm border transition hover:shadow-md cursor-pointer ${notification.readAt ? 'border-gray-200' : 'border-blue-200 bg-blue-50'
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-gray-900 ${notification.readAt ? '' : 'font-semibold'}`}>
                                                {notification.data.message || 'New notification'}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.readAt && (
                                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
