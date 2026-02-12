'use client';

interface HomeTabsProps {
    activeTab: 'market' | 'community';
    onTabChange: (tab: 'market' | 'community') => void;
}

export default function HomeTabs({ activeTab, onTabChange }: HomeTabsProps) {
    return (
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
                onClick={() => onTabChange('market')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'market'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                    }`}
            >
                Market Feed
            </button>
            <button
                onClick={() => onTabChange('community')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'community'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                    }`}
            >
                Community Feed
            </button>
        </div>
    );
}
