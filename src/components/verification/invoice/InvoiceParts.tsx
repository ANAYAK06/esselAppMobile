// Pieces shared by the Supplier Invoice and SP Invoice verification screens.
import React from 'react';
import { View, Text } from 'react-native';
import type { ChargeLine } from '@/src/api/verification/invoiceVerificationAPI';
import { Section, money } from '../kit/VerificationKit';

// Other charges / deductions (cost center · account head · sub account head → amount) with a sub total
export const ChargeLines = ({ title, lines, tone = 'plain' }: { title: string; lines?: ChargeLine[]; tone?: 'plain' | 'deduct' }) => {
    const rows = lines ?? [];
    if (!rows.length) return null;
    const total = rows.reduce((a, x) => a + (Number(x.Amount) || 0), 0);
    return (
        <Section title={title}>
            {rows.map((x, i) => (
                <View key={i} className={`flex-row items-center gap-3 py-2 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                    <View className="flex-1">
                        <Text className="text-xs font-semibold text-gray-800">{x.TaxType || x.Type || x.DCACode || '—'}</Text>
                        <Text className="text-[11px] text-gray-400">
                            {[x.CCCode, x.DCACode, x.SubDCACode].filter(Boolean).join(' · ')}
                        </Text>
                    </View>
                    <Text className={`text-sm font-semibold ${tone === 'deduct' ? 'text-red-600' : 'text-gray-900'}`}>
                        {tone === 'deduct' ? '−' : ''}{money(x.Amount)}
                    </Text>
                </View>
            ))}
            <View className="flex-row justify-between pt-2 border-t border-gray-200">
                <Text className="text-xs font-bold text-gray-600">Sub total</Text>
                <Text className={`text-xs font-bold ${tone === 'deduct' ? 'text-red-600' : 'text-brand-navy'}`}>{money(total)}</Text>
            </View>
        </Section>
    );
};

// Approval trail kept on the record itself (ApprovedUser): entries split by "||", fields by ":".
// Supplier Invoice stores "Role : User : Comment"; SP Invoice "Role:Employee" with the creator first.
export const ApprovalTrail = ({ text, firstIsCreator }: { text?: string; firstIsCreator?: boolean }) => {
    const entries = String(text || '').split('||').map((t) => t.trim()).filter(Boolean);
    if (!entries.length) return null;
    return (
        <Section title="Approvals so far">
            {entries.map((entry, i) => {
                const [role, name, ...rest] = entry.split(':').map((p) => p.trim());
                const comment = rest.join(':').trim();
                return (
                    <View key={i} className={`py-2 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                        <Text className="text-xs font-semibold text-gray-800">
                            {firstIsCreator ? (i === 0 ? 'Created by ' : 'Verified by ') : ''}{name || role}
                        </Text>
                        {name ? <Text className="text-[11px] text-gray-400">{role}</Text> : null}
                        {comment ? <Text className="text-xs text-gray-700 mt-0.5">“{comment}”</Text> : null}
                    </View>
                );
            })}
        </Section>
    );
};
