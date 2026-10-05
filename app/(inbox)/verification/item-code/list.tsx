// Item Code verification queue (web: pages/Purchase/VerifyItemCode.jsx)
import React from 'react';
import { router } from 'expo-router';
import { Package } from 'lucide-react-native';
import { getItemCodeQueue, type ItemCodeRow } from '@/src/api/verification/purchaseVerificationAPI';
import VerificationQueueScreen from '@/src/components/verification/kit/VerificationQueueScreen';
import { money } from '@/src/components/verification/kit/VerificationKit';

const load = (roleId: string) => getItemCodeQueue(roleId);

export default function ItemCodeQueue() {
    return (
        <VerificationQueueScreen<ItemCodeRow>
            title="Item Code"
            icon={Package}
            noun="item code"
            searchPlaceholder="Search item name, code, row ID…"
            load={load}
            keyOf={(r) => String(r.Rowid)}
            searchText={(r) => `${r.Itemname} ${r.ItemCode} ${r.Rowid}`}
            card={(r) => ({
                title: r.Itemname || '—',
                subtitle: r.ItemCode,
                meta: `#${r.Rowid}`,
                amount: money(r.Basicprice),
            })}
            onOpen={(r) => router.push({ pathname: '/verification/item-code/[id]', params: { id: String(r.Rowid), row: JSON.stringify(r) } })}
        />
    );
}
