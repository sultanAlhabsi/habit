import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Platform,
  Linking,
  Share,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/common/AppText';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useTheme } from '../theme/ThemeContext';
import { appAlert } from '../services/alertService';
import { triggerLightHaptic, triggerSuccessHaptic } from '../utils/haptics';

interface ContactScreenProps {
  navigation: any;
}

type InquiryCategory = 'suggestion' | 'bug' | 'inquiry' | 'praise';

interface CategoryOption {
  id: InquiryCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  prefix: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'suggestion', label: 'اقتراح ميزة', icon: 'bulb-outline', prefix: 'اقتراح ميزة جديدة' },
  { id: 'bug', label: 'إبلاغ عن خطأ', icon: 'bug-outline', prefix: 'بلاغ عن مشكلة تقنية' },
  { id: 'inquiry', label: 'استفسار عام', icon: 'chatbubble-ellipses-outline', prefix: 'استفسار' },
  { id: 'praise', label: 'شكر وتشجيع', icon: 'heart-outline', prefix: 'رسالة شكر وتشجيع' },
];

const DEVELOPER_EMAIL = 'ssultan.j2@gmail.com';
const APP_VERSION = '1.0.0';

export const ContactScreen: React.FC<ContactScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark, spacing, radius, typography } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<InquiryCategory>('suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const activeCategory = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  const buildDiagnosticText = (): string => {
    return [
      '----------------------------------------',
      'معلومات النظام والتطبيق (تلقائية):',
      `• التطبيق: إنجاز (Enjaz) - الإصدار ${APP_VERSION}`,
      `• نظام التشغيل: ${Platform.OS === 'ios' ? 'iOS' : 'Android'} (${Platform.Version})`,
      `• التاريخ: ${new Date().toLocaleDateString('ar-EG', { dateStyle: 'long' })}`,
      '----------------------------------------',
    ].join('\n');
  };

  const buildFullMessage = (): { emailSubject: string; emailBody: string; fullShareText: string } => {
    const formattedSubject = subject.trim()
      ? `[إنجاز - ${activeCategory.label}] ${subject.trim()}`
      : `[إنجاز] ${activeCategory.prefix}`;

    const sections: string[] = [];

    // Directly include the user's message without duplicating the subject or category
    sections.push(message.trim() || subject.trim() || '');

    if (includeDiagnostics) {
      sections.push('\n' + buildDiagnosticText());
    }

    const emailBody = sections.join('\n');
    const fullShareText = `إلى: ${DEVELOPER_EMAIL}\nالموضوع: ${formattedSubject}\n\n${emailBody}`;

    return {
      emailSubject: formattedSubject,
      emailBody,
      fullShareText,
    };
  };

  /**
   * Opens the user's default email client (e.g. Gmail, Samsung Email, Apple Mail)
   * directly without falling back to the OS Share sheet.
   */
  const handleSendEmail = async () => {
    if (!message.trim() && !subject.trim()) {
      appAlert('تنبيه', 'يرجى كتابة موضوع أو نص الرسالة قبل الإرسال.');
      return;
    }

    setIsSending(true);
    triggerLightHaptic();

    const { emailSubject, emailBody, fullShareText } = buildFullMessage();
    const mailtoUrl = `mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    try {
      // Launch email app directly. Do NOT check canOpenURL because Android 11+
      // blocks queries by default and causes false negatives.
      await Linking.openURL(mailtoUrl);
      triggerSuccessHaptic();
    } catch (error) {
      console.warn('Error opening email client:', error);
      // Only if opening mailto completely fails (e.g. emulator without mail app)
      appAlert(
        'تعذر فتح تطبيق البريد',
        'لم يتم العثور على تطبيق بريد مهيأ على جهازك. هل تود مشاركة أو نسخ نص الرسالة؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'مشاركة الرسالة',
            style: 'default',
            onPress: () => {
              Share.share({
                title: emailSubject,
                message: fullShareText,
              });
            },
          },
        ]
      );
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Explicit action to share or copy the message text through any other app
   */
  const handleShareOrCopyMessage = async () => {
    if (!message.trim() && !subject.trim()) {
      appAlert('تنبيه', 'يرجى كتابة نص الرسالة أولاً ليتم نسخها أو مشاركتها.');
      return;
    }

    triggerLightHaptic();
    const { emailSubject, fullShareText } = buildFullMessage();

    try {
      await Share.share({
        title: emailSubject,
        message: fullShareText,
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

  const renderCategoryChip = (cat: CategoryOption) => {
    const isSelected = selectedCategory === cat.id;
    return (
      <Pressable
        key={cat.id}
        accessibilityRole="button"
        accessibilityLabel={cat.label}
        accessibilityState={{ selected: isSelected }}
        onPress={() => {
          triggerLightHaptic();
          setSelectedCategory(cat.id);
        }}
        style={({ pressed }) => [
          styles.categoryChip,
          {
            backgroundColor: isSelected
              ? isDark
                ? '#1F2E25'
                : '#EBF2EE'
              : theme.cardSecondary,
            borderColor: isSelected ? theme.primary : theme.border,
            borderRadius: radius.md,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <Ionicons
          name={cat.icon}
          size={16}
          color={isSelected ? theme.primary : theme.textSecondary}
        />
        <Text
          numberOfLines={1}
          style={[
            typography.caption,
            {
              color: isSelected ? theme.primary : theme.textSecondary,
              fontWeight: isSelected ? '700' : '500',
              fontSize: 12.5,
            },
          ]}
        >
          {cat.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="تواصل معنا"
        subtitle="شاركنا أفكارك وملاحظاتك لتطوير إنجاز"
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: spacing.base,
            paddingBottom: insets.bottom + 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Feedback Form Section */}
          <View style={styles.sectionHeader}>
            <Text style={[typography.subMedium, { color: theme.text, fontWeight: '700', textAlign: 'right' }]}>
              نموذج إرسال ملاحظة أو اقتراح
            </Text>
            <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginTop: 2 }]}>
              اختر نوع الرسالة واكتب ما ترغب في مشاركته
            </Text>
          </View>

          <Card style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* 2x2 Balanced Category Grid */}
            <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 8, fontWeight: '600' }]}>
              نوع الرسالة
            </Text>

            <View style={styles.gridContainer}>
              <View style={styles.gridRow}>
                {renderCategoryChip(CATEGORIES[0])}
                {renderCategoryChip(CATEGORIES[1])}
              </View>
              <View style={styles.gridRow}>
                {renderCategoryChip(CATEGORIES[2])}
                {renderCategoryChip(CATEGORIES[3])}
              </View>
            </View>

            {/* Subject Input */}
            <View style={styles.inputGroup}>
              <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 6, fontWeight: '600' }]}>
                عنوان الرسالة (اختياري)
              </Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="مثال: اقتراح إضافة ودجت للشاشة الرئيسية..."
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.cardSecondary,
                    color: theme.text,
                    borderColor: theme.border,
                    borderRadius: radius.md,
                  },
                ]}
                textAlign="right"
                returnKeyType="next"
              />
            </View>

            {/* Message Body Input */}
            <View style={styles.inputGroup}>
              <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'right', marginBottom: 6, fontWeight: '600' }]}>
                نص الرسالة والملاحظات
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="اكتب كل ما يدور في بالك من أفكار أو تفاصيل المشكلة..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.cardSecondary,
                    color: theme.text,
                    borderColor: theme.border,
                    borderRadius: radius.md,
                  },
                ]}
                textAlign="right"
              />
            </View>

            {/* Diagnostics Switch */}
            <View style={[styles.switchRow, { borderColor: theme.borderSubtle }]}>
              <Switch
                value={includeDiagnostics}
                onValueChange={(val) => {
                  triggerLightHaptic();
                  setIncludeDiagnostics(val);
                }}
                trackColor={{
                  false: theme.border,
                  true: `${theme.primary}80`,
                }}
                thumbColor={includeDiagnostics ? theme.primary : '#F4F3EF'}
              />
              <View style={styles.switchTextContainer}>
                <Text style={[typography.caption, { color: theme.text, fontWeight: '600', textAlign: 'right' }]}>
                  تضمين معلومات النظام والإصدار
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: theme.textMuted, fontSize: 11, textAlign: 'right', marginTop: 2 },
                  ]}
                >
                  إرفاق تلقائي ({Platform.OS === 'ios' ? 'iOS' : 'Android'} • v{APP_VERSION}) للمساعدة في فحص المشاكل
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <Button
                title="إرسال عبر تطبيق البريد"
                variant="primary"
                size="lg"
                iconName="mail-outline"
                loading={isSending}
                onPress={handleSendEmail}
                style={styles.submitButton}
              />

              <Button
                title="مشاركة أو نسخ نص الرسالة"
                variant="secondary"
                size="md"
                iconName="share-social-outline"
                onPress={handleShareOrCopyMessage}
                style={styles.shareButton}
              />
            </View>
          </Card>

          {/* Privacy Guarantee Note */}
          <View style={styles.privacyNoteContainer}>
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.textMuted} />
            <Text
              style={[
                typography.caption,
                { color: theme.textMuted, fontSize: 11.5, textAlign: 'center', marginHorizontal: 6, lineHeight: 18 },
              ]}
            >
              خصوصيتك محفوظة؛ الرسائل تُرسل مباشرة عبر بريدك المفضل دون أي خوادم أو وسطاء.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  formCard: {
    marginBottom: 16,
  },
  gridContainer: {
    gap: 8,
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  categoryChip: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 7,
  },
  inputGroup: {
    marginBottom: 14,
  },
  input: {
    height: 46,
    paddingHorizontal: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    marginBottom: 8,
  },
  switchTextContainer: {
    flex: 1,
    paddingLeft: 12,
  },
  actionsContainer: {
    gap: 10,
    marginTop: 6,
  },
  submitButton: {
    width: '100%',
  },
  shareButton: {
    width: '100%',
  },
  privacyNoteContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
});
