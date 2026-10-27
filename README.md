# 🍏 GlucoTrack: Local-First Diabetes Nutrition Management Architecture

[ 日本語 | [한국어](README.ko.md) ]

> **食事療法の認知的負荷を極小化する、2型糖尿病・生活習慣病患者向け 9大栄養素追跡 iOS アプリケーション**  
> **ローカルファースト SQLite 永続化 × オンデマンド マルチモーダル AI (iPhone 16e 実機検証済)**

---

## 📌 概要 (Overview)

**GlucoTrack** は、糖尿病食事療法における最大の障壁である**「毎食の重量測定・栄養計算に伴う入力離脱」**を解消するために設計されたiOSモバイルアプリケーションです。

食品表示ラベルのOCR解析、料理写真からのポーション推計、および料理名テキストからの高速推計を統合し、臨床上不可欠な**9大栄養素**を自動構造化します。

機微な健康データを保護するため、日々の食事履歴やパーソナルデータは外部DBサーバーに保管せず、**「端末内ローカルファーストSQLite (iOS標準 Data Protection準拠)」**で管理。画像解析時のみオンデマンドでエフェメラル（推論完了後に即時破棄）にAPIを呼び出すハイブリッド・プライバシー設計を採用しています。

```
[ エンジニアリング特性 ]
• アーキテクチャ: ローカルファースト SQLite (iOS標準 Data Protection に準拠)
• AIプロンプトガバナンス: JSON Schema強制(application/json)および多層バリデーション
• 応答パフォーマンス: クライアント側画像前処理(800px)により実測平均 2〜4秒 を確立
• 医療データ連携: 診察時の主治医提出を想定した標準 CSV エクスポート機能を完備
• 障害耐性: API一時過負荷(503)を回避するリトライ待機なし即時フェイルオーバー設計
```

---

## 💡 解決する課題とアプローチ (Problem & Approach)

### 【課題】入力負荷に伴う食事療法の継続困難
糖尿病の血糖コントロールにおいて継続的な食事記録は重要ですが、手動検索やグラム単位の計量は患者に過度な負担を与え、継続治療の脱落を招く要因となっています。

### 【アプローチ】認知的負荷を極小化する入力支援
GlucoTrackは、**「撮影」または「料理名入力」のワンアクション**で記録を完了させるアプローチをとります。
- **食品表示ラベル(OCR)**: パッケージ裏の成分表から数値をダイレクト抽出。
- **料理写真推計**: 料理画像からAIが標準1人前ポーションを推定し、9大栄養素を自動展開。
- **料理名推計**: 写真撮影が困難な環境でも、テキスト入力から画像転送なしに約1〜2秒で栄養素を展開。

---

## 🛠 技術的工夫とアーキテクチャ設計 (Engineering Highlights)

### 1. クライアント側画像最適化によるネットワーク遅延の低減
iPhone 16eの高画素カメラ生画像（数MB）をそのままAPI送信することによる遅延を防ぐため、`expo-image-manipulator` を用いて端末側で長辺800px（品質0.6）へ圧縮するパイプラインを実装。ペイロードを約80KBへ低減し、文字認識精度を保持したまま**実測平均2〜4秒の推論往復時間**を達成しました。

### 2. APIクォータ保護とリトライ待機なし即時フェイルオーバー
Google AI APIの無料利用枠における一時的過負荷（HTTP 503）に対し、主モデル `gemini-3.8-flash` から待機時間を挟まず直ちに公式安定版エイリアス `gemini-flash-latest` へフェイルオーバーする単方向スイッチ機構を実装。不要な再試行によるレート制限（429）の誘発を防止しています。

### 3. 多層データ整合性バリデーション層 (Validation Layer)
LLMの出力値に対する安全防壁として `nutritionValidator.ts` を分離実装。
- **構造化出力の強制**: `responseMimeType: "application/json"` および低温度設定 (temperature: 0.1) によりフォーマット崩れを防止。
- **非食品検知ガードレール**: 文具・家具等の非食品画像判定時 (`isFood: false`)、保存をシステムレベルで遮断。
- **生化学的矛盾検知**: 「糖質 > 炭水化物」などの論理破綻を検知してユーザーに是正を促す警告を発火。
- **血糖スパイク注意アラート**: 1食あたり糖質30g以上または炭水化物70g以上での自動注意喚起。
- **データ完全性の保証**: 情報のない項目を「0」と推測・捏造せず、`null` および `UNVERIFIED` として厳格に管理。

---

## 🔒 プライバシーとデータガバナンス

- **ローカルファースト原則**: 食事記録、日時、メモ、栄養数値はすべて端末内の SQLite データベースに永続化され、外部クラウドDBへの自動同期は行いません。
- **API通信の限定性**: 画像・テキスト解析時のみGoogle Gemini APIエンドポイントへHTTPS通信を行い、解析結果のJSON受信後は端末ローカルで処理を完結させます。
- **データポータビリティ**: 診察時に医療従事者へ提示できるよう、ワンタップで端末内データをCSVファイルとして書き出す機能を備えています。

---

## 🚀 ドメイン拡張性 (Scalability)

GlucoTrackのデータモデルおよびUI設計は、以下の生活習慣病モニタリングへ即時応用可能です。

1. **高血圧症 (Hypertension) モニタリング**:
   - 糖尿病の主要な併発疾患である高血圧症を考慮し、食塩摂取指標である「ナトリウム」を4位に優先配置。
2. **糖質制限・生活習慣改善モニタリング**:
   - 炭水化物・糖質・食物繊維を独立した精度フラグで管理し、日々の血糖モニタリングの基礎データを提供。

---

## 💻 技術スタック (Tech Stack)

```
[ Mobile Frontend & Local Database ]
• React Native (Expo SDK 57) / TypeScript 5.0+
• expo-sqlite (SQLite 3 Local Database)
• expo-image-manipulator (Image Preprocessing)
• expo-sharing / expo-file-system (CSV Export)
• i18next / react-i18next (Internationalization)

[ AI Inference Engine ]
• Google Gemini Vision API (RESTful Multimodal Engine)
• Failover Architecture: gemini-3.8-flash -> gemini-flash-latest

[ Hardware Verification ]
• Apple iPhone 16e (iOS 18)
```

---

## 📚 技術詳細ドキュメント

- 📐 **[アーキテクチャ設計決定記録 (docs/ja/DECISIONS.md)](docs/ja/DECISIONS.md)**
- 📊 **[プロジェクト進捗実績報告書 (docs/ja/PROJECT_STATUS.md)](docs/ja/PROJECT_STATUS.md)**
- 🤝 **[成果物引き継ぎ情報 (docs/ja/HANDOFF.md)](docs/ja/HANDOFF.md)**