'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMessagesStore } from '@/lib/messages-store';
import { useAuthStore } from '@/lib/auth-store';
import { messagesApi } from '@/lib/messages-api';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import Image from 'next/image';
import ReportModal from '@/components/ReportModal';
import { ChatLimitModal, FirstChatModal } from '@/components/PaywallModal';
import { checkChatLimit, initializePayment, redirectToPaystack } from '@/lib/payments-api';
import toast from 'react-hot-toast';

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const participantId = params.userId as string;
    const { user } = useAuthStore();
    const currentUserId = user?.id;

    const conversations = useMessagesStore(s => s.conversations);
    const messages = useMessagesStore(s => s.messages);
    const fetchConversations = useMessagesStore(s => s.fetchConversations);
    const fetchMessages = useMessagesStore(s => s.fetchMessages);
    const sendMessage = useMessagesStore(s => s.sendMessage);
    const markAsRead = useMessagesStore(s => s.markAsRead);
    const isLoading = useMessagesStore(s => s.isLoading);

    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [conversationData, setConversationData] = useState<any>(null);
    const [isLoadingConversation, setIsLoadingConversation] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showChatLimitModal, setShowChatLimitModal] = useState(false);
    const [showFirstChatModal, setShowFirstChatModal] = useState(false);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    // Find conversation with this participant
    const conversation = conversations.find(c => c.participantId === participantId) || conversationData;
    const conversationId = conversation?.id;

    // Fetch conversation data directly if not in store
    useEffect(() => {
        const loadConversation = async () => {
            setIsLoadingConversation(true);
            try {
                // First try to find in existing store
                const existingConv = conversations.find(c => c.participantId === participantId);
                if (existingConv) {
                    setIsLoadingConversation(false);
                    return;
                }

                // If not in store, fetch all conversations first
                await fetchConversations();

                // Check again
                const refreshedConv = useMessagesStore.getState().conversations.find(c => c.participantId === participantId);
                if (!refreshedConv) {
                    const conv = await messagesApi.getConversationByParticipant(participantId);
                    if (conv) {
                        setConversationData(conv);
                    }
                }
            } catch (error) {
                console.error('Failed to load conversation:', error);
            } finally {
                setIsLoadingConversation(false);
            }
        };

        loadConversation();
    }, [participantId]); // Remove conversations.length to avoid re-triggering on every list update

    useEffect(() => {
        if (conversationId && !conversationId.startsWith('temp-')) {
            // Only fetch on mount or when conversation identity changes
            fetchMessages(conversationId);

            // Initial mark as read
            markAsRead(conversationId);

            // Re-check safety modal (best-effort)
            const hasShownModal = localStorage.getItem(`first_chat_${participantId}`);
            if (!hasShownModal) {
                setShowFirstChatModal(true);
                localStorage.setItem(`first_chat_${participantId}`, 'true');
            }
        }
    }, [conversationId, fetchMessages, markAsRead, participantId]); // Stabilized dependencies

    // Mark as read when new messages arrive (efficiently)
    useEffect(() => {
        if (!conversationId || conversationId.startsWith('temp-')) return;

        const hasUnread = messages.some(m => !m.read && m.senderId !== currentUserId);
        if (hasUnread) {
            markAsRead(conversationId);
        }
    }, [conversationId, messages, markAsRead, currentUserId]);

    // Polling for new messages every 5 seconds
    useEffect(() => {
        if (!conversationId || conversationId.startsWith('temp-')) return;

        const interval = setInterval(() => {
            fetchMessages(conversationId);
        }, 5000);

        return () => clearInterval(interval);
    }, [conversationId, fetchMessages]);

    // WebSocket Heartbeat & Activity
    useEffect(() => {
        if (!currentUserId) return;

        const socketUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api').replace('/api', '');
        const socket = io(`${socketUrl}/activity`, {
            transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join', currentUserId);
        });

        // Heartbeat every 30s
        const heartbeatInterval = setInterval(() => {
            if (socket.connected) {
                socket.emit('heartbeat', { userId: currentUserId });
            }
        }, 30000);

        return () => {
            clearInterval(heartbeatInterval);
            socket.disconnect();
        };
    }, [currentUserId]);

    const isOnline = (lastActiveAt?: string) => {
        if (!lastActiveAt) return false;
        const lastActive = new Date(lastActiveAt).getTime();
        const now = Date.now();
        return now - lastActive < 2 * 60 * 1000; // 2 minutes window
    };

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages.length]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('File is too large (max 10MB)');
                return;
            }
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setFilePreview(url);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        if (filePreview) URL.revokeObjectURL(filePreview);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!messageText.trim() && !selectedFile) || isSending) return;

        const currentText = messageText.trim();
        const currentFile = selectedFile;

        // Check chat limit before sending (new conversations)
        if (!conversationId || conversationId.startsWith('temp-')) {
            try {
                const limitStatus = await checkChatLimit();
                if (!limitStatus.allowed) {
                    setShowChatLimitModal(true);
                    return;
                }
            } catch (error) {
                console.error('Failed to check chat limit:', error);
            }
        }

        // Optimistic UI: Clear input immediately
        setMessageText('');
        clearFile();
        setIsSending(true);

        try {
            await sendMessage(participantId, currentText, undefined, currentFile || undefined);
            // No need to manually refetch or delay as store handles it now
        } catch (error) {
            console.error('Failed to send message:', error);
            // Put text back on failure so user doesn't lose it
            setMessageText(currentText);
            setSelectedFile(currentFile);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleChatPaywallSelect = async (optionId: string, currency: 'NGN' | 'USD') => {
        setIsPaymentLoading(true);
        try {
            const result = await initializePayment(optionId as any, undefined, currency);
            redirectToPaystack(result.authorizationUrl);
        } catch (error) {
            console.error('Payment initialization failed:', error);
            toast.error('Failed to initialize payment. Please try again.');
        } finally {
            setIsPaymentLoading(false);
        }
    };

    const getTimeDisplay = (timestamp: any) => {
        if (!timestamp || isNaN(new Date(timestamp).getTime())) return 'Just now';

        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        if (isYesterday) {
            return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    // Loading state
    if ((isLoading || isLoadingConversation) && !conversation && conversations.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading conversation...</p>
                </div>
            </div>
        );
    }

    // No conversation found - show option to start one
    if (!conversation && !isLoading && !isLoadingConversation) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md px-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">💬</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Start a New Conversation</h2>
                    <p className="text-gray-600 mb-6">
                        You haven't chatted with this user yet. Start a conversation from a listing or an accepted offer.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                        >
                            Go Back
                        </button>
                        <Link
                            href="/listings"
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
                        >
                            Browse Listings
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!conversation) return null;

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm sticky top-0 z-10">
                <div className="container mx-auto max-w-4xl flex items-center gap-3">
                    <button
                        onClick={() => router.push('/messages')}
                        className="text-gray-600 hover:text-gray-900 transition p-1 -ml-1"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {conversation.participantAvatar ? (
                        <Image
                            src={conversation.participantAvatar}
                            alt={conversation.participantName}
                            width={44}
                            height={44}
                            className="rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                    ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                            {conversation.participantName?.charAt(0) || '?'}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-gray-900 truncate">{conversation.participantName}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-2 h-2 rounded-full ${isOnline(conversation.participantLastActiveAt) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`}></span>
                            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                                {isOnline(conversation.participantLastActiveAt) ? 'Online Now' : 'Offline'}
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    {conversation.barterOffer?.status === 'accepted' && (
                        <Link
                            href="/offers"
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200 hover:bg-green-100 transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Trade Active
                        </Link>
                    )}

                    <button
                        onClick={() => setShowReportModal(true)}
                        className="p-2 text-gray-400 hover:text-red-500 transition"
                        title="Report User"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Listing Context Card */}
            {conversation.listingContext && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-4 py-2">
                    <div className="container mx-auto max-w-4xl">
                        <Link
                            href={`/listings/${conversation.listingContext.id}`}
                            className="flex items-center gap-3 hover:bg-white/50 rounded-lg p-2 -m-2 transition"
                        >
                            {conversation.listingContext.image && (
                                <Image
                                    src={conversation.listingContext.image}
                                    alt={conversation.listingContext.title}
                                    width={40}
                                    height={40}
                                    className="rounded-lg object-cover ring-1 ring-blue-200"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-blue-700 mb-0.5">📦 About this listing:</p>
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {conversation.listingContext.title}
                                </p>
                            </div>
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
                <div className="container mx-auto max-w-4xl space-y-3">
                    {/* Safety Banner replaced by system message */}

                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">👋</span>
                            </div>
                            <p className="text-gray-600 font-medium">Say hello to start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((message, index) => {
                            const isOwn = message.senderId === currentUserId;
                            const isSystemMessage = message.type === 'system';
                            const showTimestamp = index === 0 ||
                                (messages[index - 1].timestamp && message.timestamp &&
                                    messages[index - 1].timestamp < message.timestamp - 5 * 60 * 1000);

                            // System message (special styling)
                            if (isSystemMessage) {
                                return (
                                    <div key={message.id} className="flex justify-center my-4">
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full px-4 py-2 max-w-sm">
                                            <p className="text-sm text-green-800 text-center font-medium">
                                                {message.content}
                                            </p>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={message.id}>
                                    {showTimestamp && (
                                        <div className="text-center my-4">
                                            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                                                {getTimeDisplay(message.timestamp)}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${isOwn
                                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md'
                                                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                                                }`}
                                        >
                                            {message.mediaUrl && message.mediaType === 'image' && (
                                                <div className="mb-2 -mx-2 -mt-2">
                                                    <img src={message.mediaUrl} alt="Attachment" className="rounded-lg max-w-full h-auto object-cover" style={{ maxHeight: '200px' }} />
                                                </div>
                                            )}
                                            {message.mediaUrl && message.mediaType === 'video' && (
                                                <div className="mb-2 -mx-2 -mt-2">
                                                    <video src={message.mediaUrl} controls className="rounded-lg max-w-full h-auto" style={{ maxHeight: '200px' }} />
                                                </div>
                                            )}
                                            {message.content && (
                                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                                    {message.content}
                                                </p>
                                            )}
                                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                                                <p className={`text-[10px] ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {getTimeDisplay(message.timestamp)}
                                                </p>
                                                {isOwn && (
                                                    <div className="flex items-center gap-1">
                                                        <svg className={`w-3 h-3 ${message.read ? 'text-blue-200' : 'text-blue-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        {message.read && user?.tier === 'premium' && message.readAt && (
                                                            <span className="text-[9px] text-blue-100 font-medium">
                                                                Seen {new Date(message.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Quick Replies for New Conversations */}
            {messages.length === 0 && (
                <div className="bg-white border-t border-gray-200 px-4 py-3">
                    <div className="container mx-auto max-w-4xl">
                        <p className="text-xs text-gray-500 mb-2 font-medium">Quick replies:</p>
                        <div className="flex flex-wrap gap-2">
                            {['Hi! Is this still available?', 'What condition is it in?', 'Can we meet up?', 'Thanks for accepting! 🎉'].map((reply) => (
                                <button
                                    key={reply}
                                    onClick={() => setMessageText(reply)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition"
                                >
                                    {reply}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Input Overlay for Files */}
            <div className="bg-white border-t border-gray-100 px-4 py-3 pb-safe shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.05)]">
                <div className="container mx-auto max-w-4xl">
                    <form onSubmit={handleSend} className="flex gap-2 items-end">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200 active:scale-90"
                            title="Attach image or video"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>

                        <div className="flex-1 relative">
                            {filePreview && (
                                <div className="absolute bottom-full left-0 mb-4 p-2 bg-white rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 z-20">
                                    {selectedFile?.type.startsWith('image/') ? (
                                        <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-xl shadow-inner" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                                            <span className="text-2xl">🎥</span>
                                        </div>
                                    )}
                                    <div className="flex-1 pr-10">
                                        <p className="text-[11px] font-bold text-gray-900 truncate max-w-[150px]">{selectedFile?.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-medium tracking-tight">
                                            {(selectedFile?.size || 0) / 1024 < 1024 ? `${((selectedFile?.size || 0) / 1024).toFixed(1)} KB` : `${((selectedFile?.size || 0) / (1024 * 1024)).toFixed(1)} MB`}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearFile}
                                        className="absolute top-2 right-2 bg-gray-100 text-gray-500 rounded-full p-1.5 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            <textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                                placeholder="Type a message..."
                                rows={1}
                                className="w-full px-4 py-3 bg-gray-50/80 border-2 border-transparent rounded-2xl focus:bg-white focus:ring-0 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 font-medium transition-all duration-200 resize-none shadow-inner text-sm md:text-base"
                                style={{ minHeight: '48px', maxHeight: '160px' }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={(!messageText.trim() && !filePreview) || isSending}
                            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 shadow-lg active:scale-95 ${(!messageText.trim() && !filePreview) || isSending
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/25 hover:scale-110'
                                }`}
                        >
                            {isSending ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-6 h-6 transform translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                reportedUserId={participantId}
                listingId={conversation.listingContext?.id}
            />

            <ChatLimitModal
                isOpen={showChatLimitModal}
                onClose={() => setShowChatLimitModal(false)}
                onSelectOption={handleChatPaywallSelect}
                isLoading={isPaymentLoading}
            />
            <FirstChatModal
                isOpen={showFirstChatModal}
                onClose={() => setShowFirstChatModal(false)}
            />
        </div>
    );
}
