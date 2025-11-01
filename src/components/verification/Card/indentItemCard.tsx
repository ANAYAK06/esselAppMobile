// src/components/verification/Card/IndentItemCard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Package, CheckCircle2 } from 'lucide-react-native';

interface IndentItemCardProps {
    itemCode: string;
    itemName: string;
    specification: string;
    quantity: number | string;          // ActuallQty - original requested quantity
    transferredQty?: number | string;   // TransferredQty - already issued/transferred
    unitPrice: number | string;         // Basic price
    lineTotal: number | string;         // IndentValue - total value
}

const IndentItemCard: React.FC<IndentItemCardProps> = ({
                                                           itemCode,
                                                           itemName,
                                                           specification,
                                                           quantity,
                                                           transferredQty = 0,
                                                           unitPrice,
                                                           lineTotal,
                                                       }) => {
    const formatAmount = (amount: number | string) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return numAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatQuantity = (qty: number | string) => {
        const numQty = typeof qty === 'string' ? parseFloat(qty) : qty;
        return numQty.toLocaleString('en-IN');
    };

    // Calculate values
    const actualQty = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
    const transferredQuantity = typeof transferredQty === 'string' ? parseFloat(transferredQty || '0') : (transferredQty || 0);
    const balanceQty = actualQty - transferredQuantity;
    const price = typeof unitPrice === 'string' ? parseFloat(unitPrice) : unitPrice;

    // Calculate amounts
    const totalAmount = typeof lineTotal === 'string' ? parseFloat(lineTotal) : lineTotal;
    const transferredAmount = transferredQuantity * price;
    const balanceAmount = balanceQty * price;

    // Don't render if balance quantity is 0 or negative
    if (balanceQty <= 0) {
        return null;
    }

    return (
        <View className="bg-white mx-4 mb-3 rounded-xl shadow-sm border border-gray-100 p-4">
            {/* Header with Icon */}
            <View className="flex-row items-start mb-3">
                <View className="bg-blue-100 p-2 rounded-lg mr-3">
                    <Package size={20} color="#3b82f6" />
                </View>
                <View className="flex-1">
                    <Text className="text-gray-900 text-base font-bold mb-1" numberOfLines={2}>
                        {itemName}
                    </Text>
                    {specification && (
                        <Text className="text-gray-600 text-sm mb-2" numberOfLines={2}>
                            {specification}
                        </Text>
                    )}
                    <View className="bg-gray-50 px-2 py-1 rounded self-start">
                        <Text className="text-gray-700 text-xs font-medium">
                            Code: {itemCode.trim()}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Divider */}
            <View className="border-t border-gray-200 my-3" />

            {/* Quantity and Price Details */}
            <View className="bg-blue-50 rounded-lg p-3">
                {/* Original Request */}
                <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-600 text-sm">Requested Qty</Text>
                    <Text className="text-gray-900 text-sm font-semibold">
                        {formatQuantity(actualQty)}
                    </Text>
                </View>

                {/* Show transferred quantity if exists */}
                {transferredQuantity > 0 && (
                    <>
                        <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center">
                                <CheckCircle2 size={14} color="#10b981" />
                                <Text className="text-green-600 text-sm ml-1">Transferred Qty</Text>
                            </View>
                            <Text className="text-green-700 text-sm font-semibold">
                                {formatQuantity(transferredQuantity)}
                            </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center">
                                <CheckCircle2 size={14} color="#10b981" />
                                <Text className="text-green-600 text-sm ml-1">Transferred Value</Text>
                            </View>
                            <Text className="text-green-700 text-sm font-semibold">
                                ₹{formatAmount(transferredAmount)}
                            </Text>
                        </View>
                        <View className="border-t border-blue-200 my-2" />
                    </>
                )}

                {/* Balance Quantity */}
                <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-blue-700 text-sm font-bold">Balance Qty</Text>
                    <Text className="text-blue-900 text-sm font-bold">
                        {formatQuantity(balanceQty)}
                    </Text>
                </View>

                {/* Unit Price */}
                <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-600 text-sm">Unit Price</Text>
                    <Text className="text-gray-900 text-sm font-semibold">
                        ₹{formatAmount(price)}
                    </Text>
                </View>

                <View className="border-t border-blue-200 my-2" />

                {/* Balance Amount (Pending) */}
                <View className="flex-row items-center justify-between">
                    <Text className="text-blue-900 text-sm font-bold">Pending Amount</Text>
                    <Text className="text-blue-700 text-lg font-bold">
                        ₹{formatAmount(balanceAmount)}
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default IndentItemCard;