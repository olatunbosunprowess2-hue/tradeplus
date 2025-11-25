import { WantItem } from '@/lib/wants-store';

interface PublicWantCardProps {
    item: WantItem;
}

export default function PublicWantCard({ item }: PublicWantCardProps) {
    const methodColors = {
        cash: 'bg-green-100 text-green-800 border-green-200',
        barter: 'bg-purple-100 text-purple-800 border-purple-200',
        both: 'bg-blue-100 text-blue-800 border-blue-200',
    };

    return (
        <div
            className={`relative p-4 rounded-lg shadow-sm border transition-all duration-300 hover:shadow-md ${item.isFulfilled ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-yellow-50 border-yellow-100'
                }`}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className={`font-bold text-lg text-gray-800 ${item.isFulfilled ? 'line-through text-gray-500' : ''}`}>
                    {item.title}
                </h3>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-xs px-2 py-1 rounded-full border font-medium ${methodColors[item.tradeMethod]} flex items-center gap-1`}>
                    {item.tradeMethod === 'barter' && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7H4m0 0l4-4m-4 4l4 4m0 6h12m0 0l-4 4m4-4l-4-4" />
                        </svg>
                    )}
                    {item.tradeMethod === 'both' ? 'Cash & Barter' : item.tradeMethod.charAt(0).toUpperCase() + item.tradeMethod.slice(1)}
                </span>
                <span className="text-xs px-2 py-1 rounded-full border bg-white border-gray-200 text-gray-600">
                    {item.condition === 'any' ? 'Any Condition' : item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                </span>
                <span className="text-xs px-2 py-1 rounded-full border bg-white border-gray-200 text-gray-600">
                    {item.category}
                </span>
                {item.state && item.country && (
                    <span className="text-xs px-2 py-1 rounded-full border bg-blue-50 border-blue-200 text-blue-800 font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {item.state}, {item.country}
                    </span>
                )}
            </div>

            {item.notes && (
                <p className="text-sm text-gray-600 mb-4 font-handwriting leading-relaxed">
                    {item.notes}
                </p>
            )}

            {item.isFulfilled && (
                <div className="mt-auto pt-3 border-t border-black/5 flex items-center">
                    <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                        <div className="w-5 h-5 rounded border border-green-500 bg-green-500 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        Fulfilled
                    </span>
                </div>
            )}
        </div>
    );
}
