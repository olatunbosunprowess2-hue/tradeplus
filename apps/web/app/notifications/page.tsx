'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationsStore } from '@/lib/notifications-store';
import { formatDistanceToNow } from 'date-fns';
import { NotificationsListSkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  Repeat,
  ShieldCheck,
  Package,
  AlertCircle,
  Clock,
  Ban,
  Tag,
  Star,
  UserCheck,
  Sparkles,
  Inbox,
} from 'lucide-react';

type NotificationFilter = 'ALL' | 'OFFERS' | 'ESCROW' | 'ACCOUNT';

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationsStore();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('ALL');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationLink = (notification: any): string => {
    const data = notification.data || {};

    switch (notification.type) {
      case 'message':
      case 'NEW_MESSAGE':
        return data.conversationId
          ? `/messages/${data.conversationId}`
          : data.senderId
          ? `/messages/${data.senderId}`
          : '/messages';

      case 'NEW_OFFER':
      case 'offer':
      case 'OFFER_ACCEPTED':
      case 'OFFER_REJECTED':
      case 'OFFER_COUNTERED':
        return data.offerId ? `/offers?id=${data.offerId}` : '/offers';

      case 'order':
      case 'ORDER_CONFIRMED':
      case 'ORDER_CANCELLED':
      case 'ESCROW_HELD':
      case 'ESCROW_CODE':
      case 'ESCROW_RELEASED':
      case 'ESCROW_COMPLETE':
      case 'ESCROW_EXPIRED':
        return data.orderId ? `/orders/${data.orderId}` : '/profile';

      case 'VERIFICATION_APPROVED':
      case 'VERIFICATION_REJECTED':
      case 'VERIFICATION_REQUEST':
        return data.userEmail
          ? `/admin/users?search=${encodeURIComponent(data.userEmail)}`
          : '/profile';

      case 'LISTING_SOLD':
      case 'LISTING_EXPIRED':
        return data.listingId ? `/listings/${data.listingId}` : '/my-listings';

      case 'NEW_REVIEW':
        return '/profile';

      case 'USER_SUSPENDED':
      case 'USER_BANNED':
      case 'NEW_APPEAL':
      case 'APPEAL_APPROVED':
      case 'APPEAL_REJECTED':
        return '/appeals';

      default:
        if (data.link) return data.link;
        if (data.listingId) return `/listings/${data.listingId}`;
        if (data.orderId) return `/orders/${data.orderId}`;
        if (data.offerId) return `/offers`;
        return '/notifications';
    }
  };

  const handleNotificationClick = async (e: React.MouseEvent, notification: any) => {
    e.preventDefault();
    const targetLink = getNotificationLink(notification);
    router.push(targetLink);

    if (!notification.readAt) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  const getCategory = (type: string): NotificationFilter => {
    if (['NEW_OFFER', 'offer', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'OFFER_COUNTERED'].includes(type)) {
      return 'OFFERS';
    }
    if (['order', 'ORDER_CONFIRMED', 'ORDER_CANCELLED', 'ESCROW_HELD', 'ESCROW_CODE', 'ESCROW_RELEASED', 'ESCROW_COMPLETE', 'ESCROW_EXPIRED'].includes(type)) {
      return 'ESCROW';
    }
    if (['VERIFICATION_APPROVED', 'VERIFICATION_REJECTED', 'VERIFICATION_REQUEST', 'USER_SUSPENDED', 'USER_BANNED', 'ROLE_ASSIGNED', 'ROLE_REVOKED'].includes(type)) {
      return 'ACCOUNT';
    }
    return 'ALL';
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'NEW_OFFER':
      case 'offer':
      case 'OFFER_COUNTERED':
        return <Repeat className="w-4 h-4 text-indigo-600" />;
      case 'OFFER_ACCEPTED':
      case 'ESCROW_COMPLETE':
      case 'VERIFICATION_APPROVED':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'OFFER_REJECTED':
      case 'ORDER_CANCELLED':
      case 'USER_BANNED':
      case 'USER_SUSPENDED':
        return <Ban className="w-4 h-4 text-rose-600" />;
      case 'order':
      case 'ORDER_CONFIRMED':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'ESCROW_HELD':
      case 'ESCROW_CODE':
      case 'ESCROW_RELEASED':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'VERIFICATION_REJECTED':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'VERIFICATION_REQUEST':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'LISTING_SOLD':
      case 'LISTING_EXPIRED':
        return <Tag className="w-4 h-4 text-slate-700" />;
      case 'NEW_REVIEW':
        return <Star className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'ALL') return notifications;
    return notifications.filter((n) => getCategory(n.type) === activeFilter);
  }, [notifications, activeFilter]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="container mx-auto px-4 max-w-3xl pt-6">
        {/* ============================================================ */}
        {/* Clean Executive Header Card                                   */}
        {/* ============================================================ */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs mb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Notifications
                  </h1>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {unreadCount} Unread
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time updates on your trade offers, escrow funds, and verifications.
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition-colors shadow-2xs shrink-0"
              >
                <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 mt-5 pt-4 border-t border-slate-100 overflow-x-auto scrollbar-hide">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'OFFERS', label: 'Offers & Trades' },
              { id: 'ESCROW', label: 'Orders & Escrow' },
              { id: 'ACCOUNT', label: 'Account & Security' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as NotificationFilter)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors shrink-0 ${
                  activeFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* Notifications Feed                                           */}
        {/* ============================================================ */}
        {isLoading ? (
          <NotificationsListSkeleton count={6} />
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-12 text-center">
            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              No notifications found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mb-4">
              {activeFilter === 'ALL'
                ? "You're completely caught up! We'll notify you as soon as there is activity on your listings or swaps."
                : 'No notifications matching this category tab.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              Explore Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredNotifications.map((notification) => {
              const isUnread = !notification.readAt;

              return (
                <div
                  key={notification.id}
                  onClick={(e) => handleNotificationClick(e, notification)}
                  className={`group block bg-white rounded-lg border transition-all p-3.5 sm:p-4 cursor-pointer shadow-2xs hover:shadow-xs hover:border-slate-300 ${
                    isUnread
                      ? 'border-l-4 border-l-blue-600 border-slate-200 bg-blue-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Icon Container */}
                    <div className="w-9 h-9 rounded-md bg-slate-50 border border-slate-200/90 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      {getIcon(notification.type)}
                    </div>

                    {/* Notification Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs sm:text-sm leading-snug ${
                            isUnread
                              ? 'font-bold text-slate-900'
                              : 'font-medium text-slate-700'
                          }`}
                        >
                          {notification.data?.message || 'New notification update'}
                        </p>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-blue-600 group-hover:underline font-semibold">
                          View details
                        </span>
                      </div>
                    </div>
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
