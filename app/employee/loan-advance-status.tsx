// app/employee/loan-advance-status.tsx
// Mirrors the Corex web portal's LoanAdvanceStatus page (pages/EmployeePortal/pages/LoanAdvanceStatus.jsx).
// The web repayment table becomes a list of rows on mobile.
import React, { useCallback, useEffect } from 'react';
import { View, Text } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchMyLoanAdvanceStatus, fetchMyLoanDetails } from '@/src/slice/hr/employeePortalSlice';
import { useEmployee } from '@/src/hooks/useEmployee';
import PortalScreen from '@/src/components/employee/PortalScreen';
import { Badge, EmptyState, LoadingText, ProgressBar, SectionCard } from '@/src/components/employee/PortalUI';
import { advanceTypeLabel, formatRupees } from '@/src/components/employee/portalFormat';

const loanStatusTone = (status: string) =>
    status === 'Running'
        ? { bg: 'bg-blue-100', text: 'text-blue-700' }
        : status === 'Closed'
            ? { bg: 'bg-emerald-100', text: 'text-emerald-700' }
            : { bg: 'bg-gray-100', text: 'text-gray-600' };

const Detail = ({ label, value }: { label: string; value: string | number }) => (
    <View className="w-1/2 mb-2">
        <Text className="text-xs text-gray-400">{label}</Text>
        <Text className="text-xs font-medium text-gray-700">{value}</Text>
    </View>
);

export default function LoanAdvanceStatus() {
    const dispatch = useAppDispatch();
    const { empRefNo } = useEmployee();
    const { loanDetails: loans, loanAdvanceStatus, loading } = useAppSelector((s) => s.employeePortal);

    const load = useCallback(() => {
        if (!empRefNo) return Promise.resolve();
        return Promise.all([dispatch(fetchMyLoanDetails(empRefNo)), dispatch(fetchMyLoanAdvanceStatus(empRefNo))]);
    }, [dispatch, empRefNo]);

    useEffect(() => {
        load();
    }, [load]);

    const repayments = loanAdvanceStatus?.RepaymentHistory || [];
    const skipped = loanAdvanceStatus?.SkippedMonths || [];

    return (
        <PortalScreen
            title="Loan / Advance Status"
            subtitle="Outstanding balance & EMI history"
            icon={CreditCard}
            onRefresh={load}
        >
            {loading.loanDetails && loans.length === 0 ? (
                <LoadingText />
            ) : loans.length === 0 ? (
                <SectionCard>
                    <EmptyState
                        icon={CreditCard}
                        title="No loans or advances found"
                        subtitle="Any approved LTA or salary advance you take will show its EMI status here."
                    />
                </SectionCard>
            ) : (
                <>
                    {loans.map((loan) => {
                        const total = Number(loan.NoOfInstallments || 0);
                        const remaining = Number(loan.NoOfBalanceInstallments || 0);
                        const paid = Math.max(0, total - remaining);
                        return (
                            <SectionCard key={`${loan.TransactionRefNo}-${loan.AdvanceType}`}>
                                <View className="flex-row items-start justify-between mb-3">
                                    <View className="flex-1">
                                        <Text className="text-sm font-semibold text-gray-800">
                                            {advanceTypeLabel[loan.AdvanceType] || loan.AdvanceType}
                                        </Text>
                                        <Text className="text-xs text-gray-400 mt-0.5">Ref: {loan.TransactionRefNo}</Text>
                                    </View>
                                    <Badge label={loan.LoanStatus} tone={loanStatusTone(loan.LoanStatus)} />
                                </View>

                                <View className="flex-row mb-3">
                                    <View className="flex-1">
                                        <Text className="text-xs text-gray-400">Balance Amount</Text>
                                        <Text className="text-lg font-bold text-brand-navy">{formatRupees(loan.LTABalance)}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-xs text-gray-400">EMI Amount</Text>
                                        <Text className="text-lg font-bold text-brand-navy">{formatRupees(loan.EMI)}</Text>
                                    </View>
                                </View>

                                <ProgressBar percent={total ? (paid / total) * 100 : 0} />
                                <View className="flex-row justify-between mt-1.5 mb-3">
                                    <Text className="text-xs text-gray-400">{paid} paid</Text>
                                    <Text className="text-xs text-gray-400">{remaining} remaining of {total}</Text>
                                </View>

                                <View className="flex-row flex-wrap pt-3 border-t border-gray-100">
                                    <Detail label="Loan Value" value={formatRupees(loan.LTAValue)} />
                                    <Detail label="EMI Start Date" value={loan.EMIStartDate || '—'} />
                                    <Detail label="Installments" value={total} />
                                    <Detail label="Balance Installments" value={remaining} />
                                </View>
                            </SectionCard>
                        );
                    })}

                    {loading.loanAdvanceStatus && !loanAdvanceStatus ? (
                        <LoadingText label="Loading repayment history…" />
                    ) : (
                        <>
                            {repayments.length > 0 && (
                                <SectionCard title="Repayment History" icon={CreditCard}>
                                    {repayments.map((r, index) => (
                                        <View
                                            key={`${r.TransactionRefNo}-${r.PayRollRefno}-${index}`}
                                            className={`flex-row items-center justify-between gap-3 py-2.5 ${index > 0 ? 'border-t border-gray-100' : ''}`}
                                        >
                                            <View className="flex-1">
                                                <Text className="text-sm font-medium text-gray-800">{r.RepaymentMonth}</Text>
                                                <Text className="text-xs text-gray-400">
                                                    {advanceTypeLabel[r.AdvanceType] || r.AdvanceType} · #{r.InstallmentNo}
                                                </Text>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-sm font-semibold text-gray-800">{formatRupees(r.EMIPaid)}</Text>
                                                <Text className="text-xs text-gray-400">
                                                    Balance {formatRupees(r.BalanceAfterPayment)}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </SectionCard>
                            )}

                            {skipped.length > 0 && (
                                <SectionCard title="Skipped / Held Deductions" icon={CreditCard}>
                                    {skipped.map((s, index) => (
                                        <View
                                            key={`${s.TransactionRefNo}-${index}`}
                                            className={`flex-row items-center justify-between gap-3 py-3 ${index > 0 ? 'border-t border-gray-100' : ''}`}
                                        >
                                            <View className="flex-1">
                                                <Text className="text-sm font-semibold text-gray-800">
                                                    {advanceTypeLabel[s.AdvanceType] || s.AdvanceType}
                                                </Text>
                                                <Text className="text-xs text-gray-400 mt-0.5">{s.SkippedOnDate}</Text>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-sm font-semibold text-gray-800">{formatRupees(s.SkippedAmount)}</Text>
                                                <Text className="text-xs text-gray-400">{s.Status}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </SectionCard>
                            )}
                        </>
                    )}
                </>
            )}
        </PortalScreen>
    );
}
