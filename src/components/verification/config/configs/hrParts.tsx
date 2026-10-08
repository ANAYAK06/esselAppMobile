// Interactive blocks for the HR configs (rendered through a config's extra())
import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CheckCircle2, Circle, Info, XCircle } from 'lucide-react-native';
import { putRoute, statusOf } from '@/src/api/verification/configVerificationAPI';
import type { SheetContent } from '@/src/components/common/DetailSheet';
import { PrimaryButton } from '@/src/components/employee/PortalUI';
import { money } from '@/src/components/verification/kit/VerificationKit';
import { brand } from '@/src/theme/colors';
import { Block, SimpleTable, TotalLine, fmt } from '../parts';
import type { Rec } from '../types';
import { list } from './shared';

// ---- Staff payroll: employee list with tick / salary breakup / single reject ----------------------

// Reject one employee's payroll with a reason (HR/ApprovePayRollSingle, Action Reject)
function RejectEmployee({ row, emp, roleId, user, onDone }: { row: Rec; emp: Rec; roleId: string; user: string; onDone: () => void }) {
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const reject = async () => {
        if (!note.trim()) return Alert.alert('Reason required', 'Enter the reason for rejection.');
        setBusy(true);
        try {
            const body = await putRoute('HR/ApprovePayRollSingle', {
                Action: 'Reject', TransactionRefno: String(row.TransactionRefno), Roleid: parseInt(roleId, 10), PayRoleDate: row.PayRoleDate,
                CreatedBy: user, ConslidateTransNo: parseInt(row.ConslidateTransNo, 10), Refno: parseInt(row.Refno, 10), Note: note.trim(),
                SalaryId: parseInt(emp.SalaryId, 10), EmpRefNo: String(emp.EmpRefNo), CCCode: String(row.CCCodes),
            });
            const status = statusOf(body);
            Alert.alert('Rejected', `Payroll for ${emp.Name} was rejected.${status ? `\n\n${status}` : ''}`);
            onDone();
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not reject this employee');
        } finally {
            setBusy(false);
        }
    };
    return (
        <View>
            <Text className="text-xs text-gray-600 mb-2">This rejects the payroll for {emp.Name} ({emp.EmpRefNo}). Give a reason:</Text>
            <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Reason for rejection…"
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                className="min-h-[80px] rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 mb-3"
            />
            <PrimaryButton label="Confirm reject" icon={XCircle} onPress={reject} loading={busy} disabled={busy || !note.trim()} />
        </View>
    );
}

const salarySheet = (emp: Rec, heads: Rec[]): SheetContent => {
    const mine = heads.filter((h) => h.EmployeeId === emp.EmpRefNo);
    const earn = mine.filter((h) => ['Earning', 'Benefit', 'OtherBenefit'].includes(h.HeadType));
    const ded = mine.filter((h) => h.HeadType === 'Deduction');
    return {
        title: emp.Name,
        subtitle: `${emp.EmpRefNo} · ${emp.DesignationName || ''}`,
        body: (
            <View>
                <Text className="text-xs text-gray-500 mb-2">
                    Salary days {emp.TotalSalaryDays} · Absent {emp.TotalAbsentDays} · CC {emp.JoiningCostCenter}
                </Text>
                <Text className="text-sm font-semibold text-gray-900 mt-1">Earnings</Text>
                <SimpleTable heads={['Head', 'Amount']} rows={earn.map((h) => [h.SalaryHead, fmt(h.HeadAmount)])} empty="No earnings data" />
                <Text className="text-sm font-semibold text-gray-900 mt-3">Deductions</Text>
                <SimpleTable heads={['Head', 'Amount']} rows={ded.map((h) => [h.SalaryHead, fmt(h.HeadAmount)])} empty="No deductions data" />
                <TotalLine label="Gross" value={money(emp.GrossValue)} />
                <TotalLine label="Deductions" value={money(emp.Deductions)} />
                <TotalLine label="Net pay" value={money(emp.NetValue)} />
            </View>
        ),
    };
};

