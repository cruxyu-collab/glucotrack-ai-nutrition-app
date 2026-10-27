import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { MealRecord, NutrientKey, VerificationStatus, createEmptyNutrients } from '../types/nutrition';
import { analyzeMealImage, estimateNutrientsFromText, DetectedMealItem } from '../services/geminiVision';
import { toLocalISOString } from '../utils/date';
import { validateNutritionData, ValidationIssue } from '../utils/nutritionValidator';

type InputMode = 'PHOTO' | 'TEXT';

const ORDERED_FORM_NUTRIENTS: NutrientKey[] = [
  'calories', 'carbohydrates', 'sugars', 'sodium', 'fiber', 'totalFat', 'saturatedFat', 'transFat', 'cholesterol',
];

interface Props {
  visible: boolean;
  targetDateStr: string;
  onClose: () => void;
  onSaveMultiple: (meals: Omit<MealRecord, 'id' | 'createdAt'>[]) => Promise<void>;
}

export default function MealInputModal({ visible, targetDateStr, onClose, onSaveMultiple }: Props): React.JSX.Element {
  const { t, i18n } = useTranslation();

  const [inputMode, setInputMode] = useState<InputMode>('PHOTO');
  const [eatenAt, setEatenAt] = useState<Date>(new Date());
  const [timeOffset, setTimeOffset] = useState<number>(0);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isFoodDetected, setIsFoodDetected] = useState<boolean>(true);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const [detectedItems, setDetectedItems] = useState<DetectedMealItem[]>([]);

  const [name, setName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [nutrients, setNutrients] = useState<Record<NutrientKey, { rawText: string; status: VerificationStatus }>>({
    calories: { rawText: '', status: 'VERIFIED' },
    carbohydrates: { rawText: '', status: 'VERIFIED' },
    sugars: { rawText: '', status: 'VERIFIED' },
    sodium: { rawText: '', status: 'VERIFIED' },
    fiber: { rawText: '', status: 'VERIFIED' },
    totalFat: { rawText: '', status: 'VERIFIED' },
    saturatedFat: { rawText: '', status: 'VERIFIED' },
    transFat: { rawText: '', status: 'VERIFIED' },
    cholesterol: { rawText: '', status: 'VERIFIED' },
  });
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

  useEffect(() => {
    if (visible) {
      resetAllFormStates();
    }
  }, [visible, targetDateStr]);

  const resetAllFormStates = () => {
    const now = new Date();
    if (targetDateStr) {
      const [year, month, day] = targetDateStr.split('-').map(Number);
      now.setFullYear(year, month - 1, day);
    }
    setEatenAt(now);
    setTimeOffset(0);
    setName('');
    setNotes('');
    setSelectedImageUri(null);
    setAiMessage(null);
    setIsFoodDetected(true);
    setDetectedItems([]);
    setValidationIssues([]);
    setNutrients({
      calories: { rawText: '', status: 'VERIFIED' },
      carbohydrates: { rawText: '', status: 'VERIFIED' },
      sugars: { rawText: '', status: 'VERIFIED' },
      sodium: { rawText: '', status: 'VERIFIED' },
      fiber: { rawText: '', status: 'VERIFIED' },
      totalFat: { rawText: '', status: 'VERIFIED' },
      saturatedFat: { rawText: '', status: 'VERIFIED' },
      transFat: { rawText: '', status: 'VERIFIED' },
      cholesterol: { rawText: '', status: 'VERIFIED' },
    });
  };

  const handleCancelAndClose = () => {
    if (isAnalyzing || isSaving) return;
    resetAllFormStates();
    onClose();
  };

  // 年/月/日 時間 フォーマット関数 (YYYY/MM/DD HH:mm)
  const formatDateTimeDisplay = (d: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const runValidation = (updatedNutrients: typeof nutrients) => {
    const result = validateNutritionData(updatedNutrients);
    setValidationIssues(result.issues);
    return result;
  };

  const applyAnalysisResult = (items: DetectedMealItem[]) => {
    if (items.length === 0) {
      setIsFoodDetected(false);
      return;
    }

    setIsFoodDetected(true);
    setDetectedItems(items);

    if (items.length === 1) {
      const single = items[0];
      setName(single.name);
      setNotes(single.notes);

      const updated = { ...nutrients };
      for (const k of ORDERED_FORM_NUTRIENTS) {
        const item = single.nutrients[k];
        updated[k] = {
          rawText: item && item.value !== null ? String(item.value) : '',
          status: item ? item.status : 'ESTIMATED',
        };
      }
      setNutrients(updated);
      runValidation(updated);
    }
  };

  const processImageAnalysis = async (uri: string): Promise<void> => {
    try {
      setIsAnalyzing(true);
      setAiMessage(null);
      setIsFoodDetected(true);
      setDetectedItems([]);

      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      setSelectedImageUri(manipResult.uri);
      if (!manipResult.base64) throw new Error('Base64 error');

      const targetLang = (i18n.language === 'ko' ? 'ko' : 'ja') as 'ja' | 'ko';
      const result = await analyzeMealImage(manipResult.base64, targetLang);

      if (!result.isFood || result.items.length === 0) {
        setIsFoodDetected(false);
        return;
      }

      applyAnalysisResult(result.items);

      if (result.items.length > 1) {
        setAiMessage(
          i18n.language === 'ko'
            ? `✓ ${result.items.length}개의 음식을 개별 감지했습니다 (각각 카드로 저장)`
            : `✓ ${result.items.length}品目の料理を個別検知しました (それぞれカード保存)`
        );
      } else {
        const base = result.items[0].isNutritionLabel ? t('mealInput.aiSuccessLabel') : t('mealInput.aiSuccessFood');
        setAiMessage(base);
      }
    } catch (error: any) {
      Alert.alert(i18n.language === 'ko' ? 'AI 분석 알림' : 'AI通知', error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEstimateFromText = async (): Promise<void> => {
    if (!name.trim()) {
      Alert.alert(t('common.confirm'), t('mealInput.alertNameRequired'));
      return;
    }

    try {
      setIsAnalyzing(true);
      setAiMessage(null);
      setIsFoodDetected(true);

      const targetLang = (i18n.language === 'ko' ? 'ko' : 'ja') as 'ja' | 'ko';
      const result = await estimateNutrientsFromText(name.trim(), targetLang);

      if (!result.isFood || result.items.length === 0) {
        setIsFoodDetected(false);
        return;
      }

      applyAnalysisResult(result.items);
      setAiMessage(t('mealInput.aiSuccessText'));
    } catch (error: any) {
      Alert.alert(i18n.language === 'ko' ? 'AI 분석 알림' : 'AI通知', error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLaunchCamera = async (): Promise<void> => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: false });
    if (!res.canceled && res.assets[0].uri) await processImageAnalysis(res.assets[0].uri);
  };

  const handleLaunchAlbum = async (): Promise<void> => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false });
    if (!res.canceled && res.assets[0].uri) await processImageAnalysis(res.assets[0].uri);
  };

  const handleSetTimeOffset = (minutesAgo: number): void => {
    const target = new Date();
    if (targetDateStr) {
      const [year, month, day] = targetDateStr.split('-').map(Number);
      target.setFullYear(year, month - 1, day);
    }
    target.setMinutes(target.getMinutes() - minutesAgo);
    setEatenAt(target);
    setTimeOffset(minutesAgo);
  };

  const handleNutrientTextChange = (key: NutrientKey, text: string): void => {
    const updated = { ...nutrients, [key]: { ...nutrients[key], rawText: text } };
    setNutrients(updated);
    runValidation(updated);
  };

  const handleToggleStatus = (key: NutrientKey): void => {
    setNutrients((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: prev[key].status === 'VERIFIED' ? 'ESTIMATED' : 'VERIFIED',
      },
    }));
  };

  const handleSave = async (): Promise<void> => {
    if (isAnalyzing || isSaving) return;

    if (!isFoodDetected) {
      Alert.alert(t('common.confirm'), t('mealInput.nonFoodBlocked'));
      return;
    }

    try {
      setIsSaving(true);
      const timeStr = toLocalISOString(eatenAt);

      if (detectedItems.length > 1) {
        const payloadMeals: Omit<MealRecord, 'id' | 'createdAt'>[] = detectedItems.map((item) => ({
          name: item.name,
          eatenAt: timeStr,
          notes: item.notes || undefined,
          nutrients: item.nutrients,
        }));

        await onSaveMultiple(payloadMeals);
        resetAllFormStates();
        onClose();
        return;
      }

      if (!name.trim()) {
        Alert.alert(t('common.confirm'), t('mealInput.alertNameRequired'));
        return;
      }

      const hasNutrientValue = ORDERED_FORM_NUTRIENTS.some((k) => {
        const val = parseFloat(nutrients[k].rawText);
        return !isNaN(val) && nutrients[k].rawText.trim() !== '';
      });

      if (!hasNutrientValue) {
        Alert.alert(t('common.confirm'), t('mealInput.atLeastOneNutrient'));
        return;
      }

      const validation = runValidation(nutrients);
      if (!validation.isValid) {
        Alert.alert(t('common.confirm'), t('validation.negativeValue'));
        return;
      }

      const payloadNutrients = createEmptyNutrients();
      for (const key of ORDERED_FORM_NUTRIENTS) {
        const item = nutrients[key];
        const parsed = parseFloat(item.rawText);

        if (!isNaN(parsed) && item.rawText.trim() !== '') {
          payloadNutrients[key] = {
            value: parsed,
            unit: payloadNutrients[key].unit,
            status: item.status,
          };
        } else {
          payloadNutrients[key] = {
            value: null,
            unit: payloadNutrients[key].unit,
            status: 'UNVERIFIED',
          };
        }
      }

      await onSaveMultiple([
        {
          name: name.trim(),
          eatenAt: timeStr,
          notes: notes.trim() || undefined,
          nutrients: payloadNutrients,
        },
      ]);

      resetAllFormStates();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('mealInput.modalTitle')}</Text>
          <TouchableOpacity onPress={handleCancelAndClose} style={styles.closeBtn} disabled={isAnalyzing || isSaving}>
            <Text style={styles.closeBtnText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody}>
          {/* 最上部: 2系統タブ切替 */}
          <View style={styles.modeTabContainer}>
            <TouchableOpacity
              style={[styles.modeTabBtn, inputMode === 'PHOTO' && styles.modeTabBtnActive]}
              onPress={() => setInputMode('PHOTO')}
              disabled={isAnalyzing || isSaving}
            >
              <Text style={[styles.modeTabText, inputMode === 'PHOTO' && styles.modeTabTextActive]}>
                {i18n.language === 'ko' ? '📷 사진으로 분석' : '📷 写真で解析'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTabBtn, inputMode === 'TEXT' && styles.modeTabBtnActive]}
              onPress={() => setInputMode('TEXT')}
              disabled={isAnalyzing || isSaving}
            >
              <Text style={[styles.modeTabText, inputMode === 'TEXT' && styles.modeTabTextActive]}>
                {i18n.language === 'ko' ? '✍️ 음식명으로 추정' : '✍️ 食品名で推計'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 写真モード */}
          {inputMode === 'PHOTO' && (
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>{t('mealInput.aiSectionTitle')}</Text>
              <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleLaunchCamera} disabled={isAnalyzing || isSaving}>
                  <Text style={styles.actionBtnText}>{t('mealInput.cameraBtn')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleLaunchAlbum} disabled={isAnalyzing || isSaving}>
                  <Text style={styles.actionBtnText}>{t('mealInput.albumBtn')}</Text>
                </TouchableOpacity>
              </View>
              {selectedImageUri && <Image source={{ uri: selectedImageUri }} style={styles.thumbnail} />}
            </View>
          )}

          {/* 料理名テキストモード */}
          {inputMode === 'TEXT' && (
            <View style={styles.cardBox}>
              <Text style={styles.cardBoxTitle}>
                {i18n.language === 'ko' ? '음식명 입력 후 추정 버튼을 누르세요' : '食品名を入力して推計を実行'}
              </Text>
              <View style={styles.textInputRow}>
                {/* テキスト入力欄の縦幅をボタン(44px)と統一し、余分な下部マージンを除去 */}
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0, height: 44 }]}
                  placeholder={t('mealInput.namePlaceholder')}
                  value={name}
                  onChangeText={setName}
                  editable={!isAnalyzing && !isSaving}
                />
                <TouchableOpacity
                  style={[styles.estimateBtn, (!name.trim() || isAnalyzing || isSaving) && styles.estimateBtnDisabled]}
                  onPress={handleEstimateFromText}
                  disabled={!name.trim() || isAnalyzing || isSaving}
                >
                  <Text style={styles.estimateBtnText}>{t('mealInput.aiEstimateTextBtn')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isAnalyzing && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>{t('mealInput.aiAnalyzing')}</Text>
            </View>
          )}

          {!isFoodDetected && (
            <View style={styles.nonFoodAlertBox}>
              <Text style={styles.nonFoodAlertText}>{t('mealInput.nonFoodBlocked')}</Text>
            </View>
          )}

          {aiMessage && isFoodDetected && (
            <View style={styles.aiSuccessBadge}>
              <Text style={styles.aiSuccessText}>{aiMessage}</Text>
            </View>
          )}

          {/* 複数品目検知時のプレビュー */}
          {detectedItems.length > 1 && (
            <View style={styles.multiItemsPreviewBox}>
              <Text style={styles.multiItemsTitle}>
                {i18n.language === 'ko' ? '📋 개별 등록될 음식 목록:' : '📋 個別登録される料理リスト:'}
              </Text>
              {detectedItems.map((item, idx) => (
                <View key={idx} style={styles.multiItemRow}>
                  <Text style={styles.multiItemName}>• {item.name}</Text>
                  <Text style={styles.multiItemCal}>
                    {item.nutrients.calories?.value !== null ? `${item.nutrients.calories?.value} kcal` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {detectedItems.length <= 1 && inputMode === 'PHOTO' && (
            <>
              <Text style={styles.label}>{t('mealInput.nameLabel')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('mealInput.namePlaceholder')}
                value={name}
                onChangeText={setName}
                editable={!isAnalyzing && !isSaving}
              />
            </>
          )}

          {/* 2. 食事開始時刻ラベルと日時を同一行に配置 (省スペース化) */}
          <View style={styles.timeHeaderRow}>
            <Text style={styles.labelNoMargin}>{t('mealInput.timeLabel')}</Text>
            <Text style={styles.timeDisplayInline}>{formatDateTimeDisplay(eatenAt)}</Text>
          </View>

          <View style={styles.segmentedContainer}>
            <TouchableOpacity style={[styles.segmentBtn, timeOffset === 0 && styles.segmentBtnActive]} onPress={() => handleSetTimeOffset(0)} disabled={isAnalyzing || isSaving}>
              <Text style={[styles.segmentText, timeOffset === 0 && styles.segmentTextActive]}>{t('mealInput.timeNow')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segmentBtn, timeOffset === 30 && styles.segmentBtnActive]} onPress={() => handleSetTimeOffset(30)} disabled={isAnalyzing || isSaving}>
              <Text style={[styles.segmentText, timeOffset === 30 && styles.segmentTextActive]}>{t('mealInput.timeMinus30')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segmentBtn, timeOffset === 60 && styles.segmentBtnActive]} onPress={() => handleSetTimeOffset(60)} disabled={isAnalyzing || isSaving}>
              <Text style={[styles.segmentText, timeOffset === 60 && styles.segmentTextActive]}>{t('mealInput.timeMinus60')}</Text>
            </TouchableOpacity>
          </View>

          {/* 3. 「9大栄養素入力」の見出し行を削除し、グリッドを直結配置 */}
          {detectedItems.length <= 1 && (
            <>
              {validationIssues.length > 0 && (
                <View style={styles.validationWarningBox}>
                  {validationIssues.map((issue, idx) => (
                    <Text key={idx} style={styles.validationWarningText}>{t(issue.messageKey)}</Text>
                  ))}
                </View>
              )}

              <View style={styles.nutrientsInputBoxDirect}>
                {ORDERED_FORM_NUTRIENTS.map((key) => {
                  const item = nutrients[key];
                  const isVerified = item.status === 'VERIFIED';
                  return (
                    <View key={key} style={styles.nutrientInputRow}>
                      <Text style={styles.nutrientLabelText}>{t(`nutrientsShort.${key}`)}</Text>
                      <View style={styles.inputWithToggle}>
                        <TextInput
                          style={styles.numericInput}
                          keyboardType="decimal-pad"
                          placeholder="null"
                          value={item.rawText}
                          onChangeText={(txt) => handleNutrientTextChange(key, txt)}
                          editable={!isAnalyzing && !isSaving}
                        />
                        <TouchableOpacity
                          style={[styles.statusToggleBadge, { backgroundColor: isVerified ? '#E8F5E9' : '#FFF9C4' }]}
                          onPress={() => handleToggleStatus(key)}
                          disabled={isAnalyzing || isSaving}
                        >
                          <Text style={[styles.statusToggleText, { color: isVerified ? '#2E7D32' : '#F57F17' }]}>
                            {isVerified ? t('home.statusVerified') : t('home.statusEstimated')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>

              <Text style={[styles.label, { marginTop: 14 }]}>{t('mealInput.notesLabel')}</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder={t('mealInput.notesPlaceholder')}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
                editable={!isAnalyzing && !isSaving}
              />
            </>
          )}

          {/* 保存ボタン */}
          <TouchableOpacity
            style={[styles.saveBtn, (isAnalyzing || isSaving || !isFoodDetected) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isAnalyzing || isSaving || !isFoodDetected}
          >
            <Text style={styles.saveBtnText}>
              {isAnalyzing || isSaving
                ? t('common.loading')
                : (detectedItems.length > 1
                    ? (i18n.language === 'ko' ? `${detectedItems.length}개 음식 개별 카드 일괄 저장` : `${detectedItems.length}品目を個別カードとして一括保存`)
                    : t('common.save'))}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#212529' },
  closeBtn: { padding: 4 },
  closeBtnText: { color: '#6C757D', fontSize: 15 },
  scrollBody: { padding: 16, paddingBottom: 40 },
  modeTabContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 8, padding: 3, marginBottom: 14 },
  modeTabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  modeTabBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  modeTabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  modeTabTextActive: { color: '#007AFF', fontWeight: '700' },
  cardBox: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 },
  cardBoxTitle: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8 },
  buttonsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#3B82F6', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  actionBtnText: { color: '#2563EB', fontSize: 13, fontWeight: '700' },
  
  /* 行全体の縦中央揃えとボタン高さを44pxに固定 */
  textInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  estimateBtn: { height: 44, backgroundColor: '#10B981', paddingHorizontal: 14, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  estimateBtnDisabled: { backgroundColor: '#A7F3D0' },
  estimateBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  loadingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, marginBottom: 10 },
  loadingText: { fontSize: 13, color: '#007AFF', fontWeight: '600' },
  nonFoodAlertBox: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1, padding: 10, borderRadius: 6, marginBottom: 12 },
  nonFoodAlertText: { fontSize: 12, color: '#991B1B', fontWeight: '700' },
  aiSuccessBadge: { backgroundColor: '#E6FFFA', borderColor: '#B2F5EA', borderWidth: 1, padding: 10, borderRadius: 6, marginBottom: 12 },
  aiSuccessText: { fontSize: 13, color: '#234E52', fontWeight: '700', textAlign: 'center' },
  multiItemsPreviewBox: { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 14 },
  multiItemsTitle: { fontSize: 13, fontWeight: '700', color: '#0369A1', marginBottom: 6 },
  multiItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  multiItemName: { fontSize: 13, color: '#0C4A6E', fontWeight: '600' },
  multiItemCal: { fontSize: 13, color: '#0284C7', fontWeight: '700' },
  thumbnail: { width: '100%', height: 120, borderRadius: 6, marginTop: 10, resizeMode: 'cover' },
  label: { fontSize: 13, fontWeight: '600', color: '#495057', marginBottom: 6 },
  timeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, marginTop: 4 },
  labelNoMargin: { fontSize: 13, fontWeight: '600', color: '#495057' },
  timeDisplayInline: { fontSize: 12, color: '#007AFF', fontWeight: '700' },
  input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#CED4DA', borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 12 },
  multilineInput: { minHeight: 60, textAlignVertical: 'top' },
  segmentedContainer: { flexDirection: 'row', backgroundColor: '#E9ECEF', borderRadius: 8, padding: 2, marginBottom: 12 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  segmentBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  segmentText: { fontSize: 12, color: '#6C757D', fontWeight: '500' },
  segmentTextActive: { color: '#007AFF', fontWeight: '700' },
  validationWarningBox: { backgroundColor: '#FFF3CD', borderColor: '#FFEEBA', borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10, gap: 4 },
  validationWarningText: { fontSize: 12, color: '#856404', fontWeight: '600' },
  nutrientsInputBoxDirect: { backgroundColor: '#F8F9FA', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#E9ECEF', marginTop: 2 },
  nutrientInputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  nutrientLabelText: { fontSize: 12, color: '#495057', flex: 1 },
  inputWithToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  numericInput: { width: 75, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CED4DA', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 13, textAlign: 'right' },
  statusToggleBadge: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  statusToggleText: { fontSize: 10, fontWeight: '700' },
  saveBtn: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 14 },
  saveBtnDisabled: { backgroundColor: '#A0AEC0' },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});