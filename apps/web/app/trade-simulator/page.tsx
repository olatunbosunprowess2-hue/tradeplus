'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
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
  >('proposed');
  const [isBuyerLocked, setIsBuyerLocked] = useState(false);
  const [isSellerLocked, setIsSellerLocked] = useState(false);
  const [isBuyerFulfilled, setIsBuyerFulfilled] = useState(false);
  const [isSellerFulfilled, setIsSellerFulfilled] = useState(false);

  // The generated 6-digit pickup PIN for the buyer
  const [pickupPin] = useState('749103');
  const [sellerInputPin, setSellerInputPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Modals & Celebrations
  const [showLockCelebration, setShowLockCelebration] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [buyerReviewDone, setBuyerReviewDone] = useState(false);
  const [sellerReviewDone, setSellerReviewDone] = useState(false);
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
    setBuyerReviewDone(false);
    setSellerReviewDone(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-6 px-3 sm:px-6">
      {/* Top Controller Bar */}
      <div className="max-w-7xl mx-auto mb-6 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2 py-0.5 bg-blue-900/60 text-blue-300 border border-blue-700/60 rounded text-[10px] font-bold uppercase tracking-wider">
              DUAL-DEVICE LIVE SIMULATOR
            </span>
            <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 rounded text-[10px] font-bold uppercase tracking-wider">
              IPHONE 11 PRO MAX (414×896)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Gamified P2P Trade & Handshake Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Test the complete buy/sell flow simultaneously without logging into separate devices or accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Stage Shortcuts */}
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Flow</span>
          </button>

          <Link
            href="/preview-payments"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors"
          >
            Payment Modals Studio →
          </Link>
        </div>
      </div>

      {/* Mobile Toggle Bar (Hidden on Large Desktop) */}
      <div className="max-w-7xl mx-auto lg:hidden mb-4 flex items-center justify-center gap-2">
        <button
          onClick={() => setMobileActiveDevice('buyer')}
          className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider border transition-colors ${
            mobileActiveDevice === 'buyer'
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          📱 Buyer View (Tunde)
        </button>
        <button
          onClick={() => setMobileActiveDevice('seller')}
          className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider border transition-colors ${
            mobileActiveDevice === 'seller'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          📱 Seller View (Amaka)
        </button>
      </div>

      {/* ============================================================ */}
      {/* DUAL IPHONE 11 PRO MAX SIDE-BY-SIDE FRAME                    */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 pb-16">
        {/* ========================================================== */}
        {/* PHONE 1: BUYER (TUNDE)                                      */}
        {/* ========================================================== */}
        <div
          className={`w-full max-w-[414px] flex flex-col items-center ${
            mobileActiveDevice !== 'buyer' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2 px-2 text-xs">
            <span className="font-bold text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-xs bg-blue-500" />
              BUYER DEVICE (Tunde)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">iPhone 11 Pro Max</span>
          </div>

          {/* Smartphone Hardware Frame */}
          <div className="w-[414px] h-[820px] bg-black rounded-[48px] p-3 shadow-2xl border-[6px] border-slate-800 relative flex flex-col overflow-hidden ring-1 ring-slate-700/60">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-700 rounded-full mb-1" />
              <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-800 ml-2" />
            </div>

            {/* iOS Screen Display Area */}
            <div className="w-full h-full bg-slate-100 text-slate-900 rounded-[38px] flex flex-col overflow-hidden relative font-sans">
              {/* iOS Status Bar */}
              <div className="h-10 pt-2 px-6 flex items-center justify-between text-xs font-bold text-slate-800 shrink-0 select-none">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">5G</span>
                  <div className="w-5 h-2.5 border border-slate-800 rounded-xs p-0.5 flex items-center">
                    <div className="w-full h-full bg-slate-800 rounded-xs" />
                  </div>
                </div>
              </div>

              {/* In-App Header */}
              <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs">
                    A
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs text-slate-900">Amaka Store</span>
                      <span className="px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[8px] font-bold uppercase">
                        VERIFIED
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block leading-tight">Lekki Phase 1, Lagos</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold uppercase">
                  ACTIVE
                </span>
              </div>

              {/* Trade Stepper (Accepted ➔ Locked ➔ Exchange ➔ Done) */}
              <div className="bg-white border-b border-slate-200 px-3 py-1.5 shrink-0">
                <TradeStepper
                  status={offerStatus}
                  isBuyerLocked={isBuyerLocked}
                  isSellerLocked={isSellerLocked}
                />
              </div>

              {/* Deal Status Card / Action Panel */}
              <div className="bg-white border-b border-slate-200 p-3 shrink-0 space-y-2">
                {/* Proposed State */}
                {offerStatus === 'proposed' && (
                  <div className="bg-slate-50 border border-slate-200 rounded p-2 text-center">
                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold uppercase">
                      OFFER PROPOSED
                    </span>
                    <p className="text-[11px] font-bold text-slate-800 mt-1">
                      PS5 Digital + ₦40,000 for iPhone 13 Pro Max
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Waiting for seller Amaka to review & accept.</p>
                  </div>
                )}

                {/* Accepted State: Dual Lock */}
                {offerStatus === 'accepted' && (
                  <div className="space-y-2">
                    {isSellerLocked && !isBuyerLocked && (
                      <div className="bg-orange-50 border border-orange-200 rounded px-2.5 py-1.5 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded text-[9px] font-bold uppercase">
                          WAITING
                        </span>
                        <p className="text-[10px] text-orange-800 font-bold">Amaka has locked — waiting for you!</p>
                      </div>
                    )}
                    <button
                      onClick={() => handleLockDeal('buyer')}
                      disabled={isBuyerLocked}
                      className={`w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                        isBuyerLocked
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      }`}
                    >
                      {isBuyerLocked ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Deal Locked by You</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Lock Deal (Commit)</span>
                        </>
                      )}
                    </button>
                    {!isBuyerLocked && (
                      <p className="text-[10px] text-slate-400 text-center">
                        Both parties must lock to initiate local meetup.
                      </p>
                    )}
                  </div>
                )}

                {/* Fulfillment State: Show Buyer their secret 6-Digit PIN */}
                {offerStatus === 'awaiting_fulfillment' && (
                  <div className="space-y-2">
                    <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-center">
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-bold uppercase tracking-wider">
                        YOUR 6-DIGIT EXCHANGE CODE
                      </span>
                      <p className="text-2xl font-mono font-black tracking-widest text-slate-900 my-1 select-all">
                        {pickupPin}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Give this secret PIN to Amaka only after inspecting and testing the iPhone in person!
                      </p>
                    </div>

                    {isBuyerFulfilled ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded py-1.5 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>You confirmed exchange</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleManualConfirm('buyer')}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs uppercase tracking-wider"
                      >
                        Confirm Exchange (Manual)
                      </button>
                    )}
                  </div>
                )}

                {/* Completed State */}
                {offerStatus === 'completed' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-center">
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold uppercase">
                      TRADE COMPLETED
                    </span>
                    <p className="text-xs font-bold text-emerald-900 mt-1">Item successfully exchanged!</p>
                  </div>
                )}
              </div>

              {/* Safety Advisory Strip */}
              <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center gap-1.5 shrink-0">
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[8px] font-bold uppercase shrink-0">
                  SAFETY
                </span>
                <p className="text-[10px] text-slate-500 truncate">
                  Meet in daylight at a public place. Inspect items thoroughly.
                </p>
              </div>

              {/* Scrollable Live Chat Feed */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {messages.map((m) => {
                  const isMe = m.sender === 'buyer';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[78%] px-3 py-2 rounded-lg text-xs shadow-2xs ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p>{m.text}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 px-1">{m.time}</span>
                    </div>
                  );
                })}
                <div ref={buyerChatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="bg-white border-t border-slate-200 p-2 flex items-center gap-1.5 shrink-0">
                <input
                  type="text"
                  value={buyerInput}
                  onChange={(e) => setBuyerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage('buyer', buyerInput)}
                  placeholder="Message Amaka..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <button
                  onClick={() => handleSendMessage('buyer', buyerInput)}
                  className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Home Indicator */}
              <div className="h-4 pb-1 flex items-center justify-center shrink-0">
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
          <div className="flex items-center justify-between w-full mb-2 px-2 text-xs">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-xs bg-emerald-500" />
              SELLER DEVICE (Amaka)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">iPhone 11 Pro Max</span>
          </div>

          {/* Smartphone Hardware Frame */}
          <div className="w-[414px] h-[820px] bg-black rounded-[48px] p-3 shadow-2xl border-[6px] border-slate-800 relative flex flex-col overflow-hidden ring-1 ring-slate-700/60">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-700 rounded-full mb-1" />
              <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-800 ml-2" />
            </div>

            {/* iOS Screen Display Area */}
            <div className="w-full h-full bg-slate-100 text-slate-900 rounded-[38px] flex flex-col overflow-hidden relative font-sans">
              {/* iOS Status Bar */}
              <div className="h-10 pt-2 px-6 flex items-center justify-between text-xs font-bold text-slate-800 shrink-0 select-none">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">5G</span>
                  <div className="w-5 h-2.5 border border-slate-800 rounded-xs p-0.5 flex items-center">
                    <div className="w-full h-full bg-slate-800 rounded-xs" />
                  </div>
                </div>
              </div>

              {/* In-App Header */}
              <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800 font-bold text-xs">
                    T
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs text-slate-900">Tunde Adeleke</span>
                      <span className="px-1 py-0.2 bg-blue-100 text-blue-800 rounded text-[8px] font-bold uppercase">
                        TRADER
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block leading-tight">Ikeja, Lagos</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold uppercase">
                  SELLER VIEW
                </span>
              </div>

              {/* Trade Stepper */}
              <div className="bg-white border-b border-slate-200 px-3 py-1.5 shrink-0">
                <TradeStepper
                  status={offerStatus}
                  isBuyerLocked={isBuyerLocked}
                  isSellerLocked={isSellerLocked}
                />
              </div>

              {/* Deal Status Card / Action Panel */}
              <div className="bg-white border-b border-slate-200 p-3 shrink-0 space-y-2">
                {/* Proposed State: Accept button */}
                {offerStatus === 'proposed' && (
                  <div className="space-y-2">
                    <div className="bg-slate-50 border border-slate-200 rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold uppercase">
                          NEW OFFER RECEIVED
                        </span>
                        <span className="text-[10px] font-bold text-slate-700">+₦40,000 Cash</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800">Tunde offered: PS5 Digital Edition</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAcceptOffer}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs uppercase tracking-wider shadow-xs"
                      >
                        Accept Offer
                      </button>
                    </div>
                  </div>
                )}

                {/* Accepted State: Dual Lock */}
                {offerStatus === 'accepted' && (
                  <div className="space-y-2">
                    {isBuyerLocked && !isSellerLocked && (
                      <div className="bg-orange-50 border border-orange-200 rounded px-2.5 py-1.5 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded text-[9px] font-bold uppercase">
                          WAITING
                        </span>
                        <p className="text-[10px] text-orange-800 font-bold">Tunde has locked — waiting for you!</p>
                      </div>
                    )}
                    <button
                      onClick={() => handleLockDeal('seller')}
                      disabled={isSellerLocked}
                      className={`w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                        isSellerLocked
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      {isSellerLocked ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Deal Locked by You</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Lock Deal (Commit)</span>
                        </>
                      )}
                    </button>
                    {!isSellerLocked && (
                      <p className="text-[10px] text-slate-400 text-center">
                        Both parties must lock to initiate local meetup.
                      </p>
                    )}
                  </div>
                )}

                {/* Fulfillment State: Input Buyer's PIN */}
                {offerStatus === 'awaiting_fulfillment' && (
                  <div className="space-y-2">
                    <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-800">
                          Enter Tunde&apos;s 6-Digit PIN:
                        </span>
                        <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[8px] font-bold uppercase">
                          INSTANT
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={sellerInputPin}
                          onChange={(e) => {
                            setSellerInputPin(e.target.value.replace(/\D/g, ''));
                            setPinError('');
                          }}
                          placeholder="e.g. 749103"
                          className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-center font-mono font-bold text-sm tracking-widest text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          onClick={handleVerifySellerPin}
                          disabled={sellerInputPin.length !== 6}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded font-bold text-xs uppercase transition-colors"
                        >
                          Verify
                        </button>
                      </div>
                      {pinError && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1">{pinError}</p>
                      )}
                      <button
                        onClick={() => setSellerInputPin(pickupPin)}
                        className="text-[10px] text-blue-600 hover:underline mt-1 font-semibold block text-left"
                      >
                        ⚡ Autofill Buyer&apos;s PIN ({pickupPin})
                      </button>
                    </div>

                    {isSellerFulfilled ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded py-1.5 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Exchange Verified</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleManualConfirm('seller')}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px]"
                      >
                        Manual Confirm Exchange
                      </button>
                    )}
                  </div>
                )}

                {/* Completed State */}
                {offerStatus === 'completed' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-center">
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold uppercase">
                      SOLD / COMPLETED
                    </span>
                    <p className="text-xs font-bold text-emerald-900 mt-1">Listing marked as SOLD in database.</p>
                  </div>
                )}
              </div>

              {/* Safety Advisory Strip */}
              <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center gap-1.5 shrink-0">
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[8px] font-bold uppercase shrink-0">
                  SAFETY
                </span>
                <p className="text-[10px] text-slate-500 truncate">
                  Hand over item only after verifying the exchange code.
                </p>
              </div>

              {/* Scrollable Live Chat Feed */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {messages.map((m) => {
                  const isMe = m.sender === 'seller';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[78%] px-3 py-2 rounded-lg text-xs shadow-2xs ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p>{m.text}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 px-1">{m.time}</span>
                    </div>
                  );
                })}
                <div ref={sellerChatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="bg-white border-t border-slate-200 p-2 flex items-center gap-1.5 shrink-0">
                <input
                  type="text"
                  value={sellerInput}
                  onChange={(e) => setSellerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage('seller', sellerInput)}
                  placeholder="Message Tunde..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <button
                  onClick={() => handleSendMessage('seller', sellerInput)}
                  className="p-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Home Indicator */}
              <div className="h-4 pb-1 flex items-center justify-center shrink-0">
                <div className="w-32 h-1 bg-slate-300 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* LOCK CELEBRATION MODAL OVERLAY                               */}
      {/* ============================================================ */}
      {showLockCelebration && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10060] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Lock className="w-8 h-8" />
            </div>
            <span className="px-2 py-0.5 bg-blue-900 text-blue-300 rounded text-[9px] font-bold uppercase tracking-wider">
              DUAL-CONSENT VERIFIED
            </span>
            <h3 className="text-xl font-black text-white mt-2">Deal Locked!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Both Tunde and Amaka have committed. 7-day local meetup window initiated!
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TRADE COMPLETED & REVIEW MODAL                                */}
      {/* ============================================================ */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[10060] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center text-slate-900 shadow-2xl border border-slate-200">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold uppercase tracking-wider">
              TRADE COMPLETE
            </span>

            <h3 className="text-xl font-black text-slate-900 mt-2 mb-1">Exchange Successful!</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              PIN code <strong>{pickupPin}</strong> was matched. The iPhone 13 Pro Max is now marked as <strong>SOLD</strong>.
            </p>

            {/* Star Rating Picker */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
              <p className="text-[11px] font-bold text-slate-700 mb-2">Rate your trade experience:</p>
              <div className="flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setStarRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= starRating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">5 Stars (Excellent Trade)</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setBuyerReviewDone(true);
                  setSellerReviewDone(true);
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
              >
                Submit Review (+10 Trust Rep)
              </button>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs transition-colors"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
