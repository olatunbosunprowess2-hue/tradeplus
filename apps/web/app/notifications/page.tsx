'use client';

import { useEffect } from 'react';
import { useNotificationsStore } from '@/lib/notifications-store';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function NotificationsPage() {
    const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationsStore();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleNotificationClick = (notification: any) => {
        if (!notification.readAt) {
            markAsRead(notification.id);
        }
    };

    const getNotificationLink = (notification: any) => {
        switch (notification.type) {
            case 'message':
                return `/messages/${notification.data.senderId}`;
            case 'offer':
                return `/offers`;
            case 'order':
                return `/profile`;
            default:
                return '#';
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'message':
                return '💬';
            case 'offer':
                return '🔄';
            case 'order':
                return '📦';
            case 'system':
                return '🔔';
            default:
                return '📢';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    {notifications.some(n => !n.readAt) && (
                        <button
                            onClick={() => markAllAsRead()}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="text-4xl mb-4">🔕</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                        <p className="text-gray-500">We'll let you know when something important happens.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <Link
                                key={notification.id}
                                href={getNotificationLink(notification)}
                                onClick={() => handleNotificationClick(notification)}
                                className={`block bg-white rounded-xl p-4 shadow-sm border transition hover:shadow-md ${notification.readAt ? 'border-gray-200' : 'border-blue-200 bg-blue-50'
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
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
