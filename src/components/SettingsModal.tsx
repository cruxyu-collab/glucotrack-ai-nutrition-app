import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../services/i18n';
import { clearAllMeals } from '../services/db';
import { seedTwoMonthsMealData } from '../services/seedData';
import { exportMealsToCSV } from '../services/exportService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onDataCleared: () => Promise<void>;
}

export default function SettingsModal({ visible, onClose, onDataCleared }: Props): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [tapCount, setTapCount] = useState<number>(0);
  const [isDevMenuVisible, setIsDevMenuVisible] = useState<boolean>(false);

  const handleLanguageSwitch = async (lang: 'ja' | 'ko'): Promise<void> => {
    await changeLanguage(lang);
  };

  const handleVersionPress = (): void => {
    const next = tapCount + 1;
    if (next >= 5) {
      const nextState = !isDevMenuVisible;
      setIsDevMenuVisible(nextState);
      setTapCount(0);
      Alert.alert(
        'Developer Mode',
        nextState
          ? (i18n.language === 'ko' ? '개발자 모드가 활성화되었습니다.' : '開発者モードが有効化されました。')
          : (i18n.language === 'ko' ? '개발자 모드가 비활성화되었습니다.' : '開発者モードが無効化されました。')
      );
    } else {
      setTapCount(next);
    }
  };

  const handleSeedData = async (): Promise<void> => {
    try {
      setIsSeeding(true);
      const count = await seedTwoMonthsMealData(i18n.language === 'ko' ? 'ko' : 'ja');
      await onDataCleared();
      Alert.alert(
        t('settings.seedSuccessTitle'),
        t('settings.seedSuccessMsg', { count })
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExportCSV = async (): Promise<void> => {
    try {
      setIsExporting(true);
      await exportMealsToCSV(i18n.language === 'ko' ? 'ko' : 'ja');
    } catch (err: any) {
      Alert.alert('Export Error', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAllData = (): void => {
    Alert.alert(
      t('settings.clearConfirmTitle'),
      t('settings.clearConfirmMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await clearAllMeals();
            await onDataCleared();
            Alert.alert(t('settings.clearSuccessTitle'), t('settings.clearSuccessMsg'));
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalRoot}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.modalTitle')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {/* 1. 言語設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('settings.languageSection')}</Text>
            <View style={styles.segmentedContainer}>
              <TouchableOpacity
                style={[styles.segmentBtn, i18n.language === 'ko' && styles.segmentBtnActive]}
                onPress={() => handleLanguageSwitch('ko')}
              >
                <Text style={[styles.segmentText, i18n.language === 'ko' && styles.segmentTextActive]}>
                  한국어 (KO)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, i18n.language === 'ja' && styles.segmentBtnActive]}
                onPress={() => handleLanguageSwitch('ja')}
              >
                <Text style={[styles.segmentText, i18n.language === 'ja' && styles.segmentTextActive]}>
                  日本語 (JA)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. 隠し開発者セクション */}
          {isDevMenuVisible && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Developer Tools (Hidden)</Text>
              <TouchableOpacity
                style={styles.seedBtn}
                onPress={handleSeedData}
                disabled={isSeeding}
              >
                {isSeeding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.seedBtnText}>{t('settings.seedSampleBtn')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* 3. 医療免責事項 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('settings.disclaimerSection')}</Text>
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>{t('settings.disclaimerText')}</Text>
            </View>
          </View>

          {/* 4. データ管理 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('settings.dataSection')}</Text>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV} disabled={isExporting}>
              {isExporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.exportBtnText}>
                  {i18n.language === 'ko' ? '📄 식사 기록 CSV 내보내기 (진료 제출용)' : '📄 食事記録のCSVエクスポート (診察提出用)'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.dangerBtn} onPress={handleClearAllData}>
              <Text style={styles.dangerBtnText}>{t('settings.clearAllBtn')}</Text>
            </TouchableOpacity>
          </View>

          {/* 5. 技術仕様 (iPhone 16e実機検証文言を削除し、商用標準化) */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('settings.aboutSection')}</Text>
            <View style={styles.infoCard}>
              <TouchableOpacity activeOpacity={0.8} onPress={handleVersionPress}>
                <Text style={styles.infoTextVersion}>{t('settings.version')}</Text>
              </TouchableOpacity>
              <Text style={styles.infoText}>{t('settings.aiEngine')}</Text>
              <Text style={styles.infoText}>{t('settings.storage')}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#212529' },
  closeBtn: { padding: 4 },
  closeBtnText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#495057', marginBottom: 8 },
  segmentedContainer: { flexDirection: 'row', backgroundColor: '#E9ECEF', borderRadius: 8, padding: 3 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  segmentBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  segmentText: { fontSize: 14, color: '#6C757D', fontWeight: '500' },
  segmentTextActive: { color: '#007AFF', fontWeight: '700' },
  seedBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  seedBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  disclaimerBox: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1, borderRadius: 8, padding: 12 },
  disclaimerText: { fontSize: 12, color: '#92400E', lineHeight: 18 },
  exportBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  exportBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  dangerBtn: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  dangerBtnText: { color: '#DC2626', fontSize: 14, fontWeight: '700' },
  infoCard: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 8, padding: 12, gap: 6 },
  infoTextVersion: { fontSize: 12, color: '#0F172A', fontWeight: '600' },
  infoText: { fontSize: 12, color: '#64748B' },
});