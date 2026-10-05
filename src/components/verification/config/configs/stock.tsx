// Stock & assets — ported from the Corex web pages/Accounts/verificationConfigs.jsx (NewStockIssue,
// OldStockIssue, OldStockReceived, NewStockTransfer, ItemsTransfer, ItemsTransferIssue, CapitalStockIssue,
// DirectStockUpdation, StoreClosing, CCStockClose, AssetSale, AssetSaleReceipt, ItemCodeUpdation).
// Routes, params, payloads and success literals are the web's.
import React from 'react';
import {
    Archive, ArrowLeftRight, Combine, Forklift, HandCoins, PackageCheck, PackageOpen, PackagePlus, PackageSearch, ReceiptText, Recycle, Store, Truck,
} from 'lucide-react-native';
import { postRoute, statusOf } from '@/src/api/verification/configVerificationAPI';
import { money } from '@/src/components/verification/kit/VerificationKit';
import {
    Alarm, CheckedItems, ItemCodeUpdationEditor, ItemsTransferItems, StoreCloseEditor, TableBlock, TotalLine,
    allItemsChecked, displayDate, fmt, itemCodeUpdValues, itemsTransferApprovalAtDefine, itemsTransferDep, itemsTransferDepOptions,
    itemsTransferIsConsumable, stockBreakupSheet, storeCloseBounds, storeCloseValues,
} from '../parts';
import type { Rec, VerificationConfig } from '../types';

const list = (v: unknown): Rec[] => (Array.isArray(v) ? v : []);
const returnedChip = (r: Rec) => String(r.Status).trim() === '0' && 'Returned';

// Items Transfer inbox paths carry ?CCType=PCC|NPCC; fall back to the category's (PCC)/(NPCC)
const itemsTransferCCType = (path: string, category: string) => {
    const m = /cctype=(n?pcc)/i.exec(path || '');
    if (m) return m[1].toUpperCase();
    return /\(npcc\)/i.test(category || '') ? 'NPCC' : 'PCC';
};

const remarksBlock = (rows: Rec[]) => (rows.length ? <TableBlock title="Remarks" heads={['Remarks']} rows={rows.map((x) => [x.Remarks])} /> : null);

// "Please Verify …" unless every item is ticked; `guard` adds the web's empty-grid check
const ticks = (items: Rec[], ext: Rec, message: string, guard: boolean) => {
    if (!items.length) return guard ? ['Invalid Submission'] : [];
    return allItemsChecked(items, ext) ? [] : [message];
};

// Issue / receipt / transfer queue cards share a layout
const movementCard = (from: string, to: string): VerificationConfig['card'] => ({
    title: (r) => r.Refno,
    subtitle: (r) => `${r[from] || ''} → ${r[to] || ''}`,
    meta: (r) => [r.Indentno && `Indent ${r.Indentno}`, r.Date].filter(Boolean).join(' · '),
    amount: (r) => money(r.Amount),
});

const movementApprove = (route: string): VerificationConfig['approve'] => ({
    route,
    payload: (r, d, { action, note, user, roleId }) => ({ Refno: r.Refno, Appstatus: action, ActionRemarks: note, RoleID: String(roleId), Createdby: user }),
    ok: ['Submitted'],
});