export function PayrollEmployees({ row, d, ext, setExt, openSheet, reload, roleId, user }: {
    row: Rec; d: Rec; ext: Rec; setExt: (u: (p: Rec) => Rec) => void; openSheet: (s: SheetContent) => void; reload: () => void; roleId: string; user: string;
}) {
    const emps = list(d.MainGridData);
    const heads = list(d.MonthlySalaryDetailsData);
    const selected: Record<string, boolean> = ext.selected || {};
    const all = emps.length > 0 && emps.every((e) => selected[e.SalaryId]);
    const toggle = (id: unknown) => setExt((p) => ({ ...p, selected: { ...(p.selected || {}), [String(id)]: !(p.selected || {})[String(id)] } }));
    const sum = (k: string, only?: boolean) => emps.filter((e) => !only || selected[e.SalaryId]).reduce((a, e) => a + (Number(e[k]) || 0), 0);
    const picked = emps.filter((e) => selected[e.SalaryId]).length;

    if (!emps.length) {
        return <Block title="Employees"><Text className="text-xs text-gray-400 py-3 text-center">No employees remaining in this payroll record.</Text></Block>;
    }
    return (
        <Block
            title={`Employees (${emps.length})`}
            right={(
                <TouchableOpacity onPress={() => setExt((p) => ({ ...p, selected: all ? {} : Object.fromEntries(emps.map((e) => [String(e.SalaryId), true])) }))}>
                    <Text className="text-xs font-semibold text-orange-600">{all ? 'Deselect all' : 'Select all'}</Text>
                </TouchableOpacity>
            )}
        >
            <Text className="text-[11px] text-gray-500 mb-1">Tick the employees to include in the approval — {picked}/{emps.length} selected</Text>
            {emps.map((e) => (
                <View key={e.SalaryId} className="flex-row items-start gap-3 py-2.5 border-t border-gray-100">
                    <TouchableOpacity hitSlop={8} onPress={() => toggle(e.SalaryId)} className="pt-0.5">
                        {selected[e.SalaryId] ? <CheckCircle2 size={20} color="#16a34a" /> : <Circle size={20} color="#d1d5db" />}
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-sm font-semibold text-gray-900">{e.Name}</Text>
                        <Text className="text-[11px] text-gray-500">{[e.EmpRefNo, e.DesignationName, `${e.TotalSalaryDays}/${e.WorkingDays} days`].filter(Boolean).join(' · ')}</Text>
                        <Text className="text-[11px] text-gray-700 mt-0.5">
                            Gross {fmt(e.GrossValue)} · Ded {fmt(e.Deductions)} · <Text className="font-semibold">Net {fmt(e.NetValue)}</Text>
                        </Text>
                        <View className="flex-row gap-4 mt-1.5">
                            <TouchableOpacity onPress={() => openSheet(salarySheet(e, heads))} className="flex-row items-center gap-1" hitSlop={6}>
                                <Info size={13} color={brand.orange} /><Text className="text-xs font-semibold text-orange-600">Salary details</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => openSheet({
                                    title: 'Reject payroll',
                                    subtitle: `${e.Name} · ${e.EmpRefNo}`,
                                    tone: 'red',
                                    body: <RejectEmployee row={row} emp={e} roleId={roleId} user={user} onDone={reload} />,
                                })}
                                className="flex-row items-center gap-1"
                                hitSlop={6}
                            >
                                <XCircle size={13} color="#dc2626" /><Text className="text-xs font-semibold text-red-600">Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ))}
            <TotalLine label={`Total net (${emps.length})`} value={money(sum('NetValue'))} />
            {picked > 0 && picked < emps.length ? <TotalLine label={`Selected net (${picked})`} value={money(sum('NetValue', true))} /> : null}
        </Block>
    );
}

// ---- Staff daily attendance: the verifier may correct P / A / L / H per employee -------------------

const ATT_TYPES = ['P', 'A', 'L', 'H'] as const;
const ATT_LABELS: Record<string, string> = { P: 'Present', A: 'Absent', L: 'Leave', H: 'Holiday' };
const ATT_ON: Record<string, string> = { P: 'bg-green-600 border-green-600', A: 'bg-red-600 border-red-600', L: 'bg-amber-500 border-amber-500', H: 'bg-blue-600 border-blue-600' };

