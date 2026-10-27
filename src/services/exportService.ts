import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getAllMeals } from './db';

/**
 * SQLiteに保存された全食事データをCSVファイルとして生成し、iOS共有メニューを開く
 * (食事形態列を廃止し、医師が閲覧しやすいシンプルなレイアウトに変更)
 */
export const exportMealsToCSV = async (lang: 'ja' | 'ko' = 'ja'): Promise<void> => {
  const meals = await getAllMeals();
  if (meals.length === 0) {
    throw new Error(lang === 'ko' ? '내보낼 식사 기록이 없습니다.' : 'エクスポートする食事記録がありません。');
  }

  const header = lang === 'ko'
    ? 'ID,식사명,일시,열량(kcal),탄수화물(g),당류(g),나트륨(mg),식이섬유(g),총지방(g),포화지방(g),트랜스지방(g),콜레스테롤(mg),메모\n'
    : 'ID,食事名,日時,熱量(kcal),炭水化物(g),糖類(g),ナトリウム(mg),食物繊維(g),総脂質(g),飽和脂肪酸(g),トランス脂肪酸(g),コレステロール(mg),メモ\n';

  const rows = meals.map((m) => {
    const cal = m.nutrients.calories?.value ?? '';
    const carb = m.nutrients.carbohydrates?.value ?? '';
    const sugar = m.nutrients.sugars?.value ?? '';
    const sod = m.nutrients.sodium?.value ?? '';
    const fib = m.nutrients.fiber?.value ?? '';
    const fat = m.nutrients.totalFat?.value ?? '';
    const satFat = m.nutrients.saturatedFat?.value ?? '';
    const transFat = m.nutrients.transFat?.value ?? '';
    const chol = m.nutrients.cholesterol?.value ?? '';
    const note = (m.notes || '').replace(/,/g, ' ').replace(/"/g, '""');
    return `${m.id},"${m.name}",${m.eatenAt},${cal},${carb},${sugar},${sod},${fib},${fat},${satFat},${transFat},${chol},"${note}"`;
  }).join('\n');

  const csvContent = '\uFEFF' + header + rows;
  const fileUri = `${FileSystem.cacheDirectory}glucotrack_meals.csv`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: 'utf8',
  });

  if (await Sharing.isAvailableAsync()) {
    Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: lang === 'ko' ? '식사 기록 내보내기' : '食事記録のエクスポート',
      UTI: 'public.comma-separated-values-text',
    });
  }
};