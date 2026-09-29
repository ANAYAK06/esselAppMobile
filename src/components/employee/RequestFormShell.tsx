// Mobile version of the web portal's RequestFormBase: the form card, the "Request Submitted"
// confirmation, an info panel and the 4-step approval flow. Screens supply the fields and an
// onSubmit that throws an Error with a user-facing message when something is wrong.
import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { ArrowRight, CheckCircle2, UserCheck } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { PrimaryButton, SecondaryButton, SectionCard } from '@/src/components/employee/PortalUI';
import { errorText } from '@/src/components/employee/portalFormat';

type Props = {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    submitLabel: string;
    reportingPersonName: string;
    onSubmit: () => Promise<void>;
    onReset: () => void;
    onRefresh?: () => Promise<unknown>;
    sidePanel?: React.ReactNode;
    children: React.ReactNode;
};

export default function RequestFormShell({
    title, subtitle, icon, submitLabel, reportingPersonName, onSubmit, onReset, onRefresh, sidePanel, children,
}: Props) {
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await onSubmit();
            setSubmitted(true);
        } catch (error) {
            Alert.alert('Could not submit', errorText(error, 'Failed to submit request'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        onReset();
        setSubmitted(false);
    };

    return (
        <PortalScreen title={title} subtitle={subtitle} icon={icon} onRefresh={onRefresh}>
            <SectionCard title="Request Details" icon={icon}>
                {submitted ? (
                    <View className="items-center py-6 px-2">
                        <View className="w-14 h-14 rounded-full bg-emerald-100 items-center justify-center mb-4">
                            <CheckCircle2 size={28} color="#10b981" />
                        </View>
                        <Text className="text-base font-semibold text-gray-800">Request Submitted</Text>
                        <Text className="text-sm text-gray-500 mt-1 text-center">
                            Your request has been sent to{' '}
                            <Text className="font-semibold text-gray-700">{reportingPersonName}</Text> for verification
                            before entering the standard approval workflow.
                        </Text>
                        <View className="mt-5">
                            <SecondaryButton label="Submit Another Request" onPress={handleReset} />
                        </View>
                    </View>
                ) : (
                    <>
                        {children}
                        <View className="flex-row gap-3 pt-1">
                            <View className="flex-1">
                                <PrimaryButton
                                    label={submitting ? 'Submitting…' : submitLabel}
                                    icon={ArrowRight}
                                    loading={submitting}
                                    onPress={handleSubmit}
                                />
                            </View>
                            <SecondaryButton label="Clear" onPress={handleReset} disabled={submitting} />
                        </View>
                    </>
                )}
            </SectionCard>

            {sidePanel}

            <SectionCard title="Approval Flow" icon={UserCheck}>
                {[
                    { step: '1', label: 'Submitted by you', desc: 'Employee Portal' },
                    { step: '2', label: `Verified by ${reportingPersonName}`, desc: 'Your reporting person' },
                    { step: '3', label: 'Standard workflow', desc: 'Existing approval engine' },
                    { step: '4', label: 'Final approval', desc: 'Record created' },
                ].map((s, i, arr) => (
                    <View key={s.step} className="flex-row gap-3">
                        <View className="items-center">
                            <View className="w-7 h-7 rounded-full bg-brand-navy items-center justify-center">
                                <Text className="text-xs font-bold text-orange-400">{s.step}</Text>
                            </View>
                            {i < arr.length - 1 && <View className="w-px flex-1 bg-gray-200 my-1" style={{ minHeight: 14 }} />}
                        </View>
                        <View className="flex-1 pb-3">
                            <Text className="text-sm font-semibold text-gray-800">{s.label}</Text>
                            <Text className="text-xs text-gray-400">{s.desc}</Text>
                        </View>
                    </View>
                ))}
            </SectionCard>
        </PortalScreen>
    );
}

// "Routes for verification to <name>" row used in the request side panels
export const RoutesToRow = ({ loading, name }: { loading: boolean; name?: string }) => (
    <View className="flex-row items-center gap-2 pt-3 mt-1 border-t border-gray-100">
        <UserCheck size={16} color="#9ca3af" />
        <View className="flex-1">
            <Text className="text-xs text-gray-500">Routes for verification to</Text>
            <Text className="text-sm font-semibold text-gray-800">
                {loading ? 'Loading…' : name?.trim() || 'Not configured'}
            </Text>
        </View>
    </View>
);
