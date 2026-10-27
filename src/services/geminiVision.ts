import { NutrientKey, VerificationStatus } from '../types/nutrition';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const FAST_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
];

export interface DetectedMealItem {
  name: string;
  isNutritionLabel: boolean;
  notes: string;
  nutrients: Record<NutrientKey, { value: number | null; unit: 'kcal' | 'g' | 'mg'; status: VerificationStatus }>;
}

export interface VisionAnalysisResult {
  isFood: boolean;
  usedModel: string;
  items: DetectedMealItem[];
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const getNutrientUnit = (key: NutrientKey): 'kcal' | 'g' | 'mg' => {
  if (key === 'calories') return 'kcal';
  if (key === 'sodium' || key === 'cholesterol') return 'mg';
  return 'g';
};

const safeParseJson = (rawText: string): any => {
  if (!rawText || rawText.trim() === '') {
    throw new Error('EMPTY_RESPONSE');
  }

  try {
    return JSON.parse(rawText.trim());
  } catch {}

  let cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {}

  const startObj = cleaned.indexOf('{');
  const endObj = cleaned.lastIndexOf('}');
  if (startObj !== -1 && endObj !== -1) {
    try {
      let jsonStr = cleaned.substring(startObj, endObj + 1);
      jsonStr = jsonStr.replace(/\/\/.*$/gm, '');
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
      jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      return JSON.parse(jsonStr);
    } catch {}
  }

  const startArr = cleaned.indexOf('[');
  const endArr = cleaned.lastIndexOf(']');
  if (startArr !== -1 && endArr !== -1) {
    try {
      const arrStr = cleaned.substring(startArr, endArr + 1);
      const arr = JSON.parse(arrStr);
      return { isFood: true, items: arr };
    } catch {}
  }

  throw new Error(`PARSE_FAILED: ${cleaned.slice(0, 30)}`);
};

export const analyzeMealImage = async (
  base64Image: string,
  lang: 'ja' | 'ko' = 'ja',
  mimeType: string = 'image/jpeg'
): Promise<VisionAnalysisResult> => {
  if (!GEMINI_API_KEY) {
    throw new Error(lang === 'ko' ? 'API 키 미설정' : 'API_KEY_MISSING');
  }

  const targetLang = lang === 'ko' ? '韓国語(Korean)' : '日本語(Japanese)';

  const prompt = `
あなたは臨床栄養解析および食品表示OCRの専門AIです。
画像が料理・飲料・食品表示ラベルでない場合(家具、文具、風景等)は "isFood": false, "items": [] にしてください。

【食品である場合の規則】
- isFood: true
- 写真に複数の品目が写っている場合、すべての小鉢を過度に細分化せず、【1〜2品目(最大3品目)】にまとめて items 配列に出力してください。
- 料理名およびnotesは必ず「${targetLang}」で記述してください。
- 出力は必ず二重引用符(")を用いた厳格なJSONのみを出力してください。

【JSON形式の例】
{
  "isFood": true,
  "items": [
    {
      "name": "料理名",
      "isNutritionLabel": false,
      "notes": "含まれる内訳",
      "nutrients": {
        "calories": 250, "carbohydrates": 35.0, "sugars": 4.5,
        "sodium": 500, "fiber": 3.0, "totalFat": 10.0,
        "saturatedFat": 2.5, "transFat": 0.0, "cholesterol": 40
      }
    }
  ]
}
`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Image } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      maxOutputTokens: 1500,
    },
  };

  return executeFastFailover(requestBody, lang);
};

export const estimateNutrientsFromText = async (
  foodName: string,
  lang: 'ja' | 'ko' = 'ja'
): Promise<VisionAnalysisResult> => {
  if (!GEMINI_API_KEY) {
    throw new Error(lang === 'ko' ? 'API 키 미설정' : 'API_KEY_MISSING');
  }

  const targetLang = lang === 'ko' ? '韓国語(Korean)' : '日本語(Japanese)';

  const prompt = `
あなたは臨床栄養解析の専門AIです。食品名「${foodName}」の1人前分量に基づき9大栄養素を推計してください。
料理・食品でない場合は "isFood": false, "items": [] にしてください。
実在食品なら "isFood": true とし、items配列に格納してください。

【JSON形式の例】
{
  "isFood": true,
  "items": [
    {
      "name": "${foodName}",
      "isNutritionLabel": false,
      "notes": "1人前推計基準",
      "nutrients": {
        "calories": 300, "carbohydrates": 40.0, "sugars": 5.0,
        "sodium": 600, "fiber": 4.0, "totalFat": 12.0,
        "saturatedFat": 3.0, "transFat": 0.0, "cholesterol": 50
      }
    }
  ]
}
`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxOutputTokens: 800,
    },
  };

  return executeFastFailover(requestBody, lang);
};

const executeFastFailover = async (requestBody: any, lang: 'ja' | 'ko'): Promise<VisionAnalysisResult> => {
  const errorLogs: string[] = [];

  for (const model of FAST_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (response.status === 429) {
          throw new Error(
            lang === 'ko'
              ? '무료 API의 1분당 호출 한도에 도달했습니다. 약 30초 후 다시 시도해 주세요.'
              : '無料枠の1分間あたりのリクエスト上限に達しました。約30秒後に再試行してください。'
          );
        }

        if (response.status === 503) {
          if (attempt === 1) {
            await delay(600);
            continue;
          }
          errorLogs.push(`[${model}] 503`);
          break;
        }

        if (!response.ok) {
          errorLogs.push(`[${model}] ${response.status}`);
          break;
        }

        const json = await response.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const parsed = safeParseJson(rawText);
        const isFood = parsed.isFood !== false;
        const rawItems = Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed) ? parsed : []);

        const nutrientKeys: NutrientKey[] = [
          'calories', 'carbohydrates', 'sugars', 'sodium', 'fiber', 'totalFat',
          'saturatedFat', 'transFat', 'cholesterol',
        ];

        const processedItems: DetectedMealItem[] = rawItems.map((raw: any) => {
          const defaultStatus: VerificationStatus = raw.isNutritionLabel ? 'VERIFIED' : 'ESTIMATED';
          const formattedNutrients: Record<NutrientKey, { value: number | null; unit: 'kcal' | 'g' | 'mg'; status: VerificationStatus }> = {} as any;

          for (const k of nutrientKeys) {
            const val = raw.nutrients?.[k];
            const unit = getNutrientUnit(k);

            if (isFood && val !== null && val !== undefined && !isNaN(Number(val))) {
              formattedNutrients[k] = { value: Number(val), unit, status: defaultStatus };
            } else {
              formattedNutrients[k] = { value: null, unit, status: 'UNVERIFIED' };
            }
          }

          return {
            name: raw.name || (lang === 'ko' ? '음식' : '料理'),
            isNutritionLabel: !!raw.isNutritionLabel,
            notes: raw.notes || '',
            nutrients: formattedNutrients,
          };
        });

        return {
          isFood,
          usedModel: model,
          items: processedItems,
        };
      } catch (err: any) {
        if (err.message && err.message.includes('429')) throw err;
        errorLogs.push(`[${model}] ${err.message || String(err)}`);
        break;
      }
    }
  }

  throw new Error(lang === 'ko' ? `AI 응답 불가: ${errorLogs.join(', ')}` : `AI応答エラー: ${errorLogs.join(', ')}`);
};