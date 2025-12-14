'use client';
import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { useAuthStore } from '../../../lib/auth-store';

interface SuspiciousIp {
    ip: string;
    country: string;
    total_accounts: number;
    last_seen: string;
}

export default function SecurityPage() {
    const { user } = useAuthStore();
    const [suspiciousIps, setSuspiciousIps] = useState<SuspiciousIp[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await apiClient.get('/admin/security/suspicious-ips');
            setSuspiciousIps(res.data);
        } catch (error) {
            console.error('Failed to fetch security stats', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBlock = async (ip: string) => {
        if (!confirm(`Are you sure you want to permanently block IP: ${ip}?`)) return;

        try {
            await apiClient.post('/admin/security/block-ip', { ip, reason: 'Manual Block via Admin Panel' });
            alert(`IP ${ip} has been blocked.`);
            fetchData(); // Refresh list
        } catch (error) {
            console.error('Failed to block IP', error);
            alert('Failed to block IP');
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Scanning Security Events...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Security Command Center</h1>
                    <p className="text-gray-500 text-sm">Bot Detection & IP Management</p>
                </div>
                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-100 text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Live Detection Active
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Suspicious Activity (Last 24h)</h2>
                    <p className="text-sm text-gray-500 mt-1">High-risk IPs identified by multi-account behavior.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4">IP Address</th>
                                <th className="px-6 py-4">Accounts Created</th>
                                <th className="px-6 py-4">Last Seen</th>
                                <th className="px-6 py-4">Risk Level</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {suspiciousIps.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                        No suspicious activity detected recently.
                                    </td>
                                </tr>
                            ) : (
                                suspiciousIps.map((record) => {
                                    const isCritical = record.total_accounts > 4;
                                    return (
                                        <tr key={record.ip} className="hover:bg-red-50/10 transition">
                                            <td className="px-6 py-4 font-mono text-sm text-gray-800">{record.ip}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{record.total_accounts}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(record.last_seen).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${isCritical ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {isCritical ? 'CRITICAL' : 'WARNING'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleBlock(record.ip)}
                                                    className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 shadow-sm transition"
                                                >
                                                    BLOCK IP
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
