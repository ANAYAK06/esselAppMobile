// app/employee/_layout.tsx — Employee Portal pages opened from the employee dashboard
import { Stack } from 'expo-router';

export default function EmployeePortalLayout() {
    return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
