import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { AppHeader } from '../../components/ui/AppHeader';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { palette, spacing } from '../../constants/tokens';
import { useAuthStore } from '../../stores/useAuthStore';
import { authService } from '../../services/auth.service';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const requestDeletion = () => Alert.alert('Request account deletion', 'This will sign you out and open a support request. Permanent deletion will only happen after the request is reviewed.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Continue', style: 'destructive', onPress: async () => { await authService.logout(); Alert.alert('Request received', 'Please contact support to complete your deletion request.'); router.replace('/(auth)/login'); } },
  ]);
  return <ScreenContainer><AppHeader title="Account Privacy & Deletion" onBack={() => router.back()} left={<ArrowLeft size={24} color="#002f34" />} /><View style={styles.content}>
    <Text style={styles.heading}>Your privacy choices</Text><Text style={styles.body}>You can review our Privacy Policy, change available profile information, and request deletion of your Bazarr 360 account.</Text>
    <Text style={styles.heading}>What deletion means</Text><Text style={styles.body}>Your account, listings, profile information, and associated content may be removed. Some records may be retained when required for security, fraud prevention, dispute resolution, or legal obligations.</Text>
    <Text style={styles.heading}>Before you continue</Text><Text style={styles.body}>Save anything you need. Account deletion may affect your listings, conversations, saved items, and access to the account.</Text>
    {isAuthenticated ? <TouchableOpacity style={styles.deleteButton} onPress={requestDeletion} activeOpacity={0.8}><Trash2 size={19} color={palette.pureWhite} /><Text style={styles.deleteText}>Request Account Deletion</Text></TouchableOpacity> : <Text style={styles.note}>Sign in to request account deletion.</Text>}
  </View></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { padding: spacing.md }, heading: { fontSize: 16, fontWeight: '700', color: '#002f34', marginTop: spacing.md, marginBottom: spacing.xs }, body: { fontSize: 14, lineHeight: 21, color: palette.slate600 }, deleteButton: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.danger600, borderRadius: 10, padding: spacing.md, marginTop: spacing.xl }, deleteText: { color: palette.pureWhite, fontWeight: '700' }, note: { color: palette.slate500, marginTop: spacing.xl }, });
