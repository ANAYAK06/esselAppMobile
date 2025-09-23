// src/utils/notificationBadge.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior - badge only
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: true,
        shouldShowBanner: false,  // Add this
        shouldShowList: false,    // Add this
    }),
});

export class NotificationBadgeManager {
    private static initialized = false;

    static async initialize() {
        if (this.initialized) return true;

        try {
            // Set up notification channel for Android
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'Badge Updates',
                    importance: Notifications.AndroidImportance.MIN,
                    vibrationPattern: [],
                    showBadge: true,
                });
            }

            // Request permissions
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync({
                    ios: {
                        allowAlert: false,
                        allowBadge: true,
                        allowSound: false,
                    },
                });
                finalStatus = status;
            }

            this.initialized = finalStatus === 'granted';
            console.log('Badge permissions:', finalStatus);
            return this.initialized;
        } catch (error) {
            console.error('Failed to initialize badges:', error);
            return false;
        }
    }

    static async updateBadgeFromCount(count: number) {
        try {
            if (!this.initialized) {
                const success = await this.initialize();
                if (!success) return;
            }

            console.log('Updating app badge to:', count);
            await Notifications.setBadgeCountAsync(count);
        } catch (error) {
            console.error('Failed to update badge:', error);
        }
    }
}