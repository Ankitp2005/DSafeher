import { Redirect } from 'expo-router';
import { useSettingsStore } from '../store/settingsStore';

export default function RootIndex() {
    const { isDisguised } = useSettingsStore();

    if (isDisguised) {
        return <Redirect href="/disguise/calculator" />;
    }

    return <Redirect href="/(auth)" />;
}
