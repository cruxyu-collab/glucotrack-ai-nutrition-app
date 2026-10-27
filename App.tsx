import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import './src/services/i18n';
import { initializeLanguage } from './src/services/i18n';
import { initializeDatabase, insertMultipleMealRecords, getMealsByDate, deleteMealRecord } from './src/services/db';
import { MealRecord, NutrientKey } from './src/types/nutrition';
import MealInputModal from './src/components/MealInputModal';
import DailyNutritionSummary from './src/components/DailyNutritionSummary';
import SettingsModal from './src/components/SettingsModal';
import CalendarModal from './src/components/CalendarModal';
import { getLocalDateString } from './src/utils/date';

const ORDERED_NUTRIENT_KEYS: NutrientKey[] = [
  'calories',
  'carbohydrates',
  'sugars',
  'sodium', // 4位
  'fiber',
  'totalFat',
  'saturatedFat',
  'transFat',
  'cholesterol',
];

export default function App(): React.JSX.Element {
  const { t } = useTranslation();
  const [isReady, setIsReady] = useState<boolean>(false);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState<boolean>(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);

  const todayStr = getLocalDateString(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const isSelectedDateToday = selectedDate === todayStr;

  useEffect(() => {
    const setup = async (): Promise<void> => {
      await initializeLanguage();
      await initializeDatabase();
      await loadMealsForDate(selectedDate);
    };

    setup().finally(() => {
      setIsReady(true);
    });
  }, [selectedDate]);

  const loadMealsForDate = async (targetDate: string): Promise<void> => {
    const data = await getMealsByDate(targetDate);
    setMeals(data);
  };

  const handlePrevDay = (): void => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(getLocalDateString(d));
  };

  const handleNextDay = (): void => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(getLocalDateString(d));
  };

  const handleJumpToToday = (): void => {
    setSelectedDate(todayStr);
  };

  const handleSaveMultipleMeals = async (newMeals: Omit<MealRecord, 'id' | 'createdAt'>[]): Promise<void> => {
    await insertMultipleMealRecords(newMeals);
    await loadMealsForDate(selectedDate);
  };

  const handleDeleteMeal = (id: number): void => {
    Alert.alert(
      t('home.deleteConfirmTitle'),
      t('home.deleteConfirmMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteMealRecord(id);
            await loadMealsForDate(selectedDate);
          },
        },
      ]
    );
  };

  if (!isReady) {
    return (
      <View style={styles.centerContainer}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('common.appName')}</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => setIsSettingsVisible(true)}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* 日付ナビゲーションバー */}
        <View style={styles.dateNavBar}>
          <TouchableOpacity style={styles.dateNavArrow} onPress={handlePrevDay}>
            <Text style={styles.dateNavArrowText}>◀</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dateNavCenterBtn} onPress={() => setIsCalendarVisible(true)}>
            <Text style={styles.dateNavText}>
              {selectedDate} {isSelectedDateToday ? `(${t('common.today')})` : ''}
            </Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateNavArrow, isSelectedDateToday && styles.dateNavArrowDisabled]}
            onPress={handleNextDay}
            disabled={isSelectedDateToday}
          >
            <Text style={[styles.dateNavArrowText, isSelectedDateToday && styles.dateNavArrowTextDisabled]}>▶</Text>
          </TouchableOpacity>
        </View>

        {!isSelectedDateToday && (
          <TouchableOpacity style={styles.backToTodayBtn} onPress={handleJumpToToday}>
            <Text style={styles.backToTodayBtnText}>{t('common.backToToday')}</Text>
          </TouchableOpacity>
        )}

        {/* 食事登録ボタン */}
        <TouchableOpacity style={styles.addRecordBtn} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.addRecordBtnText}>{t('home.addMealBtn')}</Text>
        </TouchableOpacity>

        {/* 栄養サマリー */}
        <DailyNutritionSummary
          meals={meals}
          dateLabel={isSelectedDateToday ? undefined : selectedDate}
        />

        {/* 食事記録一覧 (食事形態バッジを廃止し、名前をワイドに表示) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isSelectedDateToday ? t('home.mealHistoryTitle') : `${selectedDate} ${t('home.mealHistoryTitle')}`} ({meals.length}件)
          </Text>

          {meals.length === 0 ? (
            <Text style={styles.emptyText}>{t('home.emptyMeals')}</Text>
          ) : (
            meals.map((meal) => (
              <View key={meal.id} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => meal.id && handleDeleteMeal(meal.id)}
                  >
                    <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                </View>

                {/* 時間とメモ */}
                <View style={styles.metaRow}>
                  <Text style={styles.mealTime}>
                    🕒 {new Date(meal.eatenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {meal.notes && (
                    <Text style={styles.mealNotes} numberOfLines={1}>
                      📝 {meal.notes}
                    </Text>
                  )}
                </View>

                {/* 3x3グリッド */}
                <View style={styles.nutrientGrid3x3NoBorder}>
                  {ORDERED_NUTRIENT_KEYS.map((key) => (
                    <NutrientCell
                      key={key}
                      label={t(`nutrientsShort.${key}`)}
                      item={meal.nutrients[key]}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 食事登録モーダル */}
      <MealInputModal
        visible={isModalVisible}
        targetDateStr={selectedDate}
        onClose={() => setIsModalVisible(false)}
        onSaveMultiple={handleSaveMultipleMeals}
      />

      {/* 設定モーダル */}
      <SettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        onDataCleared={() => loadMealsForDate(selectedDate)}
      />

      {/* カレンダーモーダル */}
      <CalendarModal
        visible={isCalendarVisible}
        selectedDateStr={selectedDate}
        onClose={() => setIsCalendarVisible(false)}
        onSelectDate={(date) => setSelectedDate(date)}
      />
    </SafeAreaView>
  );
}

function NutrientCell({ label, item }: { label: string; item?: any }): React.JSX.Element {
  const isPresent = item && item.value !== null && item.value !== undefined;
  const isVerified = item?.status === 'VERIFIED';

  const getStatusColor = (): string => {
    if (!isPresent) return '#CBD5E1';
    return isVerified ? '#16A34A' : '#D97706';
  };

  return (
    <View style={styles.gridCell}>
      <View style={styles.gridCellHeader}>
        <Text style={styles.gridCellLabel} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.dotIndicator, { backgroundColor: getStatusColor() }]} />
      </View>
      <View style={styles.gridCellValueRow}>
        <Text style={styles.gridCellValueNumber}>
          {isPresent ? String(item.value) : '-'}
        </Text>
        {isPresent && <Text style={styles.gridCellUnit}>{item.unit}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  settingsBtn: { padding: 6, borderRadius: 8, backgroundColor: '#E2E8F0' },
  settingsIcon: { fontSize: 20 },
  dateNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateNavArrow: { paddingHorizontal: 12, paddingVertical: 4 },
  dateNavArrowDisabled: { opacity: 0.2 },
  dateNavArrowText: { fontSize: 16, color: '#007AFF', fontWeight: '800' },
  dateNavArrowTextDisabled: { color: '#94A3B8' },
  dateNavCenterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 8 },
  dateNavText: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  calendarIcon: { fontSize: 14 },
  backToTodayBtn: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  backToTodayBtnText: { color: '#0369A1', fontSize: 12, fontWeight: '700' },
  addRecordBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addRecordBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, color: '#0F172A' },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginVertical: 16 },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealName: { fontSize: 16, fontWeight: '800', color: '#0F172A', flex: 1, marginRight: 8 },
  deleteBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  deleteBtnText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  mealTime: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  mealNotes: { fontSize: 12, color: '#475569', flex: 1 },
  nutrientGrid3x3NoBorder: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  gridCell: {
    width: '31.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridCellHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  gridCellLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', flex: 1 },
  gridCellValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  gridCellValueNumber: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  gridCellUnit: { fontSize: 9, color: '#94A3B8', fontWeight: '600' },
  dotIndicator: { width: 6, height: 6, borderRadius: 3 },
});