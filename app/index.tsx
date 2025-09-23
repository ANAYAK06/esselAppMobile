// app/index.tsx - Simple Splash Screen (No Redux needed)
import React, { useEffect, useState } from "react";
import { Text, View, Animated, Easing, ActivityIndicator } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Building2 } from 'lucide-react-native';

export default function SplashScreen() {
    const router = useRouter();

    // Animation states
    const [logoScale] = useState(new Animated.Value(0.7));
    const [logoOpacity] = useState(new Animated.Value(1));
    const [textOpacity] = useState(new Animated.Value(1));
    const [contentOpacity] = useState(new Animated.Value(1));
    const [progressWidth] = useState(new Animated.Value(0));
    const [pulseAnimation] = useState(new Animated.Value(1));
    const [floatingAnimation] = useState(new Animated.Value(0));

    const [loadingProgress, setLoadingProgress] = useState(0);
    const [statusText, setStatusText] = useState("Initializing...");

    // Initialize app on mount
    useEffect(() => {
        console.log('🚀 App initializing...');
        startAnimations();
        initializeApp();
    }, []);

    // Start all animations
    const startAnimations = () => {
        // Floating animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatingAnimation, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatingAnimation, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Logo entrance animation
        Animated.parallel([
            Animated.timing(logoScale, {
                toValue: 1,
                duration: 1200,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }),
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start();

        // Text animations with delay
        setTimeout(() => {
            Animated.timing(textOpacity, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }).start();
        }, 600);

        setTimeout(() => {
            Animated.timing(contentOpacity, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }).start();
        }, 1000);

        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnimation, {
                    toValue: 1.05,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnimation, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    // Simple initialization with progress animation
    const initializeApp = async () => {
        try {
            // Step 1: App startup
            setStatusText("Starting application...");
            await animateProgress(25);
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 2: Loading assets
            setStatusText("Loading assets...");
            await animateProgress(50);
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 3: Preparing interface
            setStatusText("Preparing interface...");
            await animateProgress(75);
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 4: Ready to launch
            setStatusText("Ready to launch!");
            await animateProgress(100);
            await new Promise(resolve => setTimeout(resolve, 500));

            // Navigate to log after splash duration
            setTimeout(() => {
                console.log('🔄 Navigating to login screen');
                router.replace('/login');
            }, 300);

        } catch (error) {
            console.error('Initialization error:', error);
            setStatusText("Starting app...");


            setTimeout(() => {
                router.replace('/login');
            }, 1000);
        }
    };

    // Animate progress bar
    const animateProgress = (targetProgress: number) => {
        return new Promise<void>((resolve) => {
            setLoadingProgress(targetProgress);
            Animated.timing(progressWidth, {
                toValue: targetProgress,
                duration: 400,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
            }).start(() => resolve());
        });
    };

    // Progress bar component
    const ProgressBar = () => (
        <View className="w-72 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <Animated.View
                className="h-full rounded-full"
                style={{
                    width: progressWidth.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: '#ffffff',
                    shadowColor: '#ffffff',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                }}
            />
        </View>
    );

    return (
        <View className="flex-1">
            <StatusBar style="light" />

            {/* Gradient Background */}
            <LinearGradient
                colors={['#667eea', '#764ba2', '#4f46e5']}
                style={{ flex: 1 }}
            >
                {/* Overlay for depth */}
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    }}
                />

                {/* Decorative elements */}
                <View className="absolute inset-0">
                    <View className="absolute w-2 h-2 bg-white rounded-full opacity-30" style={{ left: '10%', top: '20%' }} />
                    <View className="absolute w-3 h-3 bg-white rounded-full opacity-20" style={{ left: '85%', top: '15%' }} />
                    <View className="absolute w-2 h-2 bg-white rounded-full opacity-25" style={{ left: '20%', top: '70%' }} />
                </View>

                {/* Animated shapes */}
                <View className="absolute inset-0 opacity-10">
                    <Animated.View
                        style={{
                            transform: [{
                                translateY: floatingAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 20],
                                }),
                            }],
                        }}
                        className="absolute top-32 right-12 w-40 h-40 border border-white rounded-full"
                    />
                    <Animated.View
                        style={{
                            transform: [
                                { rotate: '45deg' },
                                {
                                    translateY: floatingAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, -15],
                                    }),
                                }
                            ],
                        }}
                        className="absolute bottom-48 left-8 w-32 h-32 border border-white"
                    />
                </View>

                {/* Main Content */}
                <View className="flex-1 justify-center items-center px-8">
                    {/* Logo Section */}
                    <Animated.View
                        style={{
                            transform: [{ scale: Animated.multiply(logoScale, pulseAnimation) }],
                            opacity: logoOpacity
                        }}
                        className="items-center mb-12"
                    >
                        {/* Logo Container */}
                        <View
                            className="w-32 h-32 rounded-3xl items-center justify-center mb-6 border-2"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                shadowColor: '#ffffff',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.3,
                                shadowRadius: 20,
                                elevation: 10,
                            }}
                        >
                            <Building2 size={64} color="white" />
                        </View>

                        {/* Company Name */}
                        <Animated.View style={{ opacity: textOpacity }}>
                            <Text
                                className="text-white text-4xl font-bold mb-2 text-center"
                                style={{
                                    textShadowColor: 'rgba(0, 0, 0, 0.3)',
                                    textShadowOffset: { width: 0, height: 2 },
                                    textShadowRadius: 4,
                                    letterSpacing: 1,
                                }}
                            >
                                Essel Projects
                            </Text>
                            <Text
                                className="text-xl text-center font-medium tracking-wider"
                                style={{
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    textShadowColor: 'rgba(0, 0, 0, 0.2)',
                                    textShadowOffset: { width: 0, height: 1 },
                                    textShadowRadius: 2,
                                }}
                            >
                                Mobile ERP System
                            </Text>
                        </Animated.View>
                    </Animated.View>

                    {/* Loading Section */}
                    <Animated.View
                        style={{ opacity: contentOpacity }}
                        className="items-center w-full"
                    >
                        {/* Loading Spinner */}
                        <View className="items-center mb-8">
                            <View
                                className="mb-6 p-4 rounded-full"
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                }}
                            >
                                <ActivityIndicator size="large" color="white" />
                            </View>

                            {/* Progress Bar */}
                            <ProgressBar />
                        </View>

                        {/* Status Text */}
                        <Text
                            className="text-lg font-semibold text-center mb-4 tracking-wide"
                            style={{
                                color: 'rgba(255, 255, 255, 0.95)',
                                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 2,
                            }}
                        >
                            {statusText}
                        </Text>

                        {/* Progress Percentage */}
                        <View className="flex-row items-center">
                            <Text
                                className="text-base font-medium mr-2"
                                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                            >
                                {loadingProgress}%
                            </Text>
                            {loadingProgress === 100 && (
                                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 18 }}>✓</Text>
                            )}
                        </View>
                    </Animated.View>

                    {/* Bottom Branding */}
                    <Animated.View
                        style={{ opacity: contentOpacity }}
                        className="absolute bottom-16 items-center"
                    >
                        <Text
                            className="text-base font-semibold tracking-wide mb-3"
                            style={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 2,
                            }}
                        >
                            Building Tomorrow's Infrastructure
                        </Text>
                        <View
                            className="px-4 py-2 rounded-full"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                            }}
                        >
                            <Text
                                className="text-sm font-medium"
                                style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                            >
                                Version 1.0.0
                            </Text>
                        </View>
                    </Animated.View>
                </View>
            </LinearGradient>
        </View>
    );
}