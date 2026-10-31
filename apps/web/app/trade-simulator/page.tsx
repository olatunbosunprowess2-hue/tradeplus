'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  X,
  Check,
  Repeat,
  Sparkles,
  Lock,
  ArrowRight,
  Send,
  Star,
  RotateCcw,
  Smartphone,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Clock,
  KeyRound,
  ExternalLink,
  Flame,
  Zap,
} from 'lucide-react';
import TradeStepper from '@/components/trade/TradeStepper';

// Message model for live dual-phone chat
interface ChatMessage {
  id: string;
  sender: 'buyer' | 'seller';
  text: string;
  time: string;
}

export default function TradeSimulatorPage() {
  // Trade state machine
  const [offerStatus, setOfferStatus] = useState<
    'proposed' | 'accepted' | 'awaiting_fulfillment' | 'completed'
  >('accepted');
  const [isBuyerLocked, setIsBuyerLocked] = useState(false);
  const [isSellerLocked, setIsSellerLocked] = useState(true); // Default to Amaka locked so user immediately sees the active lock state
  const [isBuyerFulfilled, setIsBuyerFulfilled] = useState(false);
  const [isSellerFulfilled, setIsSellerFulfilled] = useState(false);

  // The generated 6-digit pickup PIN for the buyer
  const [pickupPin] = useState('749103');
  const [sellerInputPin, setSellerInputPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Modals & Celebrations
  const [showLockCelebration, setShowLockCelebration] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealSubmitted, setAppealSubmitted] = useState(false);
  const [appealReason, setAppealReason] = useState('Item has hidden defects or faults');
  const [customDisputeText, setCustomDisputeText] = useState('');
  const [starRating, setStarRating] = useState(5);

  // Chat conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'buyer',
      text: 'Hello Amaka! Is this iPhone 13 Pro Max still available for exchange?',
      time: '10:14 AM',
    },
    {
      id: '2',
      sender: 'seller',
      text: 'Yes Tunde! Mint condition, 89% battery health. What do you have for trade?',
      time: '10:15 AM',
    },
    {
      id: '3',
      sender: 'buyer',
      text: 'I have a clean PS5 Digital Edition + ₦40,000 cash balance. Just made you an offer.',
      time: '10:16 AM',
    },
    {
      id: '4',
      sender: 'seller',
      text: '🤝 Offer accepted! Let us lock the deal and agree on meetup spot.',
      time: '10:17 AM',
    },
  ]);

  const [buyerInput, setBuyerInput] = useState('');
  const [sellerInput, setSellerInput] = useState('');

  // Device view toggles for smaller screens
  const [mobileActiveDevice, setMobileActiveDevice] = useState<'buyer' | 'seller'>('buyer');

  const buyerChatEndRef = useRef<HTMLDivElement>(null);
  const sellerChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    buyerChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    sellerChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Stage Preset Jumper
  const jumpToStage = (stage: number) => {
    switch (stage) {
      case 1: // Proposed
        setOfferStatus('proposed');
        setIsBuyerLocked(false);
        setIsSellerLocked(false);
        setIsBuyerFulfilled(false);
        setIsSellerFulfilled(false);
        setShowCompleteModal(false);
        break;
      case 2: // Accepted - neither locked
        setOfferStatus('accepted');
        setIsBuyerLocked(false);
        setIsSellerLocked(false);
        setIsBuyerFulfilled(false);
        setIsSellerFulfilled(false);
        setShowCompleteModal(false);
        break;
      case 3: // Accepted - Amaka locked, waiting for Tunde
        setOfferStatus('accepted');
        setIsBuyerLocked(false);
        setIsSellerLocked(true);
        setIsBuyerFulfilled(false);
        setIsSellerFulfilled(false);
        setShowCompleteModal(false);
        break;
      case 4: // Dual Locked - In fulfillment / Exchange mode
        setOfferStatus('awaiting_fulfillment');
        setIsBuyerLocked(true);
        setIsSellerLocked(true);
        setIsBuyerFulfilled(false);
        setIsSellerFulfilled(false);
        setShowCompleteModal(false);
        break;
      case 5: // Completed
        setOfferStatus('completed');
        setIsBuyerLocked(true);
        setIsSellerLocked(true);
        setIsBuyerFulfilled(true);
        setIsSellerFulfilled(true);
        setShowCompleteModal(true);
        break;
    }
  };

  // Sending chat messages
  const handleSendMessage = (sender: 'buyer' | 'seller', text: string) => {
    if (!text.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender,
        text: text.trim(),
        time: timeStr,
      },
    ]);
    if (sender === 'buyer') setBuyerInput('');
    if (sender === 'seller') setSellerInput('');
  };

  // 1. Seller accepts offer
  const handleAcceptOffer = () => {
    setOfferStatus('accepted');
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'seller',
        text: '🤝 Offer accepted! Let us lock the deal and agree on meetup spot.',
        time: 'Just now',
      },
    ]);
  };

  // 2. Lock deal
  const handleLockDeal = (who: 'buyer' | 'seller') => {
    if (who === 'buyer') {
      setIsBuyerLocked(true);
      if (isSellerLocked) {
        triggerDualLockSuccess();
      }
    } else {
      setIsSellerLocked(true);
      if (isBuyerLocked) {
        triggerDualLockSuccess();
      }
    }
  };

  const triggerDualLockSuccess = () => {
    setShowLockCelebration(true);
    setTimeout(() => {
      setShowLockCelebration(false);
      setOfferStatus('awaiting_fulfillment');
    }, 2000);
  };

  // 3. Verify PIN by Seller
  const handleVerifySellerPin = () => {
    if (sellerInputPin === pickupPin) {
      setPinError('');
      setIsSellerFulfilled(true);
      setIsBuyerFulfilled(true);
      setOfferStatus('completed');
      setShowCompleteModal(true);
    } else {
      setPinError('Invalid PIN code. Please check with buyer.');
    }
  };

  // Manual Confirmation bypass
  const handleManualConfirm = (who: 'buyer' | 'seller') => {
    if (who === 'buyer') {
      setIsBuyerFulfilled(true);
      if (isSellerFulfilled) {
        setOfferStatus('completed');
        setShowCompleteModal(true);
      }
    } else {
      setIsSellerFulfilled(true);
      if (isBuyerFulfilled) {
        setOfferStatus('completed');
        setShowCompleteModal(true);
      }
    }
  };

  // Reset simulator
  const handleReset = () => {
    setOfferStatus('proposed');
    setIsBuyerLocked(false);
    setIsSellerLocked(false);
    setIsBuyerFulfilled(false);
    setIsSellerFulfilled(false);
    setSellerInputPin('');
    setPinError('');
    setShowCompleteModal(false);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 py-6 px-3 sm:px-6 font-sans">
      {/* ── TOP CONTROLLER DECK ── */}
      <div className="max-w-7xl mx-auto mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2 py-0.5 bg-[#1D4ED8]/20 text-[#60A5FA] border border-[#1D4ED8]/40 rounded text-[10px] font-black uppercase tracking-wider">
                DUAL-DEVICE LIVE SIMULATOR
              </span>
              <span className="px-2 py-0.5 bg-[#16A34A]/20 text-[#4ADE80] border border-[#16A34A]/40 rounded text-[10px] font-black uppercase tracking-wider">
                IPHONE 11 PRO MAX (414 × 896 PT)
              </span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                P2P HANDSHAKE ACTIVE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Gamified P2P Trade & Handshake Studio</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Test buyer and seller live synchronization simultaneously with real micro-interactions, exchange PIN verification, and instant review flows.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleReset}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <Link
              href="/preview-payments"
              className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-xl transition-all shadow-[0_4px_14px_rgba(29,78,216,0.35)] flex items-center gap-1.5 active:scale-95"
            >
              <span>Payment Modals Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Stage Jump Tabs */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Stage Jumpers:
          </span>
          <button
            onClick={() => jumpToStage(1)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
              offerStatus === 'proposed'
                ? 'bg-[#1D4ED8] text-white shadow-[0_2px_8px_rgba(29,78,216,0.35)]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            1. Offer Proposed
          </button>
          <button
            onClick={() => jumpToStage(2)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
              offerStatus === 'accepted' && !isBuyerLocked && !isSellerLocked
                ? 'bg-[#1D4ED8] text-white shadow-[0_2px_8px_rgba(29,78,216,0.35)]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            2. Accepted (Unlocked)
          </button>
          <button
            onClick={() => jumpToStage(3)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
              offerStatus === 'accepted' && isSellerLocked && !isBuyerLocked
                ? 'bg-amber-500 text-slate-950 font-black shadow-[0_2px_8px_rgba(245,158,11,0.35)]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            3. Amaka Locked (Waiting Tunde)
          </button>
          <button
            onClick={() => jumpToStage(4)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
              offerStatus === 'awaiting_fulfillment'
                ? 'bg-[#1D4ED8] text-white shadow-[0_2px_8px_rgba(29,78,216,0.35)]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            4. Dual Locked (PIN Code Exchange)
          </button>
          <button
            onClick={() => jumpToStage(5)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
              offerStatus === 'completed'
                ? 'bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white font-black shadow-[0_2px_8px_rgba(22,163,74,0.35)]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            5. Trade Verified & Review
          </button>
        </div>
      </div>

      {/* Mobile Toggle Bar (Hidden on Large Desktop) */}
      <div className="max-w-7xl mx-auto lg:hidden mb-4 flex items-center justify-center gap-2">
        <button
          onClick={() => setMobileActiveDevice('buyer')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
            mobileActiveDevice === 'buyer'
              ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-[0_2px_10px_rgba(29,78,216,0.3)]'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          📱 Buyer View (Tunde)
        </button>
        <button
          onClick={() => setMobileActiveDevice('seller')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
            mobileActiveDevice === 'seller'
              ? 'bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white border-[#16A34A] shadow-[0_2px_10px_rgba(22,163,74,0.3)]'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          📱 Seller View (Amaka)
        </button>
      </div>

      {/* ── DUAL IPHONE 11 PRO MAX SIDE-BY-SIDE FRAME ── */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 pb-16">
        {/* ========================================================== */}
        {/* PHONE 1: BUYER (TUNDE)                                      */}
        {/* ========================================================== */}
        <div
          className={`w-full max-w-[414px] flex flex-col items-center ${
            mobileActiveDevice !== 'buyer' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2 px-3 text-xs">
            <span className="font-extrabold text-[#60A5FA] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB] shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
              BUYER DEVICE (Tunde Adeleke)
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-semibold">iPhone 11 Pro Max</span>
          </div>

          {/* Smartphone Hardware Frame */}
          <div className="w-[414px] h-[850px] bg-[#0A0F1D] rounded-[52px] p-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] border-[5px] border-slate-800/90 relative flex flex-col overflow-hidden ring-1 ring-slate-700/50">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center">
              <div className="w-14 h-1 bg-slate-800 rounded-full mb-1" />
              <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-800 ml-2.5 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-900/40" />
              </div>
            </div>

            {/* iOS Screen Display Area */}
            <div className="w-full h-full bg-[#F8FAFC] text-[#0F172A] rounded-[40px] flex flex-col overflow-hidden relative font-sans select-none">
              {/* iOS Status Bar */}
              <div className="h-11 pt-2.5 px-7 flex items-center justify-between text-xs font-black text-slate-900 shrink-0">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold">5G</span>
                  <div className="w-5 h-2.5 border border-slate-900 rounded-xs p-0.5 flex items-center">
                    <div className="w-full h-full bg-slate-900 rounded-xs" />
                  </div>
                </div>
              </div>

              {/* In-App Header */}
              <div className="bg-white border-b border-slate-200/90 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-sm ring-1 ring-emerald-400/30">
                    A
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-[#0F172A]">Amaka Store</span>
                      <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 rounded text-[8px] font-black uppercase tracking-wider">
                        VERIFIED
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight font-medium">Lekki Phase 1, Lagos</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                  <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] rounded text-[9px] font-black uppercase tracking-wider">
                    ACTIVE DEAL
                  </span>
                </div>
              </div>

              {/* Trade Stepper */}
              <div className="bg-white border-b border-slate-200/90 px-3.5 py-2 shrink-0">
                <TradeStepper
                  status={offerStatus}
                  isBuyerLocked={isBuyerLocked}
                  isSellerLocked={isSellerLocked}
                />
              </div>

              {/* Deal Status Card / Action Panel */}
              <div className={`bg-white border-b border-slate-200/90 shrink-0 shadow-2xs transition-all ${offerStatus === 'completed' ? 'px-3 py-1.5' : 'p-3 space-y-2'}`}>
                {/* Proposed State */}
                {offerStatus === 'proposed' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-800 border border-amber-500/30 rounded text-[9px] font-black uppercase tracking-wider">
                      OFFER PROPOSED
                    </span>
                    <p className="text-xs font-black text-[#0F172A] mt-1.5">
                      PS5 Digital + ₦40,000 for iPhone 13 Pro Max
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Waiting for seller Amaka to review & accept.</p>
                  </div>
                )}

                {/* Accepted State: Dual Lock */}
                {offerStatus === 'accepted' && (
                  <div className="space-y-2">
                    {isSellerLocked && !isBuyerLocked && (
                      <div className="bg-white border border-amber-200/90 rounded-xl p-2.5 flex items-center gap-2.5 shadow-[0_1px_4px_rgba(245,158,11,0.1)]">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                          <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-[#0F172A]">Amaka committed</span>
                            <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[8px] font-black uppercase tracking-wider">
                              1/2 Locked
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            Lock your side to start safe local meetup
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-[#1D4ED8] shrink-0">
                          Lock now →
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => handleLockDeal('buyer')}
                      disabled={isBuyerLocked}
                      className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        isBuyerLocked
                          ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 cursor-default font-extrabold shadow-xs'
                          : 'bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)] active:scale-[0.98]'
                      }`}
                    >
                      {isBuyerLocked ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                          <span>Deal Locked by You</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 stroke-[2.5]" />
                          <span>Lock Deal (Commit)</span>
                        </>
                      )}
                    </button>
                    {!isBuyerLocked && (
                      <p className="text-[10px] text-slate-400 text-center font-medium">
                        Both parties must lock to initiate local meetup handshake.
                      </p>
                    )}
                  </div>
                )}

                {/* Fulfillment State: Show Buyer their secret 6-Digit PIN (Balanced Micro-Card) */}
                {offerStatus === 'awaiting_fulfillment' && (
                  <div className="bg-[#0B1120] border border-slate-800 text-white rounded-2xl p-3 shadow-md space-y-2">
                    {/* Top Row: 6-Digit PIN Display & Live Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-xl shadow-inner">
                        <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-mono font-black text-lg tracking-[0.25em] text-white select-all">
                          {pickupPin}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-wider whitespace-nowrap">
                          Awaiting Verification
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Full, Untruncated Instructions */}
                    <div className="pt-1.5 border-t border-slate-800/80">
                      <p className="text-[11.5px] text-slate-300 font-medium leading-relaxed">
                        Show this 6-digit code to <strong className="text-white font-bold">Amaka</strong> in person <span className="text-emerald-400 font-bold">only after</span> inspecting and testing the iPhone.
                      </p>
                    </div>
                  </div>
                )}

                {/* Completed State — Compact Row with Short Headline & Appeal Option */}
                {offerStatus === 'completed' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 bg-[#16A34A] text-white rounded text-[8px] font-black uppercase tracking-wider shrink-0 shadow-xs">
                        TRADE COMPLETED
                      </span>
                      <span className="text-[11.5px] font-extrabold text-emerald-950 truncate">
                        Deal Concluded
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[#16A34A] font-black flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Sealed
                      </span>
                      <span className="text-slate-300 text-xs">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppealSubmitted(false);
                          setShowAppealModal(true);
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-rose-600 transition-colors underline underline-offset-2 flex items-center gap-0.5"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-500 inline" />
                        <span>Appeal</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Safety Advisory Strip — Slowly Moving Marquee Ticker */}
              <div className="bg-slate-100/90 border-b border-slate-200/90 px-3 py-1.5 flex items-center shrink-0 overflow-hidden select-none">
                <div className="flex items-center gap-1 shrink-0 bg-slate-100/95 pr-2.5 z-10 shadow-[4px_0_8px_rgba(241,245,249,1)]">
                  <span className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] rounded text-[8px] font-black uppercase tracking-wider shrink-0">
                    SAFETY TIP
                  </span>
                </div>
                <div className="overflow-hidden relative flex-1 flex items-center">
                  <div className="animate-ticker-slow flex items-center whitespace-nowrap text-[10px] text-slate-600 font-semibold">
                    <span className="inline-block px-4">
                      Meet in daylight at a public place • Inspect items thoroughly before sharing your exchange code • Never release your code before receiving items • Keep all chats on BarterWave •
                    </span>
                    <span className="inline-block px-4">
                      Meet in daylight at a public place • Inspect items thoroughly before sharing your exchange code • Never release your code before receiving items • Keep all chats on BarterWave •
                    </span>
                  </div>
                </div>
              </div>

              {/* Scrollable Live Chat Feed */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                {messages.map((m) => {
                  const isMe = m.sender === 'buyer';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white rounded-br-xs shadow-[0_2px_8px_rgba(37,99,235,0.25)]'
                            : 'bg-white text-[#0F172A] border border-slate-200/90 rounded-bl-xs shadow-[0_1px_3px_rgba(15,23,42,0.06)]'
                        }`}
                      >
                        <p className="font-medium">{m.text}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1 font-semibold">{m.time}</span>
                    </div>
                  );
                })}
                <div ref={buyerChatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="bg-white border-t border-slate-200/90 p-2.5 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={buyerInput}
                  onChange={(e) => setBuyerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage('buyer', buyerInput)}
                  placeholder="Message Amaka..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all font-medium"
                />
                <button
                  onClick={() => handleSendMessage('buyer', buyerInput)}
                  className="p-2.5 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white rounded-xl shadow-[0_2px_8px_rgba(37,99,235,0.3)] transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Home Indicator */}
              <div className="h-5 pb-1 flex items-center justify-center shrink-0">
                <div className="w-32 h-1 bg-slate-300 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* PHONE 2: SELLER (AMAKA)                                     */}
        {/* ========================================================== */}
        <div
          className={`w-full max-w-[414px] flex flex-col items-center ${
            mobileActiveDevice !== 'seller' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2 px-3 text-xs">
            <span className="font-extrabold text-[#4ADE80] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#16A34A] shadow-[0_0_8px_rgba(22,163,74,0.8)]" />
              SELLER DEVICE (Amaka Store)
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-semibold">iPhone 11 Pro Max</span>
          </div>

          {/* Smartphone Hardware Frame */}
          <div className="w-[414px] h-[850px] bg-[#0A0F1D] rounded-[52px] p-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] border-[5px] border-slate-800/90 relative flex flex-col overflow-hidden ring-1 ring-slate-700/50">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center">
              <div className="w-14 h-1 bg-slate-800 rounded-full mb-1" />
              <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-800 ml-2.5 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-900/40" />
              </div>
            </div>

            {/* iOS Screen Display Area */}
            <div className="w-full h-full bg-[#F8FAFC] text-[#0F172A] rounded-[40px] flex flex-col overflow-hidden relative font-sans select-none">
              {/* iOS Status Bar */}
              <div className="h-11 pt-2.5 px-7 flex items-center justify-between text-xs font-black text-slate-900 shrink-0">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold">5G</span>
                  <div className="w-5 h-2.5 border border-slate-900 rounded-xs p-0.5 flex items-center">
                    <div className="w-full h-full bg-slate-900 rounded-xs" />
                  </div>
                </div>
              </div>

              {/* In-App Header */}
              <div className="bg-white border-b border-slate-200/90 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-sm ring-1 ring-blue-400/30">
                    T
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-[#0F172A]">Tunde Adeleke</span>
                      <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] rounded text-[8px] font-black uppercase tracking-wider">
                        TRADER
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight font-medium">Ikeja, Lagos</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 rounded text-[9px] font-black uppercase tracking-wider">
                    SELLER VIEW
                  </span>
                </div>
              </div>

              {/* Trade Stepper */}
              <div className="bg-white border-b border-slate-200/90 px-3.5 py-2 shrink-0">
                <TradeStepper
                  status={offerStatus}
                  isBuyerLocked={isBuyerLocked}
                  isSellerLocked={isSellerLocked}
                />
              </div>

              {/* Deal Status Card / Action Panel */}
              <div className={`bg-white border-b border-slate-200/90 shrink-0 shadow-2xs transition-all ${offerStatus === 'completed' ? 'px-3 py-1.5' : 'p-3 space-y-2'}`}>
                {/* Proposed State: Accept button */}
                {offerStatus === 'proposed' && (
                  <div className="space-y-2.5">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-800 border border-amber-500/30 rounded text-[9px] font-black uppercase tracking-wider">
                          NEW OFFER RECEIVED
                        </span>
                        <span className="text-xs font-black text-[#16A34A]">+₦40,000 Cash</span>
                      </div>
                      <p className="text-xs font-black text-[#0F172A] mt-1">Tunde offered: PS5 Digital Edition</p>
                    </div>
                    <button
                      onClick={handleAcceptOffer}
                      className="w-full py-3 bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_14px_rgba(22,163,74,0.35)] transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                      <span>Accept Offer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Accepted State: Dual Lock */}
                {offerStatus === 'accepted' && (
                  <div className="space-y-2">
                    {isBuyerLocked && !isSellerLocked && (
                      <div className="bg-white border border-amber-200/90 rounded-xl p-2.5 flex items-center gap-2.5 shadow-[0_1px_4px_rgba(245,158,11,0.1)]">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                          <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-[#0F172A]">Tunde committed</span>
                            <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[8px] font-black uppercase tracking-wider">
                              1/2 Locked
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            Lock your side to start safe local meetup
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-[#16A34A] shrink-0">
                          Lock now →
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => handleLockDeal('seller')}
                      disabled={isSellerLocked}
                      className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        isSellerLocked
                          ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 cursor-default font-extrabold shadow-xs'
                          : 'bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white shadow-[0_4px_16px_rgba(22,163,74,0.35)] active:scale-[0.98]'
                      }`}
                    >
                      {isSellerLocked ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                          <span>Deal Locked by You</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 stroke-[2.5]" />
                          <span>Lock Deal (Commit)</span>
                        </>
                      )}
                    </button>
                    {!isSellerLocked ? (
                      <p className="text-[10px] text-slate-400 text-center font-medium">
                        Both parties must lock to initiate local meetup handshake.
                      </p>
                    ) : (
                      <p className="text-[10px] text-emerald-700 text-center font-semibold">
                        Waiting for Tunde to commit and seal the deal...
                      </p>
                    )}
                  </div>
                )}

                {/* Fulfillment State: Input Buyer's PIN (Balanced Micro-Card) */}
                {offerStatus === 'awaiting_fulfillment' && (
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 shadow-xs space-y-2">
                    {/* Top Row: Input & CTA */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          maxLength={6}
                          value={sellerInputPin}
                          onChange={(e) => {
                            setSellerInputPin(e.target.value.replace(/\D/g, ''));
                            setPinError('');
                          }}
                          placeholder="Enter 6-digit PIN"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-center font-mono font-black text-base tracking-[0.25em] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 shadow-inner"
                        />
                      </div>
                      <button
                        onClick={handleVerifySellerPin}
                        disabled={sellerInputPin.length !== 6}
                        className="px-4 py-2.5 bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] disabled:opacity-40 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 shrink-0"
                      >
                        Verify Code
                      </button>
                    </div>

                    {/* Bottom Row: Full Untruncated Instructions & Simulator Autofill */}
                    <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[11.5px] gap-2">
                      {pinError ? (
                        <p className="font-bold text-rose-600 leading-snug">{pinError}</p>
                      ) : (
                        <p className="text-slate-600 font-medium leading-snug">
                          Ask <strong className="text-slate-900 font-bold">Tunde</strong> for their 6-digit code after handing over the item.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setSellerInputPin(pickupPin)}
                        className="text-[#2563EB] hover:text-[#1D4ED8] font-bold shrink-0 hover:underline inline-flex items-center gap-1 text-[11px]"
                      >
                        <Zap className="w-3 h-3 fill-current shrink-0" /> Autofill ({pickupPin})
                      </button>
                    </div>
                  </div>
                )}

                {/* Completed State — Compact Row with Short Headline & Appeal Option */}
                {offerStatus === 'completed' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 bg-[#16A34A] text-white rounded text-[8px] font-black uppercase tracking-wider shrink-0 shadow-xs">
                        SOLD
                      </span>
                      <span className="text-[11.5px] font-extrabold text-emerald-950 truncate">
                        Deal Concluded
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[#16A34A] font-black flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Closed
                      </span>
                      <span className="text-slate-300 text-xs">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppealSubmitted(false);
                          setShowAppealModal(true);
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-rose-600 transition-colors underline underline-offset-2 flex items-center gap-0.5"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-500 inline" />
                        <span>Appeal</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Safety Advisory Strip — Slowly Moving Marquee Ticker */}
              <div className="bg-slate-100/90 border-b border-slate-200/90 px-3 py-1.5 flex items-center shrink-0 overflow-hidden select-none">
                <div className="flex items-center gap-1 shrink-0 bg-slate-100/95 pr-2.5 z-10 shadow-[4px_0_8px_rgba(241,245,249,1)]">
                  <span className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] rounded text-[8px] font-black uppercase tracking-wider shrink-0">
                    SAFETY TIP
                  </span>
                </div>
                <div className="overflow-hidden relative flex-1 flex items-center">
                  <div className="animate-ticker-slow flex items-center whitespace-nowrap text-[10px] text-slate-600 font-semibold">
                    <span className="inline-block px-4">
                      Hand over item only after verifying the 6-digit exchange code • Verify buyer's code in person • Meet in daylight at a public location •
                    </span>
                    <span className="inline-block px-4">
                      Hand over item only after verifying the 6-digit exchange code • Verify buyer's code in person • Meet in daylight at a public location •
                    </span>
                  </div>
                </div>
              </div>

              {/* Scrollable Live Chat Feed */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                {messages.map((m) => {
                  const isMe = m.sender === 'seller';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-gradient-to-r from-[#16A34A] to-[#15803D] text-white rounded-br-xs shadow-[0_2px_8px_rgba(22,163,74,0.25)]'
                            : 'bg-white text-[#0F172A] border border-slate-200/90 rounded-bl-xs shadow-[0_1px_3px_rgba(15,23,42,0.06)]'
                        }`}
                      >
                        <p className="font-medium">{m.text}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1 font-semibold">{m.time}</span>
                    </div>
                  );
                })}
                <div ref={sellerChatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="bg-white border-t border-slate-200/90 p-2.5 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={sellerInput}
                  onChange={(e) => setSellerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage('seller', sellerInput)}
                  placeholder="Message Tunde..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#16A34A] transition-all font-medium"
                />
                <button
                  onClick={() => handleSendMessage('seller', sellerInput)}
                  className="p-2.5 bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white rounded-xl shadow-[0_2px_8px_rgba(22,163,74,0.3)] transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Home Indicator */}
              <div className="h-5 pb-1 flex items-center justify-center shrink-0">
                <div className="w-32 h-1 bg-slate-300 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── LOCK CELEBRATION MODAL OVERLAY ── */}
      {showLockCelebration && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[10060] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(37,99,235,0.4)] animate-bounce">
              <Lock className="w-8 h-8 stroke-[2.5]" />
            </div>
            <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded text-[9px] font-black uppercase tracking-wider inline-block">
              DUAL-CONSENT VERIFIED
            </span>
            <h3 className="text-2xl font-black text-white mt-2.5">Deal Locked!</h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-medium">
              Both Tunde and Amaka have committed. 7-day safe local meetup window initiated with secret exchange code protection!
            </p>
          </div>
        </div>
      )}

      {/* ── TRADE COMPLETED & REVIEW MODAL ── */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[10060] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center text-[#0F172A] shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-400">
            <div className="w-16 h-16 bg-gradient-to-br from-[#22C55E] to-[#16A34A] text-white rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-[0_4px_20px_rgba(34,197,94,0.35)]">
              <Check className="w-9 h-9 stroke-[3]" />
            </div>

            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 rounded text-[9px] font-black uppercase tracking-wider">
              TRADE COMPLETED
            </span>

            <h3 className="text-2xl font-black text-[#0F172A] mt-2 mb-1 tracking-tight">Exchange Successful!</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
              PIN code <strong className="text-[#0F172A] font-mono">{pickupPin}</strong> was matched. The iPhone 13 Pro Max is now marked as <strong className="text-emerald-700">SOLD</strong>.
            </p>

            {/* Star Rating Picker */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 mb-4">
              <p className="text-xs font-bold text-slate-700 mb-2">Rate your trade experience:</p>
              <div className="flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setStarRating(star)}
                    className="p-1 hover:scale-110 transition-transform active:scale-95"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= starRating
                          ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-500 mt-1.5 block font-semibold">5 Stars (Excellent Trade)</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="w-full py-3 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[0_4px_16px_rgba(37,99,235,0.35)] active:scale-[0.98]"
              >
                Submit Review (+10 Trust Rep)
              </button>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}
    
      {/* ── APPEAL / DISPUTE RESOLUTION MODAL ── */}
      {showAppealModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10060] flex items-center justify-center p-4 animate-in fade-in duration-300 select-none">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-[#0F172A] shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowAppealModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!appealSubmitted ? (
              <>
                <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center text-amber-600 mb-3.5 shadow-2xs">
                  <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                </div>

                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-black uppercase tracking-wider">
                  TRUST &amp; SAFETY RECOURSE
                </span>

                <h3 className="text-xl font-black text-[#0F172A] mt-2 mb-1 tracking-tight">
                  Appeal Trade Issue
                </h3>
                <p className="text-xs text-slate-500 mb-3.5 leading-relaxed font-medium">
                  Did something go wrong with this exchange? Select a category or describe your issue in the box below.
                </p>

                {/* Dispute Category Selectors */}
                <div className="space-y-1.5 mb-3 text-xs font-semibold">
                  {[
                    'Item has hidden defects or faults',
                    'Item is counterfeit or misrepresented',
                    'Agreed cash balance was incomplete',
                    'Trader engaged in hostile behavior',
                    'Other dispute issue (specify below)',
                  ].map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-colors ${
                        appealReason === reason
                          ? 'border-amber-500 bg-amber-50/50 text-[#0F172A]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="appealReason"
                        checked={appealReason === reason}
                        onChange={() => setAppealReason(reason)}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-[11px]">{reason}</span>
                    </label>
                  ))}
                </div>

                {/* Custom Dispute / Details Text Area */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                    <span>
                      {appealReason.includes('Other')
                        ? 'Describe your issue (Required):'
                        : 'Additional details & explanation:'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {customDisputeText.length}/500
                    </span>
                  </div>
                  <textarea
                    value={customDisputeText}
                    onChange={(e) => setCustomDisputeText(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder={
                      appealReason.includes('Other')
                        ? 'Please describe the specific issue or problem with this trade...'
                        : 'Add any specific details (e.g., battery degradation, missing charger, undisclosed cracks)...'
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-medium transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <button
                    disabled={appealReason.includes('Other') && !customDisputeText.trim()}
                    onClick={() => setAppealSubmitted(true)}
                    className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 disabled:opacity-40 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    Submit Appeal Ticket
                  </button>
                  <button
                    onClick={() => setShowAppealModal(false)}
                    className="w-full py-2 text-slate-400 hover:text-slate-600 font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-[#16A34A] mx-auto mb-3 shadow-2xs">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="text-xl font-black text-[#0F172A] mb-1.5 tracking-tight">
                  Appeal Submitted!
                </h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-left text-xs">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">
                    Category: <span className="text-[#0F172A]">{appealReason}</span>
                  </p>
                  {customDisputeText && (
                    <p className="text-slate-700 font-medium italic border-t border-slate-200 pt-1.5 mt-1.5">
                      &ldquo;{customDisputeText}&rdquo;
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium mb-5">
                  Ticket <strong className="text-[#0F172A]">#BW-APL-8941</strong> has been created. Reviews and Trust score updates are on hold pending admin review.
                </p>
                <button
                  onClick={() => setShowAppealModal(false)}
                  className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all"
                >
                  Return to Simulator
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
