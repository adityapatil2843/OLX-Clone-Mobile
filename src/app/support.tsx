import React, { useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, Mail } from 'lucide-react-native';
import { AppHeader } from '../components/ui/AppHeader';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { palette, spacing } from '../constants/tokens';

const FAQ = [
  ['How do I edit or remove a listing?', 'Open your account, select the listing, and use the available edit or status controls.'],
  ['Why did my upload fail?', 'Check your connection, file size, and supported media type. Try again on a stable network.'],
  ['How do I report a user or listing?', 'Use the report action available on the relevant listing, reel, profile, or conversation.'],
  ['How do I delete my account?', 'Open Settings, choose Account Privacy & Deletion, and follow the request steps.'],
] as const;

export default function SupportScreen() {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  return <ScreenContainer>
    <AppHeader title="Help & Support" onBack={() => router.back()} left={<ArrowLeft size={24} color="#002f34" />} />
    <View style={styles.content}>
      <Text style={styles.intro}>Find answers to common questions or contact the Bazarr 360 support team.</Text>
      {FAQ.map(([question, answer], index) => <TouchableOpacity key={question} style={styles.faq} onPress={() => setOpen(open === index ? null : index)} activeOpacity={0.7}>
        <View style={styles.questionRow}><Text style={styles.question}>{question}</Text><ChevronDown size={18} color={palette.slate500} /></View>
        {open === index && <Text style={styles.answer}>{answer}</Text>}
      </TouchableOpacity>)}
      <TouchableOpacity style={styles.contact} onPress={() => Linking.openURL('mailto:support@bazarr360.in')} activeOpacity={0.8}>
        <Mail size={20} color={palette.pureWhite} /><Text style={styles.contactText}>Email Support</Text>
      </TouchableOpacity>
      <Text style={styles.note}>When contacting support, never share your password, OTP, UPI PIN, or access token.</Text>
    </View>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.md }, intro: { fontSize: 15, lineHeight: 22, color: palette.slate600, marginBottom: spacing.md },
  faq: { borderWidth: 1, borderColor: palette.slate200, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, backgroundColor: palette.pureWhite },
  questionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, question: { flex: 1, fontSize: 14, fontWeight: '700', color: '#002f34', paddingRight: spacing.sm }, answer: { fontSize: 13, lineHeight: 19, color: palette.slate600, marginTop: spacing.sm },
  contact: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002f34', borderRadius: 10, padding: spacing.md, marginTop: spacing.md }, contactText: { color: palette.pureWhite, fontWeight: '700' }, note: { fontSize: 12, color: palette.slate500, lineHeight: 17, marginTop: spacing.md },
});