// Effective attendance for an employee: the verifier's edit, else the submitted value
export const attendanceOf = (emp: Rec, ext: Rec): string => (ext.att || {})[emp.EmpId] ?? emp.AttendanceType;

export function AttendanceEditor({ d, ext, setExt }: { d: Rec; ext: Rec; setExt: (u: (p: Rec) => Rec) => void }) {
    const emps = list(d.CCEmplistforDate);
    const edits: Record<string, string> = ext.att || {};
    const edited = Object.keys(edits).length;
    const set = (empId: string, type: string | null) => setExt((p) => {
        const next = { ...(p.att || {}) };
        if (type === null) delete next[empId]; else next[empId] = type;
        return { ...p, att: next };
    });
    if (!emps.length) return null;
    return (
        <Block
            title={`Employees (${emps.length})`}
            right={edited ? (
                <TouchableOpacity onPress={() => setExt((p) => ({ ...p, att: {} }))}>
                    <Text className="text-xs font-semibold text-orange-600">Reset {edited}</Text>
                </TouchableOpacity>
            ) : null}
        >
            <Text className="text-[11px] text-gray-500 mb-1">Tap P / A / L / H to correct an employee&apos;s attendance — changes go with your decision.</Text>
            {emps.map((e) => {
                const eff = attendanceOf(e, ext);
                const changed = edits[e.EmpId] !== undefined;
                return (
                    <View key={e.EmpId} className="py-2.5 border-t border-gray-100">
                        <View className="flex-row items-center gap-2">
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-gray-900">{e.EmpName}</Text>
                                <Text className="text-[11px] text-gray-500">{[e.EmpId, e.Category, e.GroupName].filter(Boolean).join(' · ')}</Text>
                            </View>
                            {ATT_TYPES.map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    onPress={() => set(e.EmpId, t === e.AttendanceType ? null : t)}
                                    accessibilityLabel={`Mark ${ATT_LABELS[t]}`}
                                    className={`w-8 h-8 rounded-lg border-2 items-center justify-center ${eff === t ? ATT_ON[t] : 'bg-white border-gray-200'}`}
                                >
                                    <Text className={`text-xs font-bold ${eff === t ? 'text-white' : 'text-gray-500'}`}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {changed ? <Text className="text-[11px] text-amber-700 mt-1">Changed by you — was {e.AttendanceType || '—'}</Text> : null}
                    </View>
                );
            })}
        </Block>
    );
}

// ---- Employee / labour CTC: salary heads grouped under their main head, totals highlighted ---------

const CTC_TOTALS = ['GROSSSALARY', 'DEDUCTIONTOTAL', 'NETSALARY', 'BENEFITTOTAL', 'OTHERBENEFITTOTAL', 'CTCTOTAL'];

// Annual CTC as the web shows it: CTCTotal, else the CTCTOTAL head's yearly amount
export const annualCTC = (d: Rec): number => Number(d.CTCTotal || list(d.HeadsList).find((h) => h.HeadType === 'CTCTOTAL')?.YearlyAmount || 0);

// Same grouping as the web: a head with MainHead opens a group, total heads close it
const groupHeads = (heads: Rec[]) => {
    const groups: { main: string | null; items: Rec[] }[] = [];
    let current: { main: string | null; items: Rec[] } | null = null;
    heads.forEach((h) => {
        if (h.MainHead && String(h.MainHead).trim()) {
            current = { main: h.MainHead, items: [h] };
            groups.push(current);
        } else if (current && !CTC_TOTALS.includes(h.HeadType)) {
            current.items.push(h);
        } else {
            groups.push({ main: null, items: [h] });
            if (CTC_TOTALS.includes(h.HeadType)) current = null;
        }
    });
    return groups;
};

export function CTCBreakdown({ d, daily }: { d: Rec; daily?: boolean }) {
    const heads = list(d.HeadsList);
    if (!heads.length) return null;
    const groups = groupHeads(heads);
    const amt = (v: unknown) => (Number(v) > 0 ? fmt(v) : '-');
    const periodLabel = daily ? 'Daily' : 'Monthly';
    return (
        <Block title="CTC breakdown">
            <Text className="text-[11px] text-gray-500 mb-1">Amounts: {periodLabel} · Yearly</Text>
            {groups.map((g, gi) => (
                <View key={gi} className="border-t border-gray-100 pt-1.5 mt-1.5">
                    {g.main ? <Text className="text-[11px] font-bold text-orange-600 uppercase mb-0.5">{g.main}</Text> : null}
                    {g.items.map((h, hi) => {
                        const total = CTC_TOTALS.includes(h.HeadType);
                        const period = daily ? h.Dailyamount : h.MonthlyAmount;
                        return (
                            <View key={hi} className={`flex-row items-start py-1 ${total ? 'bg-blue-700 rounded-lg px-2 my-0.5' : ''}`}>
                                <View className="flex-1 pr-2">
                                    <Text className={`text-xs ${total ? 'font-bold text-white' : 'text-gray-900'}`}>{h.HeadName}</Text>
                                    {!total ? (
                                        <Text className="text-[10px] text-gray-500">
                                            {[h.ApplicableType || h.CTCAmounttype, Number(h.CTCAmount) > 0 && `CTC ${fmt(h.CTCAmount)}`].filter(Boolean).join(' · ') || '-'}
                                            {h.ValidationMsg && String(h.ValidationMsg).trim() ? ` (${h.ValidationMsg})` : ''}
                                        </Text>
                                    ) : null}
                                </View>
                                <Text className={`text-xs w-20 text-right ${total ? 'font-bold text-white' : 'text-gray-700'}`}>{amt(period)}</Text>
                                <Text className={`text-xs w-24 text-right ${total ? 'font-bold text-white' : 'text-gray-900 font-semibold'}`}>{amt(h.YearlyAmount)}</Text>
                            </View>
                        );
                    })}
                </View>
            ))}
        </Block>
    );
}

// ---- Staff / labour pay revision: existing vs revised per head, with the difference ---------------

const signed = (v: unknown) => {
    const n = Number(v) || 0;
    return n === 0 ? '-' : `${n > 0 ? '+' : ''}${fmt(n)}`;
};

export function PayRevisionBreakdown({ d, yearly }: { d: Rec; yearly?: boolean }) {
    const heads = list(d.PayRevisionHeadData?.lstAllHeads);
    if (!heads.length) return null;
    const amt = (v: unknown) => (Number(v) > 0 ? fmt(v) : '-');
    const line = (label: string, existing: unknown, revised: unknown, diff: unknown, total: boolean) => (
        <View className="flex-row">
            <Text className={`text-[10px] w-14 ${total ? 'text-blue-100' : 'text-gray-500'}`}>{label}</Text>
            <Text className={`text-[11px] flex-1 text-right ${total ? 'text-white' : 'text-gray-600'}`}>{amt(existing)}</Text>
            <Text className={`text-[11px] flex-1 text-right font-semibold ${total ? 'text-white' : 'text-gray-900'}`}>{amt(revised)}</Text>
            <Text className={`text-[11px] w-24 text-right font-semibold ${total ? 'text-white' : Number(diff) > 0 ? 'text-green-700' : Number(diff) < 0 ? 'text-red-600' : 'text-gray-400'}`}>{signed(diff)}</Text>
        </View>
    );
    return (
        <Block title="Pay revision breakdown">
            <Text className="text-[11px] text-gray-500 mb-1">Existing · Revised · Difference</Text>
            {groupHeads(heads).map((g, gi) => (
                <View key={gi} className="border-t border-gray-100 pt-1.5 mt-1.5">
                    {g.main ? <Text className="text-[11px] font-bold text-orange-600 uppercase mb-0.5">{g.main}</Text> : null}
                    {g.items.map((h, hi) => {
                        const total = CTC_TOTALS.includes(h.HeadType);
                        return (
                            <View key={hi} className={`py-1 ${total ? 'bg-blue-700 rounded-lg px-2 my-0.5' : ''}`}>
                                <Text className={`text-xs ${total ? 'font-bold text-white' : 'text-gray-900'}`}>
                                    {h.HeadName}
                                    {!total && h.HeadReviseType ? <Text className="text-[10px] text-blue-600">{`  ${h.HeadReviseType}`}</Text> : null}
                                </Text>
                                {!total && (h.ApplicableType || h.CTCAmounttype) ? <Text className="text-[10px] text-gray-500">{h.ApplicableType || h.CTCAmounttype}</Text> : null}
                                {line('Monthly', h.ExistingMonthlyAmount, h.MonthlyAmount, h.MonthlyDiff, total)}
                                {yearly ? line('Yearly', h.ExistingYearlyAmount, h.YearlyAmount, h.YearlyDiff, total) : null}
                            </View>
                        );
                    })}
                </View>
            ))}
        </Block>
    );
}

// ---- Staff registration: the approve PUT re-sends the whole registration ---------------------------

export const staffName = (s: Rec) => [s.FirstName, s.MiddleName, s.LastName].filter(Boolean).join(' ') || 'Unknown';

const str = (v: unknown, fallback = '') => (v === null || v === undefined ? fallback : String(v));

// "a,b," per column for the rows whose key field is filled (the web's SP format)
const columns = (rows: Rec[], keep: string, cols: Record<string, (x: Rec) => unknown>) => {
    const valid = rows.filter((x) => String(x[keep] ?? '').trim());
    return Object.fromEntries(Object.entries(cols).map(([k, f]) => [k, valid.length ? `${valid.map(f).join(',')},` : '']));
};

// Random 8-char login password, base64 encoded — generated on Approve exactly as the web does
const newPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pass = '';
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return btoa(pass);
};

