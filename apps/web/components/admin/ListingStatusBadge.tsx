import React from 'react';

interface ListingStatusBadgeProps {
    status: string;
}

export default function ListingStatusBadge({ status }: ListingStatusBadgeProps) {
    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'sold':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'suspended':
            case 'flagged':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <span
            className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusStyles(
                status
            )} capitalize`}
        >
            {status}
        </span>
    );
}
