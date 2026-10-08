// app/index.tsx - Splash Screen (Corex brand: navy background, Essel logo, orange progress)
import React, { useEffect, useState } from "react";
import { Text, View, Image, Animated, Easing } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { brand } from '@/src/theme/colors';

const STEPS = [
    { text: 'Starting application...', progress: 25 },
    { text: 'Loading assets...', progress: 50 },
    { text: 'Preparing interface...', progress: 75 },
    { text: 'Ready to launch!', progress: 100 },
];

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function SplashScreen() {
    const router = useRouter();

    const [logoScale] = useState(() => new Animated.Value(0.7));
    const [logoOpacity] = useState(() => new Animated.Value(0));
    const [contentOpacity] = useState(() => new Animated.Value(0));
    const [progressWidth] = useState(() => new Animated.Value(0));

    const [statusText, setStatusText] = useState('Initializing...');

    useEffect(() => {
        // Logo entrance, then the text and progress fade in
        Animated.sequence([
            Animated.parallel([
                Animated.timing(logoScale, {
                    toValue: 1,
                    duration: 900,
                    easing: Easing.out(Easing.back(1.5)),
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(contentOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();

        const animateProgress = (toValue: number) =>
            new Promise<void>((resolve) => {
                Animated.timing(progressWidth, {
                    toValue,
                    duration: 400,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: false,
                }).start(() => resolve());
            });

        let cancelled = false;
        (async () => {
            for (const step of STEPS) {
                if (cancelled) return;
                setStatusText(step.text);
                await animateProgress(step.progress);
                await wait(500);
            }
            if (!cancelled) {
                console.log('🔄 Navigating to login screen');
                router.replace('/login');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [router, logoScale, logoOpacity, contentOpacity, progressWidth]);

    return (
        <LinearGradient
            colors={[brand.navy, brand.navyDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
        >
            <StatusBar style="light" />

            {/* Ambient navy / orange glows, as on the web login backdrop */}
            <View pointerEvents="none" className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-blue-800 opacity-20" />
            <View pointerEvents="none" className="absolute -bottom-28 -right-20 w-96 h-96 rounded-full bg-orange-500 opacity-10" />
            <View pointerEvents="none" className="absolute top-24 right-10 w-16 h-16 rounded-full border-2 border-orange-400/30" />
            <View pointerEvents="none" className="absolute bottom-48 left-10 w-12 h-12 border-2 border-white/10" style={{ transform: [{ rotate: '45deg' }] }} />

            <View className="flex-1 justify-center items-center px-8">
                {/* Logo */}
                <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }} className="items-center">
                    <View className="w-36 h-36 rounded-3xl bg-white items-center justify-center shadow-lg">
                        <Image
                            source={require('@/assets/images/essellogo.png')}
                            style={{ width: 104, height: 90 }}
                            resizeMode="contain"
                        />
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: contentOpacity }} className="items-center w-full">
                    <Text className="text-white text-3xl font-bold mt-8 text-center">Essel Projects Pvt Ltd</Text>
                    <Text className="text-sm mt-2 text-center tracking-wide">
                        <Text className="text-white/85">Built On Integrity. </Text>
                        <Text className="text-orange-400">Driven By Performance</Text>
                    </Text>

                    {/* Progress */}
                    <View className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mt-12">
                        <Animated.View
                            style={{
                                height: '100%',
                                borderRadius: 999,
                                backgroundColor: brand.orange,
                                width: progressWidth.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ['0%', '100%'],
                                }),
                            }}
                        />
                    </View>
                    <Text className="text-orange-200 text-sm font-medium mt-4">{statusText}</Text>
                </Animated.View>
            </View>

            {/* Bottom branding */}
            <Animated.View style={{ opacity: contentOpacity }} className="items-center pb-14">
                <Text className="text-xs text-white/40 mb-2">Powered by</Text>
                <View className="bg-white rounded-xl px-3 py-1.5">
                    <Image
                        source={require('@/assets/images/corex-wordmark.png')}
                        style={{ width: 110, height: 44 }}
                        resizeMode="contain"
                    />
                </View>
                <Text className="text-xs text-white/40 mt-3">
                    Version {Constants.expoConfig?.version ?? '1.0.0'}
                </Text>
            </Animated.View>
        </LinearGradient>
    );
}
