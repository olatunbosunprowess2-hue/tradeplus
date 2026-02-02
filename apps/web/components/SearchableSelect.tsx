'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

interface Option {
    id: string | number;
    name: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number | undefined;
    onChange: (value: string | number) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    loading?: boolean;
    emptyMessage?: string;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    label,
    disabled = false,
    loading = false,
    emptyMessage = 'No options found',
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = useMemo(() =>
        options.find(opt => opt.id.toString() === value?.toString()),
        [options, value]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt =>
            opt.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: Option) => {
        onChange(option.id);
        setIsOpen(false);
        setSearchTerm('');
    };

    const toggleDropdown = () => {
        if (disabled || loading) return;
        setIsOpen(!isOpen);
        if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={toggleDropdown}
                disabled={disabled || loading}
                className={`w-full flex items-center justify-between p-2.5 border rounded-xl text-sm transition-all text-left bg-white
                    ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-gray-200 hover:border-gray-300'}
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}
                `}
            >
                <span className={`truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900 font-medium'}`}>
                    {loading ? 'Loading...' : (selectedOption ? selectedOption.name : placeholder)}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full p-2 pl-9 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <ul className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-200">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <li key={option.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(option)}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between
                                            ${option.id.toString() === value?.toString()
                                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                                : 'text-gray-700 hover:bg-gray-50'}
                                        `}
                                    >
                                        <span className="truncate">{option.name}</span>
                                        {option.id.toString() === value?.toString() && (
                                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                </li>
                            ))
                        ) : (
                            <li className="px-4 py-8 text-center text-sm text-gray-400 italic">
                                {emptyMessage}
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
