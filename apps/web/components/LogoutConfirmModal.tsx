'use client';

import { useAuthStore } from '@/lib/auth-store';
import { sanitizeUrl } from '@/lib/utils';
import { LogOut, ShieldAlert, X } from 'lucide-react';
import Image from 'next/image';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: LogoutConfirmModalProps) {
  const { user } = useAuthStore();

  if (!isOpen) return null;

  const displayName =
    user?.profile?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    'Barter Trader';
  const avatarUrl = user?.profile?.avatarUrl ? sanitizeUrl(user.profile.avatarUrl) : null;
  const initial = user?.firstName?.[0]?.toUpperCase() || 'U';

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
            <LogOut className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              Sign Out of BarterWave?
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to end your current session? You will need to log back in to access your trade offers and direct messages.
            </p>
          </div>
        </div>

        {/* User Account Snapshot Card */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3 my-4 flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-md object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-md bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-slate-900 truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
            Active
          </span>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-md transition-colors text-center"
          >
            Stay Signed In
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-md transition-colors shadow-xs flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
