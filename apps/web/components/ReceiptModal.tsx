'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BarterOffer } from '@/lib/types';
import { format } from 'date-fns';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    offer: BarterOffer;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, offer }) => {
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const handleDownload = async () => {
        if (!receiptRef.current) return;

        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Receipt-${offer.receiptNumber}.pdf`);
        } catch (error) {
            console.error('Error generating receipt:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 bg-white/80 rounded-full"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Receipt Content */}
                <div ref={receiptRef} className="relative bg-white p-6 pb-12">
                    {/* Scalloped Edges (Top) */}
                    <div className="absolute top-0 left-0 right-0 h-4 bg-white" style={{
                        maskImage: 'radial-gradient(circle at 10px 0, transparent 0, transparent 10px, black 11px)',
                        maskSize: '20px 10px',
                        maskRepeat: 'repeat-x',
                        WebkitMaskImage: 'radial-gradient(circle at 10px 0, transparent 0, transparent 10px, black 11px)',
                        WebkitMaskSize: '20px 10px',
                        WebkitMaskRepeat: 'repeat-x',
                        transform: 'rotate(180deg)'
                    }}></div>

                    {/* Watermark */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03] z-0 flex flex-wrap content-center justify-center gap-8 rotate-[-15deg]">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className="text-4xl font-bold text-gray-900 whitespace-nowrap">BarterWave</div>
                        ))}
                    </div>

                    <div className="relative z-10 space-y-6 mt-4">
                        {/* Header */}
                        <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    B
                                </div>
                                <span className="font-bold text-xl text-gray-900">BarterWave</span>
                            </div>
                            <span className="text-sm font-medium text-gray-500">Transaction Receipt</span>
                        </div>

                        {/* Status */}
                        <div className="text-center py-4">
                            <h2 className="text-3xl font-bold text-green-600 mb-1">Trade Successful</h2>
                            <p className="text-sm text-gray-500">
                                {offer.receiptGeneratedAt ? format(new Date(offer.receiptGeneratedAt), 'MMM do, yyyy HH:mm:ss') : 'Date N/A'}
                            </p>
                        </div>

                        {/* Dashed Divider */}
                        <div className="border-t border-dashed border-gray-300 my-4"></div>

                        {/* Details */}
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Recipient (Buyer)</span>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">{offer.buyer.profile?.displayName || offer.buyer.email}</p>
                                    <p className="text-xs text-gray-500">{offer.buyer.id.slice(0, 8)}...</p>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Sender (Seller)</span>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">{offer.seller.profile?.displayName || offer.seller.email}</p>
                                    <p className="text-xs text-gray-500">{offer.seller.id.slice(0, 8)}...</p>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Items Swapped</span>
                                <div className="text-right max-w-[60%]">
                                    <p className="font-medium text-gray-900">{offer.listing.title}</p>
                                    {offer.items.map(item => (
                                        <p key={item.id} className="text-xs text-gray-600">+ {item.offeredListing.title}</p>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Dashed Divider */}
                        <div className="border-t border-dashed border-gray-300 my-4"></div>

                        {/* Transaction Info */}
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Receipt No.</span>
                                <span className="font-mono text-gray-900">{offer.receiptNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Session ID</span>
                                <span className="font-mono text-gray-900 text-xs">{offer.id}</span>
                            </div>
                        </div>

                        {/* Footer / QR */}
                        <div className="mt-8 pt-6 border-t border-dashed border-gray-300 text-center">
                            <div className="flex justify-center mb-4">
                                <QRCodeSVG
                                    value={`https://barterwave.com/verify/${offer.receiptNumber}`}
                                    size={80}
                                    level="M"
                                    fgColor="#000000"
                                    bgColor="#ffffff"
                                />
                            </div>
                            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                                Enjoy a scam-free trade with BarterWave. This receipt confirms that both parties have successfully exchanged items.
                            </p>
                        </div>
                    </div>

                    {/* Scalloped Edges (Bottom) */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-white" style={{
                        maskImage: 'radial-gradient(circle at 10px 10px, transparent 0, transparent 10px, black 11px)',
                        maskSize: '20px 10px',
                        maskRepeat: 'repeat-x',
                        WebkitMaskImage: 'radial-gradient(circle at 10px 10px, transparent 0, transparent 10px, black 11px)',
                        WebkitMaskSize: '20px 10px',
                        WebkitMaskRepeat: 'repeat-x',
                    }}></div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 p-4 flex gap-3 justify-center border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
