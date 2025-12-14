'use client';

import { useState } from 'react';
import { useWantsStore, TradeMethod, Condition } from '@/lib/wants-store';

interface AddWantModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddWantModal({ isOpen, onClose }: AddWantModalProps) {
    const addItem = useWantsStore((state) => state.addItem);
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        tradeMethod: 'both' as TradeMethod,
        condition: 'any' as Condition,
        country: '',
        state: '',
        notes: '',
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addItem({
            title: formData.title,
            category: formData.category,
            tradeMethod: formData.tradeMethod,
            condition: formData.condition,
            country: formData.country,
            state: formData.state,
            notes: formData.notes,
        });
        onClose();
        setFormData({
            title: '',
            category: '',
            tradeMethod: 'both',
            condition: 'any',
            country: '',
            state: '',
            notes: '',
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="text-2xl">✨</span> Add New Want
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Item Name</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. iPhone 14 Pro"
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-gray-900 placeholder:text-gray-500 font-medium transition-colors"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Category</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-base text-gray-900 font-medium bg-white transition-colors cursor-pointer"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="" className="text-gray-500">Select Category...</option>
                                    <option value="Vehicles">Vehicles</option>
                                    <option value="Property">Property</option>
                                    <option value="Mobile Phones & Tablets">Mobile Phones & Tablets</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Home, Furniture & Appliances">Home, Furniture & Appliances</option>
                                    <option value="Fashion">Fashion</option>
                                    <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                                    <option value="Services">Services</option>
                                    <option value="Repair & Construction">Repair & Construction</option>
                                    <option value="Commercial Equipment & Tools">Commercial Equipment & Tools</option>
                                    <option value="Babies & Kids">Babies & Kids</option>
                                    <option value="Food, Agriculture & Farming">Food, Agriculture & Farming</option>
                                    <option value="Animals & Pets">Animals & Pets</option>
                                    <option value="Jobs">Jobs</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Condition</label>
                                <select
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-base text-gray-900 font-medium bg-white transition-colors cursor-pointer"
                                    value={formData.condition}
                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as Condition })}
                                >
                                    <option value="any">Any Condition</option>
                                    <option value="new">New</option>
                                    <option value="used">Used</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Country</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-base text-gray-900 font-medium bg-white transition-colors cursor-pointer"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                >
                                    <option value="">Select Country...</option>
                                    <option value="Nigeria">Nigeria</option>
                                    <option value="Ghana">Ghana</option>
                                    <option value="Kenya">Kenya</option>
                                    <option value="South Africa">South Africa</option>
                                    <option value="Egypt">Egypt</option>
                                    <option value="Tanzania">Tanzania</option>
                                    <option value="Ethiopia">Ethiopia</option>
                                    <option value="Rwanda">Rwanda</option>
                                    <option value="Uganda">Uganda</option>
                                    <option value="Cameroon">Cameroon</option>
                                    <option value="Ivory Coast">Ivory Coast</option>
                                    <option value="Senegal">Senegal</option>
                                    <option value="Morocco">Morocco</option>
                                    <option value="Algeria">Algeria</option>
                                    <option value="Tunisia">Tunisia</option>
                                    <option value="Botswana">Botswana</option>
                                    <option value="Zambia">Zambia</option>
                                    <option value="Zimbabwe">Zimbabwe</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-1.5">State/Region</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Lagos"
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-gray-900 placeholder:text-gray-500 font-medium transition-colors"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Preferred Trade Method</label>
                            <div className="flex gap-2">
                                {(['cash', 'barter', 'both'] as const).map((method) => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tradeMethod: method })}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${formData.tradeMethod === method
                                            ? 'bg-blue-50 border-blue-600 text-blue-800'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {method === 'both' ? 'Both' : method.charAt(0).toUpperCase() + method.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Notes (Optional)</label>
                            <textarea
                                placeholder="Specific color, storage size, max price..."
                                rows={3}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-gray-900 placeholder:text-gray-500 font-medium resize-none transition-colors"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Add to Wants List
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
