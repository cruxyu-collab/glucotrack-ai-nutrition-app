import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MealRecord, NutrientKey } from '../types/nutrition';

interface Props {
  meals: MealRecord[];
  dateLabel?: string;
}

export default function DailyNutritionSummary({ meals, dateLabel }: Props): React.JSX.Element {
  const { t } = useTranslation();

  const calculateNutrientSummary = (key: NutrientKey) => {
    let verifiedSum = 0;
    let estimatedSum = 0;
    let hasVerified = false;
    let hasEstimated = false;
    let hasUnverified = false;

    for (const meal of meals) {
      const item = meal.nutrients[key];
      if (item && item.value !== null && item.value !== undefined) {
        if (item.status === 'VERIFIED') {
          verifiedSum += item.value;
          hasVerified = true;
        } else if (item.status === 'ESTIMATED') {
          estimatedSum += item.value;
          hasEstimated = true;
        }
      } else {
        hasUnverified = true;
      }
    }

    const total = verifiedSum + estimatedSum;
    const hasAny = hasVerified || hasEstimated;

    return {
      total: hasAny ? Math.round(total * 10) / 10 : null,
      verified: Math.round(verifiedSum * 10) / 10,
      estimated: Math.round(estimatedSum * 10) / 10,
      hasUnverified,
    };
  };

  const nutrientKeys: { key: NutrientKey; unit: string }[] = [
    { key: 'calories', unit: 'kcal' },
    { key: 'carbohydrates', unit: 'g' },
    { key: 'sugars', unit: 'g' },
    { key: 'sodium', unit: 'mg' }, // 4位
    { key: 'fiber', unit: 'g' },
    { key: 'totalFat', unit: 'g' },
    { key: 'saturatedFat', unit: 'g' },
    { key: 'transFat', unit: 'g' },
    { key: 'cholesterol', unit: 'mg' },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {dateLabel ? `${dateLabel} ${t('summary.dailyTotal')}` : t('summary.dailyTotal')}
      </Text>

      <View style={styles.grid}>
        {nutrientKeys.map(({ key, unit }) => {
          const stat = calculateNutrientSummary(key);
          const isKeyMacro = key === 'calories' || key === 'carbohydrates' || key === 'sugars' || key === 'sodium';

          return (
            <View key={key} style={[styles.gridItem, isKeyMacro && styles.gridItemKey]}>
              <Text style={styles.nutrientTitle} numberOfLines={1}>
                {t(`nutrientsShort.${key}`)}
              </Text>
              
              {/* 数値と単位の視覚分離 */}
              <View style={styles.valueRow}>
                <Text style={styles.totalNumber}>
                  {stat.total !== null ? String(stat.total) : '-'}
                </Text>
                {stat.total !== null && <Text style={styles.unitText}>{unit}</Text>}
              </View>

              {/* 公式(V) vs 推定(E)の内訳バッジ */}
              {stat.total !== null && (
                <View style={styles.breakdownRow}>
                  {stat.verified > 0 && (
                    <Text style={styles.verifiedBadge}>V:{stat.verified}</Text>
                  )}
                  {stat.estimated > 0 && (
                    <Text style={styles.estimatedBadge}>E:{stat.estimated}</Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      <Text style={styles.footerNotice}>{t('summary.unverifiedNotice')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '31.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  // 糖類・熱量・炭水化物・ナトリウムの視認性ハイライト
  gridItemKey: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  nutrientTitle: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  totalNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  unitText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  verifiedBadge: {
    fontSize: 9,
    color: '#15803D',
    fontWeight: '700',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  estimatedBadge: {
    fontSize: 9,
    color: '#B45309',
    fontWeight: '700',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  footerNotice: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    fontStyle: 'italic',
  },
});