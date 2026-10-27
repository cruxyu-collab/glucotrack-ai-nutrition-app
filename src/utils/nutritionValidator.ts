import { NutrientKey, VerificationStatus } from '../types/nutrition';

export interface ValidationIssue {
  key?: NutrientKey;
  severity: 'WARNING' | 'ERROR';
  messageKey: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

/**
 * 9大栄養素データの生化学的整合性および臨床境界値の厳格なバリデーション
 */
export const validateNutritionData = (
  nutrients: Record<NutrientKey, { rawText: string; status: VerificationStatus }>
): ValidationResult => {
  const issues: ValidationIssue[] = [];

  const getValue = (key: NutrientKey): number | null => {
    const val = parseFloat(nutrients[key].rawText);
    return isNaN(val) ? null : val;
  };

  const calories = getValue('calories');
  const carbs = getValue('carbohydrates');
  const sugars = getValue('sugars');
  const fiber = getValue('fiber');
  const sodium = getValue('sodium');

  // 1. 負数(マイナス値)の絶対遮断 (ERROR)
  const keys = Object.keys(nutrients) as NutrientKey[];
  for (const k of keys) {
    const val = getValue(k);
    if (val !== null && val < 0) {
      issues.push({
        key: k,
        severity: 'ERROR',
        messageKey: 'validation.negativeValue',
      });
    }
  }

  // 2. 生化学的矛盾検知: 糖類 > 炭水化物 (WARNING)
  if (carbs !== null && sugars !== null && sugars > carbs) {
    issues.push({
      key: 'sugars',
      severity: 'WARNING',
      messageKey: 'validation.sugarsExceedCarbs',
    });
  }

  // 3. 生化学的矛盾検知: 食物繊維 > 炭水化物 (WARNING)
  if (carbs !== null && fiber !== null && fiber > carbs) {
    issues.push({
      key: 'fiber',
      severity: 'WARNING',
      messageKey: 'validation.fiberExceedCarbs',
    });
  }

  // 4. 物理的極端値検知: 1食あたり3,500kcal超またはナトリウム5,000mg超 (WARNING)
  if (calories !== null && calories > 3500) {
    issues.push({
      key: 'calories',
      severity: 'WARNING',
      messageKey: 'validation.extremeCalories',
    });
  }
  if (sodium !== null && sodium > 5000) {
    issues.push({
      key: 'sodium',
      severity: 'WARNING',
      messageKey: 'validation.extremeCalories', // 物理極端値警告
    });
  }

  // 5. 糖尿病臨床ガードレール: 1食の高糖類警告 (糖類 >= 30g または 炭水化物 >= 70g)
  if (sugars !== null && sugars >= 30) {
    issues.push({
      key: 'sugars',
      severity: 'WARNING',
      messageKey: 'validation.highSugarAlert',
    });
  } else if (carbs !== null && carbs >= 70) {
    issues.push({
      key: 'carbohydrates',
      severity: 'WARNING',
      messageKey: 'validation.highCarbAlert',
    });
  }

  return {
    isValid: !issues.some((i) => i.severity === 'ERROR'),
    issues,
  };
};