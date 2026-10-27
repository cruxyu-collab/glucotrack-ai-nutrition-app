/**
 * 追跡対象の9大栄養素キーの定義 (ナトリウムを4位に配置)
 */
export type NutrientKey =
  | 'calories'      // 1. エネルギー (kcal)
  | 'carbohydrates' // 2. 炭水化物 (g)
  | 'sugars'        // 3. 糖類 (g)
  | 'sodium'        // 4. ナトリウム (mg)
  | 'fiber'         // 5. 食物繊維 (g)
  | 'totalFat'      // 6. 脂質 (g)
  | 'saturatedFat'  // 7. 飽和脂肪酸 (g)
  | 'transFat'      // 8. トランス脂肪酸 (g)
  | 'cholesterol';  // 9. コレステロール (mg)

/**
 * 栄養素データの信頼度ステータス
 */
export type VerificationStatus =
  | 'VERIFIED'    // 公式確認済 (食品表示OCR等の正確な値)
  | 'ESTIMATED'   // AI推定値 (料理写真・テキストからの推計値)
  | 'UNVERIFIED'; // 未確認 (情報がなく、0と仮定できない未知の値)

/**
 * 各栄養素の個別値オブジェクト
 */
export interface NutrientValue {
  value: number | null;
  unit: 'kcal' | 'g' | 'mg';
  status: VerificationStatus;
}

/**
 * 1回の食事記録エンティティ (食事形態を廃止しシンプル化)
 */
export interface MealRecord {
  id?: number;
  name: string;
  eatenAt: string; // ISO 8601形式 (ローカル時間基準)
  notes?: string;
  nutrients: Record<NutrientKey, NutrientValue>;
  createdAt?: string;
}

/**
 * 9大栄養素の初期デフォルト生成関数
 */
export const createEmptyNutrients = (): Record<NutrientKey, NutrientValue> => ({
  calories: { value: null, unit: 'kcal', status: 'UNVERIFIED' },
  carbohydrates: { value: null, unit: 'g', status: 'UNVERIFIED' },
  sugars: { value: null, unit: 'g', status: 'UNVERIFIED' },
  sodium: { value: null, unit: 'mg', status: 'UNVERIFIED' },
  fiber: { value: null, unit: 'g', status: 'UNVERIFIED' },
  totalFat: { value: null, unit: 'g', status: 'UNVERIFIED' },
  saturatedFat: { value: null, unit: 'g', status: 'UNVERIFIED' },
  transFat: { value: null, unit: 'g', status: 'UNVERIFIED' },
  cholesterol: { value: null, unit: 'mg', status: 'UNVERIFIED' },
});