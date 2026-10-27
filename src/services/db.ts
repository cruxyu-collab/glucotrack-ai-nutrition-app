import * as SQLite from 'expo-sqlite';
import { MealRecord, NutrientKey, VerificationStatus } from '../types/nutrition';

const DB_NAME = 'glucotrack.db';
let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
  }
  return dbInstance;
};

export const initializeDatabase = async (): Promise<void> => {
  const db = getDatabase();
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      meal_type TEXT DEFAULT 'MIXED',
      eaten_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meal_nutrients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL,
      nutrient_key TEXT NOT NULL,
      value REAL,
      unit TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('VERIFIED', 'ESTIMATED', 'UNVERIFIED')),
      FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_meals_eaten_at ON meals(eaten_at);
    CREATE INDEX IF NOT EXISTS idx_meal_nutrients_meal_id ON meal_nutrients(meal_id);
  `);
};

export const insertMultipleMealRecords = async (meals: Omit<MealRecord, 'id' | 'createdAt'>[]): Promise<number[]> => {
  const db = getDatabase();
  const insertedIds: number[] = [];

  await db.withTransactionAsync(async () => {
    for (const meal of meals) {
      // 既存DBの CHECK(meal_type IN ('SOLID', 'LIQUID', 'MIXED')) 制約を満たすため 'MIXED' をバインド
      const mealResult = await db.runAsync(
        'INSERT INTO meals (name, eaten_at, notes, meal_type) VALUES (?, ?, ?, ?);',
        [meal.name, meal.eatenAt, meal.notes || null, 'MIXED']
      );

      const mealId = mealResult.lastInsertRowId;
      insertedIds.push(mealId);

      const nutrientKeys = Object.keys(meal.nutrients) as NutrientKey[];
      for (const key of nutrientKeys) {
        const item = meal.nutrients[key];
        const fallbackUnit = key === 'calories' ? 'kcal' : (key === 'sodium' || key === 'cholesterol' ? 'mg' : 'g');
        const unit = (item && item.unit) ? item.unit : fallbackUnit;
        const val = (item && item.value !== undefined) ? item.value : null;
        const status = (item && item.status) ? item.status : 'UNVERIFIED';

        await db.runAsync(
          'INSERT INTO meal_nutrients (meal_id, nutrient_key, value, unit, status) VALUES (?, ?, ?, ?, ?);',
          [mealId, key, val, unit, status]
        );
      }
    }
  });

  return insertedIds;
};

export const insertMealRecord = async (meal: Omit<MealRecord, 'id' | 'createdAt'>): Promise<number> => {
  const ids = await insertMultipleMealRecords([meal]);
  return ids[0];
};

export const getMealsByDate = async (localDatePrefix: string, utcDatePrefix?: string): Promise<MealRecord[]> => {
  const db = getDatabase();
  const query = utcDatePrefix && utcDatePrefix !== localDatePrefix
    ? 'SELECT id, name, eaten_at, notes, created_at FROM meals WHERE eaten_at LIKE ? OR eaten_at LIKE ? ORDER BY eaten_at ASC;'
    : 'SELECT id, name, eaten_at, notes, created_at FROM meals WHERE eaten_at LIKE ? ORDER BY eaten_at ASC;';

  const params = utcDatePrefix && utcDatePrefix !== localDatePrefix
    ? [`${localDatePrefix}%`, `${utcDatePrefix}%`]
    : [`${localDatePrefix}%`];

  const meals = await db.getAllAsync<{
    id: number;
    name: string;
    eaten_at: string;
    notes: string | null;
    created_at: string;
  }>(query, params);

  const result: MealRecord[] = [];
  for (const meal of meals) {
    const nutrientsRows = await db.getAllAsync<{
      nutrient_key: NutrientKey;
      value: number | null;
      unit: 'kcal' | 'g' | 'mg';
      status: VerificationStatus;
    }>('SELECT nutrient_key, value, unit, status FROM meal_nutrients WHERE meal_id = ?;', [meal.id]);

    const nutrientsMap: Record<string, any> = {};
    for (const row of nutrientsRows) {
      nutrientsMap[row.nutrient_key] = {
        value: row.value,
        unit: row.unit,
        status: row.status,
      };
    }

    result.push({
      id: meal.id,
      name: meal.name,
      eatenAt: meal.eaten_at,
      notes: meal.notes || undefined,
      createdAt: meal.created_at,
      nutrients: nutrientsMap as Record<NutrientKey, any>,
    });
  }
  return result;
};

export const getAllMeals = async (): Promise<MealRecord[]> => {
  const db = getDatabase();
  const meals = await db.getAllAsync<{
    id: number;
    name: string;
    eaten_at: string;
    notes: string | null;
    created_at: string;
  }>('SELECT id, name, eaten_at, notes, created_at FROM meals ORDER BY eaten_at ASC;');

  const result: MealRecord[] = [];
  for (const meal of meals) {
    const nutrientsRows = await db.getAllAsync<{
      nutrient_key: NutrientKey;
      value: number | null;
      unit: 'kcal' | 'g' | 'mg';
      status: VerificationStatus;
    }>('SELECT nutrient_key, value, unit, status FROM meal_nutrients WHERE meal_id = ?;', [meal.id]);

    const nutrientsMap: Record<string, any> = {};
    for (const row of nutrientsRows) {
      nutrientsMap[row.nutrient_key] = {
        value: row.value,
        unit: row.unit,
        status: row.status,
      };
    }

    result.push({
      id: meal.id,
      name: meal.name,
      eatenAt: meal.eaten_at,
      notes: meal.notes || undefined,
      createdAt: meal.created_at,
      nutrients: nutrientsMap as Record<NutrientKey, any>,
    });
  }
  return result;
};

export interface DaySummary {
  mealCount: number;
  totalCalories: number;
  hasHighSugar: boolean;
}

export const getMonthSummaryMap = async (yearMonthPrefix: string): Promise<Record<string, DaySummary>> => {
  const db = getDatabase();
  const rows = await db.getAllAsync<{
    day_str: string;
    meal_count: number;
    total_calories: number;
    has_high_sugar: number;
  }>(`
    SELECT substr(m.eaten_at, 1, 10) as day_str,
           COUNT(DISTINCT m.id) as meal_count,
           COALESCE(SUM(CASE WHEN n.nutrient_key = 'calories' THEN n.value ELSE 0 END), 0) as total_calories,
           MAX(CASE WHEN n.nutrient_key = 'sugars' AND n.value >= 30 THEN 1 ELSE 0 END) as has_high_sugar
    FROM meals m
    LEFT JOIN meal_nutrients n ON m.id = n.meal_id
    WHERE m.eaten_at LIKE ?
    GROUP BY day_str;
  `, [`${yearMonthPrefix}%`]);

  const map: Record<string, DaySummary> = {};
  for (const row of rows) {
    map[row.day_str] = {
      mealCount: row.meal_count,
      totalCalories: Math.round(row.total_calories),
      hasHighSugar: row.has_high_sugar === 1,
    };
  }
  return map;
};

export const deleteMealRecord = async (mealId: number): Promise<void> => {
  const db = getDatabase();
  await db.runAsync('DELETE FROM meals WHERE id = ?;', [mealId]);
};

export const clearAllMeals = async (): Promise<void> => {
  const db = getDatabase();
  await db.execAsync('DELETE FROM meals;');
};