import { getDatabase } from './db';
import { NutrientKey, VerificationStatus } from '../types/nutrition';
import { toLocalISOString } from '../utils/date';

interface SeedTemplate {
  nameJa: string;
  nameKo: string;
  notesJa?: string;
  notesKo?: string;
  calories: number;
  carbs: number;
  sugars: number;
  sodium: number;
  fiber: number;
  fat: number;
  satFat: number;
  transFat: number;
  cholesterol: number;
  isHighSugar?: boolean;
}

const MEAL_TEMPLATES: SeedTemplate[] = [
  {
    nameJa: '鶏胸肉とアボカドの低糖類サラダ',
    nameKo: '닭가슴살 아보카도 저당 샐러드',
    notesJa: '公式栄養表示確認済。食前薬服用',
    notesKo: '공식 성분표 확인. 식전 당뇨약 복용',
    calories: 380,
    carbs: 12.0,
    sugars: 3.2,
    sodium: 480,
    fiber: 7.5,
    fat: 18.0,
    satFat: 3.2,
    transFat: 0.0,
    cholesterol: 75,
  },
  {
    nameJa: '低糖類・高タンパクプロテインシェイク',
    nameKo: '저당 고단백 프로틴 쉐이크',
    notesJa: 'ホエイプロテイン＋無調整豆乳200ml',
    notesKo: 'WPI 프로틴 + 무가당 두유 200ml',
    calories: 210,
    carbs: 4.5,
    sugars: 1.5,
    sodium: 190,
    fiber: 2.0,
    fat: 3.5,
    satFat: 0.8,
    transFat: 0.0,
    cholesterol: 15,
  },
  {
    nameJa: '牛赤身肉とブロッコリー炒め・玄米ご飯100g',
    nameKo: '소고기 우둔살 브로콜리 볶음과 현미밥 100g',
    notesJa: '食後30分ウォーキング実施予定',
    notesKo: '식후 30분 가벼운 유산소 산책 예정',
    calories: 520,
    carbs: 38.0,
    sugars: 4.8,
    sodium: 620,
    fiber: 5.5,
    fat: 16.0,
    satFat: 4.5,
    transFat: 0.2,
    cholesterol: 85,
  },
  {
    nameJa: '焼き鮭定食・豆腐とわかめの味噌汁',
    nameKo: '연어 구이 정식과 두부 미역 된장국',
    notesJa: 'ご飯は半分(80g)に調整',
    notesKo: '밥은 반 공기(80g)로 탄수화물 조절',
    calories: 460,
    carbs: 32.0,
    sugars: 2.8,
    sodium: 890,
    fiber: 4.0,
    fat: 19.0,
    satFat: 3.8,
    transFat: 0.0,
    cholesterol: 90,
  },
  {
    nameJa: '味付け牛カルビと冷麺セット',
    nameKo: '양념 소갈비와 비빔냉면',
    notesJa: '糖類超過アラート検知。翌日厳格管理予定',
    notesKo: '고당류 경고 발화. 다음 날 엄격 식단 관리 예정',
    calories: 890,
    carbs: 85.0,
    sugars: 38.5,
    sodium: 1650,
    fiber: 3.0,
    fat: 34.0,
    satFat: 12.0,
    transFat: 0.8,
    cholesterol: 140,
    isHighSugar: true,
  },
];

export const seedTwoMonthsMealData = async (lang: 'ja' | 'ko' = 'ko'): Promise<number> => {
  const db = getDatabase();
  let totalInsertedMeals = 0;

  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM meals;');

    const now = new Date();

    for (let dayOffset = 59; dayOffset >= 0; dayOffset--) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - dayOffset);

      const isCheatDay = dayOffset > 0 && dayOffset % 6 === 0;
      const mealsToday = (dayOffset % 3 === 0) ? 1 : 2;

      for (let mealIndex = 0; mealIndex < mealsToday; mealIndex++) {
        let template: SeedTemplate;

        if (isCheatDay && mealIndex === 0) {
          template = MEAL_TEMPLATES[4];
        } else if (mealIndex === 0) {
          template = MEAL_TEMPLATES[(dayOffset + mealIndex) % 4];
        } else {
          template = MEAL_TEMPLATES[1];
        }

        const mealTime = new Date(targetDate);
        if (mealIndex === 0) {
          mealTime.setHours(12, 30 + (dayOffset % 20), 0);
        } else {
          mealTime.setHours(19, 10 + (dayOffset % 25), 0);
        }

        const mealName = lang === 'ko' ? template.nameKo : template.nameJa;
        const notes = lang === 'ko' ? template.notesKo : template.notesJa;

        // CHECK 制約を満たすため 'MIXED' をバインド
        const mealResult = await db.runAsync(
          'INSERT INTO meals (name, eaten_at, notes, meal_type) VALUES (?, ?, ?, ?);',
          [mealName, toLocalISOString(mealTime), notes || null, 'MIXED']
        );

        const mealId = mealResult.lastInsertRowId;
        totalInsertedMeals++;

        const nutrientsData: { key: NutrientKey; val: number; unit: 'kcal' | 'g' | 'mg'; status: VerificationStatus }[] = [
          { key: 'calories', val: template.calories, unit: 'kcal', status: template.isHighSugar ? 'ESTIMATED' : 'VERIFIED' },
          { key: 'carbohydrates', val: template.carbs, unit: 'g', status: template.isHighSugar ? 'ESTIMATED' : 'VERIFIED' },
          { key: 'sugars', val: template.sugars, unit: 'g', status: template.isHighSugar ? 'ESTIMATED' : 'VERIFIED' },
          { key: 'sodium', val: template.sodium, unit: 'mg', status: 'VERIFIED' },
          { key: 'fiber', val: template.fiber, unit: 'g', status: 'VERIFIED' },
          { key: 'totalFat', val: template.fat, unit: 'g', status: 'ESTIMATED' },
          { key: 'saturatedFat', val: template.satFat, unit: 'g', status: 'ESTIMATED' },
          { key: 'transFat', val: template.transFat, unit: 'g', status: 'ESTIMATED' },
          { key: 'cholesterol', val: template.cholesterol, unit: 'mg', status: 'ESTIMATED' },
        ];

        for (const item of nutrientsData) {
          await db.runAsync(
            'INSERT INTO meal_nutrients (meal_id, nutrient_key, value, unit, status) VALUES (?, ?, ?, ?, ?);',
            [mealId, item.key, item.val, item.unit, item.status]
          );
        }
      }
    }
  });

  return totalInsertedMeals;
};