export const STOCK_CONFIGS: Record<string, VerificationConfig> = {
    // Legacy /Purchase/VerfiyNewStockIssue (+ Grid / View / ViewNewStockIssueGrid)
    NewStockIssue: {
        title: 'New Stock Issue Verification',
        successLabel: 'New Stock Issue',
        noun: 'stock issue',
        icon: PackageOpen,
        searchPlaceholder: 'Search by transaction, indent, cost center…',
        queue: { route: 'Purchase/GetVerifyNewStockIssueGrid', params: ({ roleId, userId }) => ({ RoleId: roleId, Userid: userId }) },
        itemKey: (r) => r.Rid,
        card: movementCard('FromCC', 'ToCC'),
        searchText: (r) => `${r.Refno} ${r.Indentno} ${r.FromCC} ${r.ToCC} ${r.Date} ${r.Amount}`,
        detail: { route: 'Purchase/GetVerifyNewStockIssueView', params: (r) => ({ Rowid: r.Rid }) },
        rowAux: [{ name: 'nsiItems', route: 'Purchase/ViewNewStockIssueGrid', params: (r) => ({ Trno: r.Refno }) }],
        moid: (r, d) => d.MOID || r.MOID,
        remarksKey: (r) => r.Refno,
        // Legacy drops Return from this screen's status list; returned rows open the same view
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.Refno, subtitle: (r) => money(r.Amount), chips: (r) => [r.Indentno && `Indent ${r.Indentno}`, returnedChip(r)] },
        sections: (r) => [{
            fields: [
                ['Transaction No', r.Refno], ['Indent No', r.Indentno], ['From Cost Center', r.FromCC], ['To Cost Center', r.ToCC],
                ['Issue Date', r.Date], ['Expected Received Date', r.TransactionDate], ['Amount', money(r.Amount)],
            ],
        }],
        extra: (r, d, { aux, ext, setExt, openSheet }) => {
            const items = list(aux.nsiItems);
            const total = items.reduce((a, it) => a + (Number(it.OItemamt) || 0), 0);
            return (
                <CheckedItems
                    title="Issued items"
                    items={items}
                    ext={ext}
                    setExt={setExt}
                    // Legacy links item codes to the MRR breakup pop-up (NewStockIssueSummaryPopup)
                    onItemPress={(it) => openSheet(stockBreakupSheet(it.OItemcode, 'Purchase/NewStockIssueSummaryPopup', { Itemcode: it.OItemcode, Refno: r.Refno }))}
                    columns={[
                        { label: 'Item Code', render: (it) => it.OItemcode, link: true },
                        { label: 'Item Name', render: (it) => it.OItemname, align: 'left' },
                        { label: 'Specification', render: (it) => it.OItemspecification, align: 'left' },
                        { label: 'Description', render: (it) => it.SIndRemarks, align: 'left' },
                        { label: 'Units', render: (it) => it.OUnits },
                        { label: 'Qty', render: (it) => it.OItemqty },
                        { label: 'Amount', render: (it) => fmt(it.OItemamt) },
                    ]}
                    footer={<TotalLine value={fmt(items[0]?.OSumTotal ?? total)} />}
                />
            );
        },
        beforeAction: (action, r, d, { aux, ext }) => ticks(list(aux.nsiItems), ext, 'Please Verify ItemCodes', true),
        approve: movementApprove('Purchase/ApproveNewStockIssue'),
    },

    // Legacy /Purchase/VerifyOldStockIssue (+ Grid / View / ViewOldStockIssueGrid)
    OldStockIssue: {
        title: 'Old Stock Issue Verification',
        successLabel: 'Old Stock Issue',
        noun: 'stock issue',
        icon: Recycle,
        searchPlaceholder: 'Search by transaction, indent, cost center…',
        queue: { route: 'Purchase/GetVerfiyOldStockIssueGrid', params: ({ roleId, userId }) => ({ RoleId: roleId, Userid: userId }) },
        itemKey: (r) => r.Rid,
        card: movementCard('FromCC', 'ToCC'),
        searchText: (r) => `${r.Refno} ${r.Indentno} ${r.FromCC} ${r.ToCC} ${r.Date} ${r.Amount}`,
        detail: { route: 'Purchase/GetVerifyOldStockIssueView', params: (r) => ({ Rowid: r.Rid }) },
        rowAux: [{ name: 'osiItems', route: 'Purchase/ViewOldStockIssueGrid', params: (r) => ({ Trno: r.Refno }) }],
        moid: (r, d) => d.MOID || r.MOID,
        remarksKey: (r) => r.Refno,
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.Refno, subtitle: (r) => money(r.Amount), chips: (r) => [r.Indentno && `Indent ${r.Indentno}`, returnedChip(r)] },
        sections: (r) => [{
            fields: [
                ['Transaction No', r.Refno], ['Indent No', r.Indentno], ['From Cost Center', r.FromCC], ['To Cost Center', r.ToCC],
                ['Issue Date', r.Date], ['Expected Received Date', r.TransactionDate], ['Amount', money(r.Amount)],
            ],
        }],
        extra: (r, d, { aux, ext, setExt }) => {
            const items = list(aux.osiItems);
            // Legacy builds the depreciation columns from the first item: asset codes (not starting with "1") carry them
            const dep = items.length > 0 && !String(items[0].OItemcode || '').trim().startsWith('1');
            const sum = (k: string) => items.reduce((a, it) => a + (Number(it[k]) || 0), 0);
            return (
                <CheckedItems
                    title="Issued items"
                    items={items}
                    ext={ext}
                    setExt={setExt}
                    columns={[
                        { label: 'Item Code', render: (it) => it.OItemcode },
                        { label: 'Item Name', render: (it) => it.OItemname, align: 'left' },
                        { label: 'Specification', render: (it) => it.OItemspecification, align: 'left' },
                        { label: 'Qty', render: (it) => it.OItemqty },
                        { label: 'Amount', render: (it) => fmt(it.BefDepAmt) },
                        ...(dep ? [
                            { label: 'Dep %', render: (it: Rec) => it.Deppercent },
                            { label: 'Depreciation Value', render: (it: Rec) => fmt(it.AftDepAmt) },
                        ] : []),
                    ]}
                    footer={(
                        <>
                            <TotalLine value={fmt(sum('BefDepAmt'))} />
                            {dep ? <TotalLine label="Depreciation value" value={fmt(sum('AftDepAmt'))} /> : null}
                        </>
                    )}
                />
            );
        },
        // Legacy only checks the ticks here (no empty-grid guard like New Stock Issue)
        beforeAction: (action, r, d, { aux, ext }) => ticks(list(aux.osiItems), ext, 'Please Verify ItemCodes', false),
        approve: movementApprove('Purchase/ApproveOldStockIssue'),
    },

    // Legacy /Purchase/VerifyOldStockReceived (+ Grid / View / ViewOldStockReceivedGrid)
    OldStockReceived: {
        title: 'Old Stock Received Verification',
        successLabel: 'Old Stock Received',
        noun: 'stock receipt',
        icon: PackageCheck,
        searchPlaceholder: 'Search by transaction, indent, cost center…',
        queue: { route: 'Purchase/GetVerfiyOldStockReceivedGrid', params: ({ roleId, userId }) => ({ RoleId: roleId, Userid: userId }) },
        itemKey: (r) => r.Rid,
        card: movementCard('FromCC', 'ToCC'),
        searchText: (r) => `${r.Refno} ${r.Indentno} ${r.FromCC} ${r.ToCC} ${r.Date} ${r.Amount}`,
        detail: { route: 'Purchase/GetVerifyOldStockReceivedView', params: (r) => ({ Rowid: r.Rid }) },
        rowAux: [{ name: 'osrItems', route: 'Purchase/ViewOldStockReceivedGrid', params: (r) => ({ Trno: r.Refno }) }],
        moid: (r, d) => d.MOID || r.MOID,
        remarksKey: (r) => r.Refno,
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.Refno, subtitle: (r) => money(r.Amount), chips: (r) => [r.Indentno && `Indent ${r.Indentno}`, returnedChip(r)] },
        sections: (r) => [{
            fields: [
                ['Transaction No', r.Refno], ['Indent No', r.Indentno], ['From Cost Center', r.FromCC], ['To Cost Center', r.ToCC],
                ['Date', r.Date], ['Expected Received Date', r.Expdate], ['Amount', money(r.Amount)],
            ],
        }],
        extra: (r, d, { aux, ext, setExt }) => {
            const items = list(aux.osrItems);
            // Legacy builds the depreciation columns (and the total) from the first item: asset codes don't start with "1"
            const dep = items.length > 0 && !String(items[0].Itemcode || '').trim().startsWith('1');
            const total = items.reduce((a, it) => a + (Number(it.Amount) || 0), 0);
            return (
                <CheckedItems
                    title="Received items"
                    items={items}
                    ext={ext}
                    setExt={setExt}
                    columns={[
                        { label: 'Item Code', render: (it) => it.Itemcode },
                        { label: 'Item Name', render: (it) => it.Itemname, align: 'left' },
                        { label: 'Specification', render: (it) => it.Specification, align: 'left' },
                        { label: 'Units', render: (it) => it.Units },
                        { label: 'Qty', render: (it) => it.Quantity },
                        { label: 'Basic', render: (it) => fmt(it.Basic) },
                        ...(dep ? [
                            { label: 'Dep %', render: (it: Rec) => it.Deppercent },
                            { label: 'After Dep Amount', render: (it: Rec) => fmt(it.Amount) },
                        ] : []),
                    ]}
                    footer={dep ? <TotalLine value={fmt(total)} /> : null}
                />
            );
        },
        beforeAction: (action, r, d, { aux, ext }) => ticks(list(aux.osrItems), ext, 'Please Verify ItemCodes', false),
        approve: movementApprove('Purchase/ApproveOldStockIssueRecieved'),
    },

    // Legacy /Purchase/VerifyNewStockTransfer (+ Grid / View / ViewNewStockGrid)
    NewStockTransfer: {
        title: 'New Stock Transfer Verification',
        successLabel: 'New Stock Transfer',
        noun: 'stock transfer',
        icon: ArrowLeftRight,
        searchPlaceholder: 'Search by transaction, cost center…',
        queue: { route: 'Purchase/GetVerifyNewStockTransferGrid', params: ({ roleId, userId }) => ({ RoleId: roleId, Userid: userId }) },
        itemKey: (r) => r.Rid,
        card: {
            title: (r) => r.Refno,
            subtitle: (r) => `${r.CCCode || ''} → ${r.RCCCode || ''}`,
            meta: (r) => [r.CCType, r.Date].filter(Boolean).join(' · '),
            amount: (r) => money(r.Amount),
        },
        searchText: (r) => `${r.Refno} ${r.CCCode} ${r.RCCCode} ${r.CCType} ${r.Date} ${r.Amount}`,
        detail: { route: 'Purchase/GetVerifyNewStockTransferView', params: (r) => ({ Rowid: r.Rid }) },
        rowAux: [{ name: 'nstItems', route: 'Purchase/ViewNewStockGrid', params: (r) => ({ Trno: r.Refno }) }],
        moid: (r, d) => d.MOID || r.MOID,
        remarksKey: (r) => r.Refno,
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.Refno, subtitle: (r) => money(r.Amount), chips: (r) => [r.CCType, returnedChip(r)] },
        sections: (r) => [{
            fields: [
                ['Transaction No', r.Refno], ['Sending Cost Center', r.CCCode], ['Receiving Cost Center', r.RCCCode],
                ['Receiving CC Type', r.CCType], ['Date', r.Date], ['Expected Received Date', r.Expdate], ['Amount', money(r.Amount)],
            ],
        }],
        extra: (r, d, { aux, ext, setExt, openSheet }) => {
            const items = list(aux.nstItems);
            const total = items.reduce((a, it) => a + (Number(it.OItemamt) || 0), 0);
            return (
                <CheckedItems
                    title="Transferred items"
                    items={items}
                    ext={ext}
                    setExt={setExt}
                    // Legacy links item codes to the MRR breakup pop-up (NewStockTransferSummaryPopup)
                    onItemPress={(it) => openSheet(stockBreakupSheet(it.OItemcode, 'Purchase/NewStockTransferSummaryPopup', { Itemcode: it.OItemcode, Refno: r.Refno }))}
                    columns={[
                        { label: 'Item Code', render: (it) => it.OItemcode, link: true },
                        { label: 'Item Name', render: (it) => it.OItemname, align: 'left' },
                        { label: 'Specification', render: (it) => it.OItemspecification, align: 'left' },
                        { label: 'Remarks', render: (it) => it.SIndRemarks, align: 'left' },
                        { label: 'Units', render: (it) => it.OUnits },
                        { label: 'Qty', render: (it) => it.OItemqty },
                        { label: 'Amount', render: (it) => fmt(it.OItemamt) },
                    ]}
                    footer={<TotalLine value={fmt(items[0]?.OSumTotal ?? total)} />}
                />
            );
        },
        beforeAction: (action, r, d, { aux, ext }) => ticks(list(aux.nstItems), ext, 'Please Verify ItemCodes', false),
        approve: movementApprove('Purchase/ApproveNewStockTransfer'),
    },

    // Legacy /Purchase/VerifyItemsTransfer?CCType=PCC|NPCC (+ Grid / View / ViewItemTransferDetailsGridView).
    // Level-driven: see the Items Transfer block in parts.tsx
    ItemsTransfer: {
        title: 'Stock Transfer Verification',
        successLabel: 'Stock Transfer',
        noun: 'transfer',
        icon: Truck,
        searchPlaceholder: 'Search by transfer no, indent, cost center…',
        queue: {
            route: 'Purchase/VerifyItemsTransferGrid',
            params: ({ roleId, userId, path, category }) => ({ Roleid: roleId, Created: '', Userid: userId, CCType: itemsTransferCCType(path, category) }),
        },
        itemKey: (r) => r.ItId,
        card: {
            title: (r) => r.Refno,
            subtitle: (r) => `${r.FromCC || ''} → ${r.ToCC || ''}`,
            meta: (r) => [r.IndentNo && `Indent ${r.IndentNo}`, r.Date].filter(Boolean).join(' · '),
        },
        searchText: (r) => `${r.Refno} ${r.IndentNo} ${r.FromCC} ${r.ToCC} ${r.Date}`,
        // The row's approval levels for this role decide what the verifier sees and sends
        detail: { route: 'Purchase/GetItemtransferLevels', params: (r, { roleId }) => ({ MOID: r.MOID, Roleid: roleId }) },
        rowAux: [
            { name: 'itItems', route: 'Purchase/GetItemstransferDetails', params: (r, d) => ({ Refno: r.Refno, PLevel: d.IndentPresentLevel, DLevel: d.IndentDefineLevel }) },
            { name: 'itRemarks', route: 'Purchase/GetItemsTransferRemarks', params: (r) => ({ Refno: r.Refno }) },
            {
                name: 'itDep', route: 'Purchase/GetItemDepPercentbyCC', params: (r) => ({ FromCC: r.FromCC, ToCC: r.ToCC }),
                when: (r, d) => Number(d.IndentPresentLevel) >= Number(d.IndentDefineLevel),
            },
        ],
        moid: (r) => r.MOID,
        remarksKey: (r) => r.Refno,
        // Legacy never offers Return here; at the define level of a non-performing transfer only Verify
        showReturn: 'No',
        excludeActions: (r, d) => (Number(d.IndentPresentLevel) === Number(d.IndentDefineLevel) && r.CCType !== 'Performing'
            ? ['return', 'approve', 'reject'] : ['return']),
        // Returned performing transfers open the full entry editor (UpdateItemsTransferView) in legacy
        isReturned: (r) => String(r.Status).trim() === '0' && r.CCType === 'Performing',
        returnedNotice: 'Correct and resubmit it from the Items Transfer screen — there is nothing to verify until it is resubmitted.',
        header: {
            title: (r) => r.Refno,
            subtitle: (r) => `${r.FromCC || ''} → ${r.ToCC || ''}`,
            chips: (r) => [r.CCType, r.IndentNo && `Indent ${r.IndentNo}`, returnedChip(r)],
        },
        sections: (r) => [{
            fields: [
                ['Ref No', r.Refno], ['Indent No', r.IndentNo], ['Sending Cost Center', r.FromCC], ['Receiving Cost Center', r.ToCC],
                ['Date', r.Date], ['Expected Received Date', r.Expdate],
            ],
        }],
        extra: (r, d, { aux, ext, setExt }) => {
            const depCfg = aux.itDep || {};
            const atOrAbove = Number(d.IndentPresentLevel) >= Number(d.IndentDefineLevel);
            const depMissing = atOrAbove && aux.itDep !== undefined && !(Number(depCfg.MaxPercent) > 0);
            return (
                <>
                    {depMissing ? <Alarm text="Please configure the item depreciation percentage — this transfer cannot be verified until it is set up." /> : null}
                    <ItemsTransferItems
                        items={list(aux.itItems)}
                        levels={d}
                        depOptions={itemsTransferDepOptions(depCfg.MaxPercent, r.FromCC, depCfg.CentralStoreCC)}
                        ext={ext}
                        setExt={setExt}
                    />
                    {remarksBlock(list(aux.itRemarks))}
                </>
            );
        },
        beforeAction: (action, r, d, { aux, ext }) => {
            const items = list(aux.itItems);
            const present = Number(d.IndentPresentLevel);
            const define = Number(d.IndentDefineLevel);
            if (!items.length) return ['Invalid Submission'];
            if (!allItemsChecked(items, ext)) return ['Please Verify Transfer Items'];
            if (present < define) return [];
            if (!(Number((aux.itDep || {}).MaxPercent) > 0)) return ['Please Configure Item Depreciation Percentage'];
            // Legacy only looked at the last row; every asset row needs a value
            const missing = String(action).toLowerCase() !== 'reject'
                && items.some((it) => !itemsTransferIsConsumable(it) && !itemsTransferDep(it, ext, present > define));
            return missing ? ['Please Select Depriciation Value'] : [];
        },
        approve: {
            route: 'Purchase/VerifyitemstrasnferBelowDefinelevel',
            payload: (r, d, { action, note, user, roleId, aux, ext }) => {
                const present = Number(d.IndentPresentLevel);
                const define = Number(d.IndentDefineLevel);
                const base = {
                    Refno: r.Refno, Appstatus: action, Remarks: note, Createdby: user, RoleID: String(roleId),
                    IndentPresentLevel: present, IndentDefineLevel: define,
                };
                if (present < define) return { ...base, Rowid: String(r.ItId), ItId: String(r.ItId) };
                const t = itemsTransferApprovalAtDefine(list(aux.itItems), ext, present > define, action);
                return {
                    ...base, Rowid: t.rowIds, ItId: t.rowIds, DepAmounts: t.depAmounts, EffAmount: String(t.effAmount),
                    Depcsk: t.deps, Amount: String(t.amount), IndentNo: r.IndentNo, SumbeforeDep: String(t.sumBefore), SumAfterDep: String(t.sumAfter),
                };
            },
            ok: ['Submitted'],
        },
    },

    // Legacy /Purchase/VerifyItemsTransferIssue?CCType=PCC|NPCC (+ Grid / View / ViewItemTransferissueDetailsGridView)
    ItemsTransferIssue: {
        title: 'Stock Transfer Issue Verification',
        successLabel: 'Stock Transfer Issue',
        noun: 'transfer issue',
        icon: Forklift,
        searchPlaceholder: 'Search by transfer no, cost center…',
        queue: {
            route: 'Purchase/VerifyItemsTransferIssueGrid',
            params: ({ roleId, userId, path, category }) => ({ Roleid: roleId, Created: '', Userid: userId, CCType: itemsTransferCCType(path, category) }),
        },
        itemKey: (r) => r.ItId,
        card: { title: (r) => r.Refno, subtitle: (r) => `${r.FromCC || ''} → ${r.ToCC || ''}`, meta: (r) => r.Date },
        searchText: (r) => `${r.Refno} ${r.FromCC} ${r.ToCC} ${r.Date}`,
        rowAux: [
            { name: 'itiItems', route: 'Purchase/GetItemstransferissueDetails', params: (r) => ({ Refno: r.Refno }) },
            { name: 'itiRemarks', route: 'Purchase/GetItemsTransferissueRemarks', params: (r) => ({ Refno: r.Refno }) },
        ],
        moid: (r) => r.MOID,
        remarksKey: (r) => r.Refno,
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.Refno, subtitle: (r) => `${r.FromCC || ''} → ${r.ToCC || ''}`, chips: (r) => [r.CCType, returnedChip(r)] },
        sections: (r) => [{
            fields: [['Ref No', r.Refno], ['Sending Cost Center', r.FromCC], ['Receiving Cost Center', r.ToCC], ['Date', r.Date], ['Expected Received Date', r.Expdate]],
        }],
        extra: (r, d, { aux, ext, setExt }) => (
            <>
                <CheckedItems
                    title="Transfer items"
                    items={list(aux.itiItems)}
                    ext={ext}
                    setExt={setExt}
                    columns={[
                        { label: 'Item Code', render: (it) => it.ItemCode },
                        { label: 'Item Name', render: (it) => it.ItemName, align: 'left' },
                        { label: 'Specification', render: (it) => it.Specification, align: 'left' },
                        { label: 'DCA', render: (it) => it.DcaCode },
                        { label: 'Sub DCA', render: (it) => it.SubDcaCode },
                        { label: 'Units', render: (it) => it.Units },
                        { label: 'Issued Qty', render: (it) => it.IssQuantity },
                        { label: 'Status', render: (it) => it.ItemStatus },
                    ]}
                />
                {remarksBlock(list(aux.itiRemarks))}
            </>
        ),
        beforeAction: (action, r, d, { aux, ext }) => ticks(list(aux.itiItems), ext, 'Please Verify Transfer Items', true),
        approve: {
            route: 'Purchase/ApproveItemsTransferIssue',
            payload: (r, d, { action, note, user, roleId }) => ({
                Refno: r.Refno, Appstatus: action, Remarks: note, Createdby: user, RoleID: String(roleId), Rowid: String(r.ItId), ItId: String(r.ItId),
            }),
            ok: ['Submitted'],
        },
    },

    // Legacy /Purchase/VerifyCapitalStockIssue (+ Grid / View / ViewCapitalIssueDetailsGridView) — stock conversion
    // into a capital (master) item
    CapitalStockIssue: {
        title: 'Stock Conversion Verification',
        successLabel: 'Stock Conversion',
        noun: 'stock conversion',
        icon: Combine,
        searchPlaceholder: 'Search by transaction, cost center, master item…',
        queue: { route: 'Purchase/VerifyCapitalStockIssueGrid', params: ({ roleId, userId }) => ({ Roleid: roleId, Created: '', Userid: userId }) },
        itemKey: (r) => r.Rid || r.Tranno,
        card: {
            title: (r) => r.Tranno,
            subtitle: (r) => [r.MasterItemCode, r.ItemName].filter(Boolean).join(' - '),
            meta: (r) => [r.CostCenter, r.Date].filter(Boolean).join(' · '),
        },
        searchText: (r) => `${r.Tranno} ${r.CostCenter} ${r.MasterItemCode} ${r.ItemName} ${r.Date}`,
        rowAux: [{ name: 'csiItems', route: 'Purchase/GetCapitalIssueDetails', params: (r) => ({ TranNo: r.Tranno }) }],
        moid: (r) => r.MOID,
        remarksKey: (r) => r.Tranno,
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.Tranno, subtitle: (r) => [r.MasterItemCode, r.ItemName].filter(Boolean).join(' - '), chips: (r) => [r.CostCenter, r.Date] },
        sections: (r) => [{
            fields: [
                ['Transaction No', r.Tranno], ['Cost Center', r.CostCenter], ['Date', r.Date],
                ['Master Item Code', r.MasterItemCode], ['Master Item Name', r.ItemName],
            ],
        }],
        extra: (r, d, { aux, ext, setExt }) => (
            <CheckedItems
                title="Issued items"
                items={list(aux.csiItems)}
                ext={ext}
                setExt={setExt}
                columns={[
                    { label: 'Item Code', render: (it) => it.ItemCode },
                    { label: 'Item Name', render: (it) => it.ItemName, align: 'left' },
                    { label: 'Specification', render: (it) => it.Specification, align: 'left' },
                    { label: 'Units', render: (it) => it.Units },
                    { label: 'Basic', render: (it) => fmt(it.Basic) },
                    { label: 'Issue Qty', render: (it) => it.IssueQty },
                    { label: 'Transfer Qty', render: (it) => it.TransferQty },
                ]}
            />
        ),
        beforeAction: (action, r, d, { aux, ext }) => ticks(list(aux.csiItems), ext, 'Please Verify Capital Issue Items', true),
        approve: {
            route: 'Purchase/ApproveCapitalStockIssue',
            // The API reads the action from Status (legacy controller: IC.Status = appstatus)
            payload: (r, d, { action, note, user, roleId }) => ({ Tranno: r.Tranno, Status: action, Remarks: note, Createdby: user, RoleID: String(roleId) }),
            ok: ['Submitted'],
        },
    },

    // Legacy /Purchase/VerifyDirectStockUpdation (+ Grid / View / ViewDirectStockUpdationDetailsGridview)
    DirectStockUpdation: {
        title: 'Direct Stock Updation Verification',
        successLabel: 'Direct Stock Updation',
        noun: 'stock updation',
        icon: PackagePlus,
        searchPlaceholder: 'Search by request no, cost center, date…',
        queue: { route: 'Purchase/VerifyDirectStockUpdationGrid', params: ({ roleId, userId }) => ({ Roleid: roleId, Created: '', Userid: userId }) },
        itemKey: (r) => r.DirectStockUpdationId || r.RequestNo,
        card: { title: (r) => r.RequestNo, subtitle: (r) => r.RequestCC, meta: (r) => r.RequestDate, amount: (r) => money(r.Amount) },
        searchText: (r) => `${r.RequestNo} ${r.RequestCC} ${r.RequestDate} ${r.Amount}`,
        rowAux: [
            { name: 'dsuItems', route: 'Purchase/GetDirectStockDataDetails', params: (r) => ({ Requestno: r.RequestNo }) },
            { name: 'dsuRemarks', route: 'Purchase/GetDirectStockRemarks', params: (r) => ({ Requestno: r.RequestNo }) },
        ],
        moid: (r) => r.MOID,
        remarksKey: (r) => r.RequestNo,
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.RequestNo, subtitle: (r) => money(r.Amount), chips: (r) => [r.RequestCC, r.RequestDate, returnedChip(r)] },
        sections: (r) => [{ fields: [['Request No', r.RequestNo], ['Date', r.RequestDate], ['Cost Center', r.RequestCC], ['Amount', money(r.Amount)]] }],
        extra: (r, d, { aux, ext, setExt }) => {
            const items = list(aux.dsuItems);
            const total = items[0]?.TotalAmount ?? items.reduce((a, it) => a + (Number(it.Amount) || 0), 0);
            return (
                <>
                    <CheckedItems
                        title="Items"
                        items={items}
                        ext={ext}
                        setExt={setExt}
                        columns={[
                            { label: 'Item Code', render: (it) => it.ItemCode },
                            { label: 'Item Name', render: (it) => it.ItemName, align: 'left' },
                            { label: 'Specification', render: (it) => it.Specification, align: 'left' },
                            { label: 'DCA', render: (it) => it.DcaCode },
                            { label: 'Sub DCA', render: (it) => it.SubDcaCode },
                            { label: 'Basic Price', render: (it) => fmt(it.BasicPrice) },
                            { label: 'Units', render: (it) => it.Units },
                            { label: 'Requested Qty', render: (it) => it.Quantity },
                            { label: 'Amount', render: (it) => fmt(it.Amount) },
                        ]}
                        footer={items.length ? <TotalLine label="Sub total" value={fmt(total)} /> : null}
                    />
                    {remarksBlock(list(aux.dsuRemarks))}
                </>
            );
        },
        beforeAction: (action, r, d, { aux, ext }) => ticks(list(aux.dsuItems), ext, 'Please Verify Item Codes', false),
        approve: {
            route: 'Purchase/ApproveDirectStockUpdation',
            payload: (r, d, { action, note, user, roleId }) => ({ RequestNo: r.RequestNo, Appstatus: action, Remarks: note, Createdby: user, RoleID: String(roleId) }),
            ok: ['Submitted'],
        },
    },

    // Legacy /Purchase/VerifyStoreClosing (+ Grid / View). ClosingTypeid: 1 Store Closing, 2 Store Suspend,
    // 3 Store Closing Reschedule, 4 Store Suspend Reschedule
    StoreClosing: {
        title: 'Store Closing Verification',
        successLabel: 'Store Closing',
        noun: 'store closing',
        icon: Store,
        searchPlaceholder: 'Search by cost center, type, date…',
        queue: { route: 'Purchase/VerifyStoreClosingGrid', params: ({ roleId, userId }) => ({ Roleid: roleId, Created: '', Userid: userId }) },
        itemKey: (r) => `${r.IId}|${r.Tranno}`,
        card: { title: (r) => r.CCCode, subtitle: (r) => r.ClosingType, meta: (r) => r.ClosingDate },
        searchText: (r) => `${r.CCCode} ${r.ClosingType} ${r.ClosingDate} ${r.Tranno}`,
        detail: { route: 'Purchase/VerifyStoreClosingView', params: (r) => ({ Tranno: r.Tranno, Rid: r.IId, Typeid: r.ClosingTypeid }) },
        // Same pending checks the Store Closing entry screen runs (legacy /Reports/ViewStorePendingDetails)
        rowAux: [
            { name: 'scPendings', route: 'Accounts/GetCCStorePendings', params: (r) => ({ CCCode: r.CCCode, Type: 'Store' }) },
            { name: 'scBalance', route: 'Accounts/GetCCBalanceStock', params: (r) => ({ CCCode: r.CCCode }) },
        ],
        moid: (r, d) => d.SMOID || r.MOID,
        remarksKey: (r) => r.Tranno,
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: {
            title: (r, d) => `${d.SCCCode || r.CCCode}${d.SCCName ? ` - ${d.SCCName}` : ''}`,
            subtitle: (r, d) => d.SCCClosingType || r.ClosingType,
            chips: (r) => [r.ClosingDate],
        },
        sections: (r, d) => [{ fields: [['Closing Type', d.SCCClosingType], ['Cost Center', d.SCCCode], ['Cost Center Name', d.SCCName]] }],
        extra: (r, d, { aux, ext, setExt }) => {
            const pendings = list(aux.scPendings);
            const balance = list(aux.scBalance);
            return (
                <>
                    <StoreCloseEditor d={d} ext={ext} setExt={setExt} />
                    {pendings.length ? (
                        <TableBlock title="Pending approvals" heads={['Master Code', 'Pending With', 'Details']}
                            rows={pendings.map((p) => [p.MasterCode, p.PendingRoleName || p.RoleName, p.PendingDetails])} />
                    ) : null}
                    {balance.length ? (
                        <TableBlock title="Balance stock" heads={['Item Code', 'Item Name', 'Specification', 'Qty']}
                            rows={balance.map((b) => [b.ItemCode, b.ItemName, b.Specification, b.Quantity])} />
                    ) : null}
                </>
            );
        },
        beforeAction: (action, r, d, { ext }) => {
            const v = storeCloseValues(d, ext);
            const { plus30, closeMin } = storeCloseBounds(d);
            const type = String(d.SClosingTypeid);
            const errors: string[] = [];
            if ((type === '1' || type === '3') && !v.closingDate) errors.push('Select Closing Date');
            // The web's date input caps a reschedule at 30 days out; the phone picker has no max, so check it here
            if (type === '3' && v.closingDate && (v.closingDate > plus30 || (closeMin && v.closingDate < closeMin))) {
                errors.push('Closing Date must be between the requested date and 30 days from today');
            }
            if (type === '2' || type === '4') {
                if (!v.startDate) errors.push('Select Start Date');
                if (!v.endDate) errors.push('Select End Date');
                if (v.startDate && v.endDate && v.endDate < v.startDate) errors.push('End Date cannot be before Start Date');
            }
            if (!v.alertNote.trim()) errors.push('Enter Alert Note');
            return errors;
        },
        approve: {
            route: 'Purchase/ApproveStoreClose',
            payload: (r, d, { action, note, user, roleId, userId, ext }) => {
                const v = storeCloseValues(d, ext);
                const type = String(d.SClosingTypeid);
                return {
                    STranno: d.STranno || r.Tranno, SId: d.SId || r.IId, Appstatus: action, SRemarks: note,
                    SCCClosingDate: type === '1' || type === '3' ? displayDate(v.closingDate) : '',
                    SAlertnote: v.alertNote.trim().toUpperCase(),
                    SCCStartDate: type === '2' || type === '4' ? displayDate(v.startDate) : '',
                    SCCEndDate: type === '2' || type === '4' ? displayDate(v.endDate) : '',
                    SClosingTypeid: type, SCreatedby: user, SRoleID: String(roleId), SUserId: String(userId),
                };
            },
            ok: ['Submitted'],
        },
    },

    // Legacy /Purchase/VerifyCCStockClose (+ Grid / View)
    CCStockClose: {
        title: 'CC Stock Close Verification',
        successLabel: 'CC Stock Close',
        noun: 'stock close',
        icon: Archive,
        searchPlaceholder: 'Search by cost center, transaction type, dates…',
        queue: { route: 'Purchase/GetVerifyCCStockClose', params: ({ roleId, userId }) => ({ UserId: userId, Roleid: roleId }) },
        itemKey: (r) => r.Transactionrefno,
        card: {
            title: (r) => r.CCName,
            subtitle: (r) => r.TransactionType,
            meta: (r) => [r.FromDate, r.ToDate].filter(Boolean).join(' → '),
            amount: (r) => money(r.Amount),
        },
        searchText: (r) => `${r.Transactionrefno} ${r.CCName} ${r.TransactionType} ${r.FromDate} ${r.ToDate} ${r.Amount}`,
        detail: { route: 'Purchase/GetCCStockClosebyNo', params: (r) => ({ TransNo: r.Transactionrefno }) },
        moid: (r, d) => d.MOID || r.MOID,
        remarksKey: (r) => r.Transactionrefno,
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: {
            title: (r, d) => d.CCName || r.CCName,
            subtitle: (r, d) => money(d.ClosingAmount),
            chips: (r, d) => [d.TransactionType, [d.FromDate, d.ToDate].filter(Boolean).join(' → ')],
        },
        sections: (r, d) => [{
            fields: [
                ['Cost Center', d.CCName], ['From Date', d.FromDate], ['To Date', d.ToDate],
                ['Stock Amount', money(d.StockAmount)], ['Last Closing Amount', money(d.LastClosingAmount)], ['Current Value', money(d.CurrentValue)],
                ['Transaction Type', d.TransactionType], ['Amount', money(d.Amount)], ['Closing Amount', money(d.ClosingAmount)],
            ],
        }],
        approve: {
            route: 'Purchase/ApproveCCStockClose',
            payload: (r, d, { action, note, user, roleId }) => ({
                Transactionrefno: d.Transactionrefno || r.Transactionrefno, CCCode: d.CCCode, Action: action, Remarks: note,
                Amount: d.Amount, Roleid: roleId, CreatedBy: user,
            }),
            ok: ['Submited', 'Submitted'],
        },
    },

    // Legacy /Purchase/VerifyAssetSale (+ Grid / View / ViewAssetSaleDetailsGridview)
    AssetSale: {
        title: 'Asset Sale Verification',
        successLabel: 'Asset Sale',
        noun: 'asset sale',
        icon: HandCoins,
        searchPlaceholder: 'Search by request no, item code, date…',
        queue: { route: 'Purchase/VerifyAssetSaleGrid', params: ({ roleId, userId }) => ({ Roleid: roleId, Created: '', Userid: userId }) },
        itemKey: (r) => `${r.RequestNo}|${r.ItemId}`,
        card: { title: (r) => r.RequestNo, subtitle: (r) => r.ItemCode, meta: (r) => r.RequestDate, amount: (r) => money(r.Amount) },
        searchText: (r) => `${r.RequestNo} ${r.ItemCode} ${r.RequestDate} ${r.Amount}`,
        detail: { route: 'Purchase/GetAssetSaleDetails', params: (r) => ({ Requestno: r.RequestNo, Rid: r.ItemId }) },
        rowAux: [{ name: 'asItems', route: 'Purchase/GetAssetSaleDataDetails', params: (r) => ({ Requestno: r.RequestNo, Rid: r.ItemId }) }],
        moid: (r, d) => d.MOID || r.MOID,
        remarksKey: (r) => r.RequestNo,
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.RequestNo, subtitle: (r, d) => money(d.SellAmount), chips: (r) => [r.ItemCode, r.RequestDate] },
        sections: (r, d) => [{
            fields: [
                ['Date', d.SubmitDate], ['Book Value Date', d.BookValueDate], ['Amount', money(d.VAmount)],
                ['Asset Selling Amount', money(d.SellAmount)], ['Profit on Sale', money(d.Profit)], ['Loss on Sale', money(d.Loss)],
                ['Buyer', d.PartyName], ['Buyer Address', d.PartyAddress, true],
            ],
        }],
        extra: (r, d, { aux, ext, setExt }) => (
            <CheckedItems
                title="Items"
                items={list(aux.asItems)}
                ext={ext}
                setExt={setExt}
                columns={[
                    { label: 'Item Code', render: (it) => it.ItemCode },
                    { label: 'Item Name', render: (it) => it.ItemName, align: 'left' },
                    { label: 'Specification', render: (it) => it.Specification, align: 'left' },
                    { label: 'Basic Price', render: (it) => fmt(it.BasicPrice) },
                    { label: 'Units', render: (it) => it.Units },
                    { label: 'Amount', render: (it) => fmt(it.Amount) },
                ]}
            />
        ),
        beforeAction: (action, r, d, { aux, ext }) => ticks(list(aux.asItems), ext, 'Please Verify Item Code', false),
        approve: {
            route: 'Purchase/ApproveAssetSale',
            payload: (r, d, { action, note, user, roleId, userId }) => ({
                RequestNo: r.RequestNo, ItemId: String(r.ItemId), Appstatus: action, Remarks: note,
                Createdby: user, RoleID: String(roleId), UserId: String(userId),
            }),
            ok: ['Submitted'],
        },
    },

    // Legacy /Purchase/VerifyAssetSaleReceipt (+ Grid / View)
    AssetSaleReceipt: {
        title: 'Asset Sale Receipt Verification',
        successLabel: 'Asset Sale Receipt',
        noun: 'receipt',
        icon: ReceiptText,
        searchPlaceholder: 'Search by transaction, request no, item code…',
        queue: { route: 'Purchase/VerifyAssetSaleReceiptGrid', params: ({ roleId, userId }) => ({ Roleid: roleId, Created: '', Userid: userId }) },
        itemKey: (r) => `${r.Refno}|${r.IId}`,
        card: {
            title: (r) => r.Refno,
            subtitle: (r) => [r.Requestno && `Request ${r.Requestno}`, r.ItemCode].filter(Boolean).join(' · '),
            meta: (r) => r.RecieptDate,
            amount: (r) => money(r.SellingAmount),
        },
        searchText: (r) => `${r.Refno} ${r.Requestno} ${r.ItemCode} ${r.RecieptDate} ${r.SellingAmount}`,
        detail: { route: 'Purchase/VerifyAssetSaleReceiptView', params: (r) => ({ Refno: r.Refno, Rid: r.IId }) },
        moid: (r, d) => d.MOID || r.MOID,
        remarksKey: (r) => r.Refno,
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.Refno, subtitle: (r, d) => money(d.BankAmount ?? r.SellingAmount), chips: (r) => [r.Requestno && `Request ${r.Requestno}`, r.RecieptDate] },
        sections: (r, d) => [{
            title: 'Asset',
            fields: [['Item Code', d.ItemCode], ['Item Name', d.ItemName], ['Specification', d.Specification], ['Buyer Name', d.Name], ['Buyer Address', d.Address, true]],
        }, {
            title: 'Payment details',
            fields: [
                ['Bank Name', d.BankName], ['Payment Date', d.BankDate], ['Mode of Pay', d.Modeofpay],
                ['No', d.BankNo], ['Amount', money(d.BankAmount)], ['Remarks', d.BankRemarks, true],
            ],
        }],
        approve: {
            route: 'Purchase/ApproveAssetSaleReceipt',
            payload: (r, d, { action, note, user, roleId, userId }) => ({
                Refno: r.Refno, ItemId: String(d.IId ?? r.IId), Appstatus: action, Remarks: note,
                Createdby: user, RoleID: String(roleId), UserId: String(userId),
            }),
            ok: ['Submitted'],
        },
    },

    // Legacy /Purchase/VerifyItemCodeUpdation (+ Grid / View). The verifier may correct the requested values;
    // approval first re-runs ItemCodeCheckPendings, then ApproveUpdateItemCode
    ItemCodeUpdation: {
        title: 'Item Code Updation Verification',
        successLabel: 'Item Code Updation',
        noun: 'item code update',
        icon: PackageSearch,
        searchPlaceholder: 'Search by item code, name…',
        queue: { route: 'Purchase/VerifyItemCodeUpdationGrid', params: ({ roleId }) => ({ Roleid: roleId }) },
        itemKey: (r) => r.Rowid,
        card: { title: (r) => r.ItemCode, subtitle: (r) => r.Itemname, amount: (r) => money(r.Basicprice) },
        searchText: (r) => `${r.ItemCode} ${r.Itemname} ${r.Basicprice}`,
        detail: { route: 'Purchase/GetViewItemCodeverificatioUpdation', params: (r) => ({ Status: r.Status, Rid: r.Rowid }) },
        rowAux: [
            { name: 'icuHsn', route: 'Purchase/GetHsnupd', params: (r) => ({ Itemcode: r.ItemCode }) },
            { name: 'icuUnits', route: 'Purchase/GetAllUnitsupd', params: () => ({}) },
            { name: 'icuRemarks', route: 'Purchase/GetItemCodeRemarks', params: (r, d) => ({ TranNo: d.TranNo }), when: (r, d) => !!d.TranNo },
        ],
        moid: (r, d) => d.MOID,
        showReturn: 'No',
        excludeActions: () => ['return'],
        header: { title: (r) => r.ItemCode, subtitle: (r, d) => d.Itemname || r.Itemname },
        sections: (r, d) => [{
            title: 'Connected item',
            fields: d.ConnectedTanNo != null
                ? [['Connected Item Code', d.ConnectedItemcode], ['Connected DCA', d.ConnectedDCA], ['Connected Sub DCA', d.ConnectedSDca]]
                : [],
        }],
        extra: (r, d, { aux, ext, setExt }) => {
            const remarks = list(aux.icuRemarks);
            return (
                <>
                    <ItemCodeUpdationEditor d={d} aux={aux} ext={ext} setExt={setExt} />
                    {remarks.length ? (
                        <TableBlock title="Remarks" heads={['By', 'Action', 'Role', 'Remarks']}
                            rows={remarks.map((x) => [x.ActionBy, x.Action, x.ActionRole, x.ActionRemarks])} />
                    ) : null}
                </>
            );
        },
        beforeAction: async (action, r, d, { ext }) => {
            const v = itemCodeUpdValues(d, ext);
            const errors = [
                !v.Itemname.trim() && 'Please Enter Item Name',
                !(Number(v.Basicprice) > 0) && 'Invalid Basic Price',
                !v.HSNCode && 'Select HSN',
                !v.Specification.trim() && 'Please Enter Specification',
                !v.Units && 'Select Units',
            ].filter(Boolean) as string[];
            if (errors.length) return errors;
            // Legacy re-checks for other pending updates of the same item before approving
            try {
                const st = statusOf(await postRoute('Purchase/ItemCodeCheckPendings', { ItemCode: r.ItemCode }));
                return st === 'Successfull' ? [] : [st || 'This item code has pending transactions'];
            } catch (e: any) {
                return [e?.message || 'Could not check pending transactions for this item'];
            }
        },
        approve: {
            route: 'Purchase/ApproveUpdateItemCode',
            payload: (r, d, { action, note, user, roleId, ext }) => {
                const v = itemCodeUpdValues(d, ext);
                return {
                    UItemCode: r.ItemCode, UItemname: v.Itemname.trim().toUpperCase(), UBasicprice: String(v.Basicprice), UHSNCode: String(v.HSNCode),
                    USpecification: v.Specification.trim(), UUnits: String(v.Units), UDate: new Date().toString(), URemarks: note,
                    URid: String(r.Rowid), UAppstatus: action, URoleID: String(roleId), UCreatedby: user,
                };
            },
            ok: ['Submitted'],
        },
    },
};