export const staffRegistrationPayload = (r: Rec, d: Rec, docs: Rec[], x: { action: string; note: string; user: string; roleId: string }): Rec => {
    const contract = d.Category === 'Contract Management Staff';
    return {
        EmpRefNo: str(r.EmpRefNo), JoiningType: str(d.JoiningType, 'New Join'), Category: str(d.Category, 'Staff'), Appointmenttype: str(d.Appointmenttype, 'Normal'),
        FirstName: str(d.FirstName), LastName: str(d.LastName), MiddleName: str(d.MiddleName), DateofBirth: str(d.DateofBirth), EmpAge: str(d.EmpAge, '0'),
        Gender: str(d.Gender, 'Male'), MartialStatus: str(d.MartialStatus, 'Single'), DateofMarriage: str(d.DateofMarriage), PlaceofBirth: str(d.PlaceofBirth),
        NomineeName: str(d.NomineeName), NomineeRelation: str(d.NomineeRelation), NomineeDateofBirth: str(d.NomineeDateofBirth), NomineeAge: str(d.NomineeAge, '0'),
        ContactWorkPhone: str(d.ContactWorkPhone), ContactMobile: str(d.ContactMobile), WorkEmail: str(d.WorkEmail || d.MailId),
        PermanentAddress: str(d.PermanentAddress), PresentAddress: str(d.PresentAddress), Experience: str(d.Experience, 'Fresher'),
        DesignationId: String(parseInt(d.DesignationId, 10) || 0), JoiningDate: str(d.JoiningDate), JobType: str(d.JobType, 'Permanent'),
        JoiningCostCenter: str(d.JoiningCostCenter), TransitDay: String(parseInt(d.TransitDay, 10) || 0),
        ReportTo: d.ReportTo && String(d.ReportTo).trim() ? String(d.ReportTo).trim() : str(r.EmpRefNo),
        DepartmentId: String(parseInt(d.DepartmentId, 10) || 0),
        BankName: str(d.BankName), BankAccountNo: str(d.BankAccountNo), IFSCcode: str(d.IFSCcode), BankAddress: str(d.BankAddress),
        ...columns(list(d.FamilyMemberData), 'FMName', {
            FMName: (m) => m.FMName, FMDateofBirth: (m) => m.FMDateofBirth, FMAge: (m) => m.FMAge, FMGender: (m) => m.FMGender, FMRelation: (m) => m.FMRelation, FMMobileNo: (m) => m.FMMobileNo,
        }),
        ...columns(list(d.ChildrensData), 'ChildName', {
            ChildName: (c) => c.ChildName, ChildDateofBirth: (c) => c.ChildDateofBirth, ChildAge: (c) => c.ChildAge, ChildGender: (c) => c.ChildGender, ChildMaritalStatus: (c) => c.ChildMaritalStatus,
        }),
        ...columns(list(d.AcademicQualificationData), 'AcademicClass', {
            AcademicClass: (a) => a.AcademicClass, NameofUniversity: (a) => a.NameofUniversity, FromYear: (a) => a.FromYear, ToYear: (a) => a.ToYear, Percentage: (a) => a.Percentage,
        }),
        ...columns(list(d.TechnicalData), 'TechnicalSkill', {
            TechnicalSkill: (t) => t.TechnicalSkill, TechInstitutionName: (t) => t.TechInstitutionName || t.InstitutionName || '',
            TechFromYear: (t) => t.TechFromYear || t.FromYear || '', TechToYear: (t) => t.TechToYear || t.ToYear || '', TechPercentage: (t) => t.TechPercentage || t.Percentage || '',
        }),
        ...columns(list(d.ExperienceData), 'OrganisationName', {
            OrganisationName: (e) => e.OrganisationName, ExpFromYear: (e) => e.ExpFromYear || e.FromYear || ' ', ExpToYear: (e) => e.ExpToYear || e.ToYear || ' ',
            Role: (e) => e.Role || ' ', Mobilenos: (e) => e.HistoryReferenceNo || e.Mobilenos || e.RefNo || ' ',
            ExpContactNames: (e) => e.ExpContactNames || e.HistoryContactName || e.ContactName || ' ', ExpRemarks: (e) => e.ExpRemarks || e.HistoryRefRemark || e.Remarks || ' ',
        }),
        ...columns(list(d.EmpReferenceData), 'RefName', {
            RefName: (x) => x.RefName, RefRelation: (x) => x.RefRelation || x.Relation || '', RefMobileNo: (x) => x.RefMobileNo, RefRemarks: (x) => x.RefRemarks || x.FresherRefRemark || 'null',
        }),
        UANExist: d.UANExist === true || d.UANExist === 'true' || d.UANExist === 'True',
        UANNumber: str(d.UANNumber), ESINumber: str(d.ESINumber), PFExist: str(d.PFExist, 'No'), ESIExist: str(d.ESIExist, 'No'),
        AdharNo: str(d.AdharNo), PanNo: str(d.PanNo),
        UserName: d.UserName && String(d.UserName).trim() ? String(d.UserName).trim() : str(r.EmpRefNo).toLowerCase(),
        Pwd: x.action.toLowerCase() === 'approve' ? newPassword() : '',
        ReportToRoleId: String(parseInt(d.ReportToRoleId, 10) || 0), GroupId: String(parseInt(d.GroupId, 10) || 0), RoleId: parseInt(x.roleId, 10) || 0,
        Probationdays: (parseFloat(d.Probationdays) || 0).toFixed(2),
        ContractStartDate: contract && d.ContractStartDate ? str(d.ContractStartDate) : str(d.JoiningDate),
        ContractEndDate: contract && d.ContractEndDate ? str(d.ContractEndDate) : str(d.JoiningDate),
        Createdby: x.user, Action: x.action, ApprovalNote: x.note,
        DocumentData: docs
            .map((doc) => ({ DocName: doc.DocName || '', PDFBaseData: doc.PDFBaseData || doc.DocBinaryData || '', FileType: doc.FileType || '', Path: doc.Path || '' }))
            .filter((doc) => String(doc.PDFBaseData).trim() || String(doc.Path).trim()),
    };
};
