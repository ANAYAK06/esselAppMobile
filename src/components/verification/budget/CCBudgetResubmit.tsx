// Returned cost center budget → correct and resubmit (web verificationConfigs.jsx CCBudget.resubmit,
// legacy UpdateCCBudget). Performing cost centers need the "Approved budget for execution" PDF:
// either the one already on file or a new one, uploaded after the update succeeds.
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { FileUp, Send, X } from 'lucide-react-native';
import { FormField, TextField } from '@/src/components/employee/FormControls';
import { PrimaryButton } from '@/src/components/employee/PortalUI';
import {
    isNonPerformingCC,
    updateCCBudget,
    type CCBudgetDetail,
} from '@/src/api/verification/budgetVerificationAPI';
import { uploadFileToS3 } from '@/src/api/verification/verificationCommonAPI';
import { S3_FOLDERS } from '@/src/service/s3Config';
import { brand } from '@/src/theme/colors';
import { FieldGrid, Section } from '../kit/VerificationKit';

type Picked = { uri: string; name: string; mimeType?: string };

type Props = {
    detail: CCBudgetDetail;
    roleId: string;
    userName: string;
    onDone: () => void;
};

export default function CCBudgetResubmit({ detail: d, roleId, userName, onDone }: Props) {
    const performing = d.CCType === 'Performing';
    const nonPerforming = isNonPerformingCC(d.CCType);
    const [amount, setAmount] = useState(d.Amount != null ? String(d.Amount) : '');
    const [remarks, setRemarks] = useState(d.Remarks || '');
    const [file, setFile] = useState<Picked | null>(null);
    const [busy, setBusy] = useState(false);

    const pickPdf = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
        if (result.canceled || !result.assets?.[0]) return;
        const asset = result.assets[0];
        if (!/\.pdf$/i.test(asset.name)) {
            Alert.alert('Invalid file', 'Upload only a PDF file.');
            return;
        }
        setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
    };

    const submit = async () => {
        const errors: string[] = [];
        if (!(Number(amount) > 0)) errors.push('Enter Amount');
        if (!remarks.trim()) errors.push('Enter Remarks');
        if (performing && !d.Approvedbudgetexecution && !file) errors.push('Upload Approved budget for execution');
        if (errors.length) return Alert.alert('Check the form', errors.join('\n'));

        setBusy(true);
        try {
            const status = await updateCCBudget({
                CostCenter: d.CostCenter,
                Year: nonPerforming ? d.Year || '' : '',
                Amount: parseFloat(amount) || 0,
                Createdby: userName,
                Remarks: remarks.trim(),
                budgetexecutionexists: file ? 'Yes' : 'No',
                CCType: d.CCType,
                RoleId: roleId,
            });
            // Performing + new file → "Submited,<file name>"; the non-performing SP answers blank on success
            const ok = /^Submitt?ed(,|$)/.test(status) || (nonPerforming && !status);
            if (!ok) {
                Alert.alert('Not updated', status || 'The server returned no confirmation.');
                return;
            }
            if (file) {
                const fileName = status.split(',')[1];
                try {
                    if (!fileName) throw new Error('no file name returned for the upload');
                    await uploadFileToS3(file, S3_FOLDERS.COST_CENTER_BUDGET, fileName);
                } catch (e: any) {
                    Alert.alert('Updated, but upload failed', `The budget was updated but the PDF did not upload: ${e?.message || e}`);
                    onDone();
                    return;
                }
            }
            Alert.alert('Done', 'Budget updated successfully', [{ text: 'OK', onPress: onDone }]);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.Message || e?.message || 'Failed to update');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Section title="Update and resubmit">
            <FieldGrid
                fields={[
                    ['Cost Center Type', d.CCType],
                    ['Sub Type', d.SubType],
                    ['Cost Center', d.CostCenter],
                    nonPerforming && ['Year', d.Year],
                ]}
            />
            <FormField label="Amount" required>
                <TextField
                    value={amount}
                    keyboardType="decimal-pad"
                    onChangeText={(v) => { if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) setAmount(v); }}
                    placeholder="0.00"
                />
            </FormField>

            {performing ? (
                <FormField
                    label="Approved budget for execution (PDF)"
                    required={!d.Approvedbudgetexecution}
                    hint={d.Approvedbudgetexecution && !file ? 'A PDF is already on file — pick one only to replace it.' : undefined}
                >
                    {file ? (
                        <View className="flex-row items-center gap-3 px-3.5 py-3 rounded-lg border border-green-300 bg-green-50">
                            <FileUp size={18} color="#16a34a" />
                            <Text className="flex-1 text-sm text-gray-800" numberOfLines={1}>{file.name}</Text>
                            <TouchableOpacity onPress={() => setFile(null)} hitSlop={8}>
                                <X size={16} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={pickPdf} className="flex-row items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-orange-300 bg-orange-50">
                            <FileUp size={18} color={brand.orange} />
                            <Text className="text-sm font-semibold text-orange-600">Choose PDF</Text>
                        </TouchableOpacity>
                    )}
                </FormField>
            ) : null}

            <FormField label="Remarks" required>
                <TextField value={remarks} onChangeText={setRemarks} multiline placeholder="Reason for the change…" />
            </FormField>

            <View className="mb-2">
                <PrimaryButton label="Update & Resubmit" icon={Send} onPress={submit} loading={busy} />
            </View>
        </Section>
    );
}
