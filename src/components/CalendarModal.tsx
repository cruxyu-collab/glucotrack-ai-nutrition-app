import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getMonthSummaryMap, DaySummary } from '../services/db';
import { getLocalDateString } from '../utils/date';

interface Props {
  visible: boolean;
  selectedDateStr: string; // YYYY-MM-DD
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
}

export default function CalendarModal({
  visible,
  selectedDateStr,
  onClose,
  onSelectDate,
}: Props): React.JSX.Element {
  const { t } = useTranslation();

  const todayStr = getLocalDateString(new Date());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [focusedDateStr, setFocusedDateStr] = useState<string>(selectedDateStr);
  const [monthData, setMonthData] = useState<Record<string, DaySummary>>({});

  const isFocusedToday = focusedDateStr === todayStr;

  useEffect(() => {
    if (visible && selectedDateStr) {
      const [y, m] = selectedDateStr.split('-').map(Number);
      setCurrentYear(y);
      setCurrentMonth(m);
      setFocusedDateStr(selectedDateStr);
    }
  }, [visible, selectedDateStr]);

  useEffect(() => {
    if (visible) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const prefix = `${currentYear}-${pad(currentMonth)}`;
      getMonthSummaryMap(prefix).then(setMonthData);
    }
  }, [visible, currentYear, currentMonth]);

  const handlePrevMonth = (): void => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = (): void => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // カレンダー内で今日の日付へ即時フォーカス移動
  const handleJumpToTodayInCalendar = (): void => {
    const [y, m] = todayStr.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m);
    setFocusedDateStr(todayStr);
  };

  const handleConfirmJump = (): void => {
    onSelectDate(focusedDateStr);
    onClose();
  };

  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0(Sun) ~ 6(Sat)
  const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();

  const pad = (n: number) => String(n).padStart(2, '0');
  const focusedSummary = monthData[focusedDateStr];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalRoot}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('calendar.title')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {/* 月移動バー */}
          <View style={styles.monthNavBar}>
            <TouchableOpacity style={styles.monthArrow} onPress={handlePrevMonth}>
              <Text style={styles.arrowText}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {currentYear}年 {currentMonth}月
            </Text>
            <TouchableOpacity style={styles.monthArrow} onPress={handleNextMonth}>
              <Text style={styles.arrowText}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* 凡例 (ドット意味) */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#2E7D32' }]} />
              <Text style={styles.legendText}>{t('calendar.legendNormal')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#F57F17' }]} />
              <Text style={styles.legendText}>{t('calendar.legendWarning')}</Text>
            </View>
          </View>

          {/* 曜日ラベル (日: 赤 / 土: 青) */}
          <View style={styles.weekRow}>
            {(t('calendar.weekDays', { returnObjects: true }) as string[]).map((day, idx) => (
              <Text
                key={idx}
                style={[
                  styles.weekText,
                  idx === 0 && { color: '#DC2626' }, // 日曜日
                  idx === 6 && { color: '#2563EB' }, // 土曜日
                ]}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* カレンダーマトリックス */}
          <View style={styles.calendarGrid}>
            {/* 月初空白 */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.dayCell} />
            ))}

            {/* 日付セル */}
            {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${currentYear}-${pad(currentMonth)}-${pad(dayNum)}`;
              const isFocused = dateStr === focusedDateStr;
              const isCellToday = dateStr === todayStr;
              const summary = monthData[dateStr];

              // 曜日インデックス: 0(日) 〜 6(土)
              const dayOfWeek = (firstDayOfWeek + idx) % 7;

              // 日付数値の色分け (日: 赤 / 土: 青 / 平日: 濃いグレー)
              const getDayNumColor = (): string => {
                if (isFocused) return '#1D4ED8';
                if (dayOfWeek === 0) return '#DC2626'; // 日曜
                if (dayOfWeek === 6) return '#2563EB'; // 土曜
                return '#1E293B'; // 平日
              };

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    isFocused && styles.dayCellFocused,
                    isCellToday && !isFocused && styles.dayCellToday,
                  ]}
                  onPress={() => setFocusedDateStr(dateStr)}
                >
                  <Text style={[styles.dayNumText, { color: getDayNumColor() }, isFocused && styles.dayNumTextFocused]}>
                    {dayNum}
                  </Text>

                  {/* 状態インジケータードット */}
                  <View style={styles.dotArea}>
                    {summary && summary.mealCount > 0 && (
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: summary.hasHighSugar ? '#F57F17' : '#2E7D32' },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 選択日のミニプレビューカード */}
          <View style={styles.previewCard}>
            <View style={styles.previewHeaderRow}>
              <Text style={styles.previewDateTitle}>
                📅 {focusedDateStr} {isFocusedToday ? `(${t('common.today')})` : ''}
              </Text>

              {/* 1. 今日が未選択時の「今日へ戻る」ボタン */}
              {!isFocusedToday && (
                <TouchableOpacity style={styles.calendarTodayBtn} onPress={handleJumpToTodayInCalendar}>
                  <Text style={styles.calendarTodayBtnText}>{t('calendar.jumpToToday')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {focusedSummary && focusedSummary.mealCount > 0 ? (
              <View style={styles.previewContent}>
                <Text style={styles.previewText}>
                  • {focusedSummary.mealCount} {t('calendar.mealsCount')} ({t('calendar.caloriesPrefix')} {focusedSummary.totalCalories} kcal)
                </Text>
                {focusedSummary.hasHighSugar && (
                  <Text style={styles.warningTag}>{t('calendar.highSugarWarning')}</Text>
                )}
              </View>
            ) : (
              <Text style={styles.previewEmptyText}>{t('calendar.noRecords')}</Text>
            )}

            <TouchableOpacity style={styles.jumpBtn} onPress={handleConfirmJump}>
              <Text style={styles.jumpBtnText}>{t('calendar.jumpToDate')}</Text>
            </TouchableOpacity>
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
  title: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  closeBtn: { padding: 4 },
  closeBtnText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 40 },
  monthNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthArrow: { padding: 8 },
  arrowText: { fontSize: 16, color: '#007AFF', fontWeight: '700' },
  monthTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 4,
  },
  weekText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  dayCell: {
    width: '14.28%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayCellFocused: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: '#F0F9FF',
  },
  dayNumText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayNumTextFocused: {
    fontWeight: '800',
    fontSize: 15,
  },
  dotArea: {
    height: 6,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  previewCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewDateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  calendarTodayBtn: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  calendarTodayBtnText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '700',
  },
  previewContent: {
    marginBottom: 12,
    gap: 4,
  },
  previewText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  warningTag: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '700',
  },
  previewEmptyText: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 12,
  },
  jumpBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  jumpBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});