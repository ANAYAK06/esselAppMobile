// Form inputs for the Employee Portal request screens — the web RequestFormBase's
// FormField + input / textarea / select / date picker. Select and date open a BottomSheet
// (one Modal at a time: see src/components/auth/BottomSheet.tsx for the iOS reason).
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, TextInputProps } from 'react-native';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import BottomSheet from '@/src/components/auth/BottomSheet';
import { brand } from '@/src/theme/colors';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Dates travel as 'YYYY-MM-DD' strings, the format the portal endpoints expect
export const toIsoDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const parseIsoDate = (value: string) => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const formatDisplayDate = (value: string) => {
    if (!value) return '';
    const date = parseIsoDate(value);
    return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
};

export const FormField = ({
    label,
    required,
    hint,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    children: React.ReactNode;
}) => (
    <View className="mb-4">
        <Text className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            {label} {required ? <Text className="text-orange-500">*</Text> : null}
        </Text>
        {children}
        {hint ? <Text className="text-xs text-gray-400 mt-1">{hint}</Text> : null}
    </View>
);

const fieldBox = 'flex-row items-center px-3.5 rounded-lg border bg-white';

export const TextField = ({ multiline, ...props }: TextInputProps) => {
    const [focused, setFocused] = useState(false);
    return (
        <TextInput
            {...props}
            multiline={multiline}
            onFocus={(e) => {
                setFocused(true);
                props.onFocus?.(e);
            }}
            onBlur={(e) => {
                setFocused(false);
                props.onBlur?.(e);
            }}
            placeholderTextColor="#9ca3af"
            textAlignVertical={multiline ? 'top' : 'center'}
            className={`px-3.5 py-3 rounded-lg border bg-white text-sm text-gray-900 ${focused ? 'border-orange-400' : 'border-gray-300'}`}
            style={multiline ? { minHeight: 88 } : undefined}
        />
    );
};

// Tappable box that looks like an input and opens a sheet
const PickerBox = ({
    text,
    placeholder,
    icon,
    onPress,
    disabled,
}: {
    text?: string;
    placeholder: string;
    icon: React.ReactNode;
    onPress: () => void;
    disabled?: boolean;
}) => (
    <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        className={`${fieldBox} py-3 border-gray-300`}
        style={{ opacity: disabled ? 0.6 : 1 }}
    >
        <Text className={`flex-1 text-sm ${text ? 'text-gray-900' : 'text-gray-400'}`} numberOfLines={1}>
            {text || placeholder}
        </Text>
        {icon}
    </TouchableOpacity>
);

export type SelectOption = { label: string; value: string };

export const SelectField = ({
    title,
    value,
    options,
    onChange,
    placeholder = 'Select…',
    disabled,
}: {
    title: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}) => {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);

    return (
        <>
            <PickerBox
                text={selected?.label}
                placeholder={placeholder}
                icon={<ChevronDown size={18} color="#9ca3af" />}
                onPress={() => setOpen(true)}
                disabled={disabled}
            />
            {open && (
                <BottomSheet onRequestClose={() => setOpen(false)}>
                    <Text className="text-base font-bold text-brand-navy mb-3">{title}</Text>
                    {options.length === 0 ? (
                        <Text className="text-sm text-gray-400 py-6 text-center">No options available</Text>
                    ) : (
                        <ScrollView style={{ maxHeight: 360 }}>
                            {options.map((o) => {
                                const active = o.value === value;
                                return (
                                    <TouchableOpacity
                                        key={o.value}
                                        onPress={() => {
                                            onChange(o.value);
                                            setOpen(false);
                                        }}
                                        className={`flex-row items-center justify-between px-3 py-3.5 rounded-lg mb-1 ${active ? 'bg-orange-50' : ''}`}
                                    >
                                        <Text className={`text-sm flex-1 ${active ? 'font-semibold text-orange-600' : 'text-gray-800'}`}>
                                            {o.label}
                                        </Text>
                                        {active && <Check size={18} color={brand.orange} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}
                </BottomSheet>
            )}
        </>
    );
};

// Month-grid calendar in a sheet; value / onChange use 'YYYY-MM-DD'
export const DateField = ({
    title,
    value,
    onChange,
    placeholder = 'Select date',
    minDate,
}: {
    title: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minDate?: string;
}) => {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState(() => {
        const base = value ? parseIsoDate(value) : new Date();
        return { year: base.getFullYear(), month: base.getMonth() };
    });

    const openPicker = () => {
        const base = value ? parseIsoDate(value) : minDate ? parseIsoDate(minDate) : new Date();
        setView({ year: base.getFullYear(), month: base.getMonth() });
        setOpen(true);
    };

    const shift = (delta: number) =>
        setView((v) => {
            const d = new Date(v.year, v.month + delta, 1);
            return { year: d.getFullYear(), month: d.getMonth() };
        });

    const firstWeekday = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array.from({ length: firstWeekday }, () => null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const todayIso = toIsoDate(new Date());

    return (
        <>
            <PickerBox
                text={formatDisplayDate(value)}
                placeholder={placeholder}
                icon={<CalendarDays size={18} color="#9ca3af" />}
                onPress={openPicker}
            />
            {open && (
                <BottomSheet onRequestClose={() => setOpen(false)}>
                    <Text className="text-base font-bold text-brand-navy mb-3">{title}</Text>

                    <View className="flex-row items-center justify-between mb-3">
                        <TouchableOpacity onPress={() => shift(-1)} className="p-2 rounded-lg bg-gray-100" hitSlop={6}>
                            <ChevronLeft size={18} color="#374151" />
                        </TouchableOpacity>
                        <Text className="text-sm font-semibold text-gray-800">
                            {MONTHS[view.month]} {view.year}
                        </Text>
                        <TouchableOpacity onPress={() => shift(1)} className="p-2 rounded-lg bg-gray-100" hitSlop={6}>
                            <ChevronRight size={18} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row mb-1">
                        {WEEKDAYS.map((w) => (
                            <Text key={w} className="flex-1 text-center text-[11px] font-semibold text-gray-400">{w}</Text>
                        ))}
                    </View>

                    {Array.from({ length: cells.length / 7 }, (_, row) => (
                        <View key={row} className="flex-row">
                            {cells.slice(row * 7, row * 7 + 7).map((day, i) => {
                                if (day === null) return <View key={i} className="flex-1 aspect-square" />;
                                const iso = toIsoDate(new Date(view.year, view.month, day));
                                const selected = iso === value;
                                const disabled = !!minDate && iso < minDate;
                                const isToday = iso === todayIso;
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        disabled={disabled}
                                        onPress={() => {
                                            onChange(iso);
                                            setOpen(false);
                                        }}
                                        className="flex-1 aspect-square p-0.5"
                                    >
                                        <View
                                            className={`flex-1 rounded-lg items-center justify-center ${
                                                selected ? 'bg-brand-navy' : isToday ? 'border border-orange-400' : ''
                                            }`}
                                        >
                                            <Text
                                                className={`text-sm ${
                                                    selected ? 'text-white font-bold' : disabled ? 'text-gray-300' : 'text-gray-800'
                                                }`}
                                            >
                                                {day}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}

                    <TouchableOpacity
                        onPress={() => {
                            onChange('');
                            setOpen(false);
                        }}
                        className="self-center mt-3 px-4 py-2"
                    >
                        <Text className="text-sm font-semibold text-gray-500">Clear</Text>
                    </TouchableOpacity>
                </BottomSheet>
            )}
        </>
    );
};
