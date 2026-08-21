'use client';

import Image from 'next/image';
import { BarterOffer } from '@/lib/types';
import { sanitizeUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { MessageSquare, ArrowRight, Eye, RefreshCw } from 'lucide-react';

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const getCurrencySymbol = (code?: string) => CURRENCY_SYMBOLS[code || ''] || code || '$';

interface OfferCardProps {
  offer: BarterOffer;
  type: 'received' | 'sent' | 'history';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onCounter?: (offer: BarterOffer) => void;
  onWithdraw?: (id: string) => void;
  onAcceptCounter?: (id: string) => void;
  onMessage?: (offer: BarterOffer) => void;
  onConfirm?: (id: string) => void;
  onViewReceipt?: (offer: BarterOffer) => void;
  onViewDetails?: (offer: BarterOffer) => void;
  currentUserId?: string;
}

export default function OfferCard({
  offer,
  type,
  onAccept,
  onReject,
  onCounter,
  onWithdraw,
  onAcceptCounter,
  onMessage,
  onConfirm,
  onViewReceipt,
  onViewDetails,
  currentUserId,
}: OfferCardProps) {
  const router = useRouter();

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const statusStyles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    countered: 'bg-blue-50 text-blue-700 border-blue-200',
    withdrawn: 'bg-slate-100 text-slate-500 border-slate-200',
    cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const statusText = offer.status.charAt(0).toUpperCase() + offer.status.slice(1);

  const buyerName = offer.buyer?.profile?.displayName || offer.buyer?.email || 'Unknown Buyer';
  const sellerName = offer.seller?.profile?.displayName || offer.seller?.email || 'Unknown Seller';

  const hasCash = (offer.offeredCashCents || 0) > 0;
  const hasItems = (offer.items || []).length > 0;
  const cashText = hasCash
    ? `${getCurrencySymbol(offer.currencyCode)}${((offer.offeredCashCents || 0) / 100).toLocaleString()}`
    : '';
  const barterItemsText =
    offer.items?.map((item) => `${item.quantity}x ${item.offeredListing?.title || 'Item'}`).join(', ') || '';

  const isSeller = offer.sellerId === currentUserId;
  const isBuyer = offer.buyerId === currentUserId;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
      {/* Top row: Image + Listing + Meta */}
      <div className="flex gap-3.5 p-4">
        <Image
          src={sanitizeUrl(offer.listing.images[0]?.url || '')}
          alt={offer.listing.title}
          width={56}
          height={56}
          className="w-14 h-14 rounded-md object-cover border border-slate-200 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
              {offer.listing.title}
            </h3>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                statusStyles[offer.status] || statusStyles.pending
              }`}
            >
              {statusText}
            </span>
          </div>

          {/* Who + When */}
          <p className="text-[11px] text-slate-500 mt-0.5">
            {type === 'received'
              ? `From ${buyerName}`
              : type === 'sent'
              ? `To ${sellerName}`
              : isBuyer
              ? `To ${sellerName}`
              : `From ${buyerName}`}
            <span className="text-slate-300 mx-1.5">&bull;</span>
            {getTimeAgo(offer.createdAt)}
          </p>

          {/* Offer Summary */}
          <p className="text-xs font-semibold text-slate-800 mt-1.5 truncate">
            {hasCash && <span className="text-emerald-700">{cashText}</span>}
            {hasCash && hasItems && <span className="text-slate-400 mx-1">+</span>}
            {hasItems && <span className="text-blue-700">{barterItemsText}</span>}
            {!hasCash && !hasItems && <span className="text-blue-600 font-medium">Barter trade</span>}
          </p>
        </div>
      </div>

      {/* Message */}
      {offer.message && (
        <div className="mx-4 mb-3 p-2.5 bg-slate-50 rounded-md border border-slate-200/80">
          <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
            {offer.message}
          </p>
        </div>
      )}

      {/* Actions */}
      {type === 'received' && offer.status === 'pending' && (
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => onViewDetails?.(offer)}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Review Offer</span>
          </button>
        </div>
      )}

      {type === 'sent' && offer.status === 'pending' && (
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => onViewDetails?.(offer)}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Offer Details</span>
          </button>
        </div>
      )}

      {/* History status actions */}
      {type === 'history' && (
        <div className="px-4 pb-4 flex gap-2">
          {offer.status === 'rejected' && isBuyer && (
            <button
              onClick={() => router.push(`/listings/${offer.listingId}`)}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Make New Offer</span>
            </button>
          )}

          <button
            onClick={() => onViewDetails?.(offer)}
            className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs transition-colors"
          >
            Details
          </button>
        </div>
      )}
    </div>
  );
}
