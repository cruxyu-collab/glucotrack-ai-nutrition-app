# Architecture Decision Records (ADR)

---

## ADR-001: モバイルネイティブ指向フレームワーク (Expo SDK 57 / React Native)
- **選定技術**: React Native (Expo SDK 57, TypeScript)
- **決定理由**: トンネル通信を活用した迅速な実機動作検証環境の構築と、将来的なネイティブヘルスケア連携(HealthKit等)への拡張性を担保。

---

## ADR-002: ローカルファーストSQLiteとエフェメラル通信ハイブリッド設計
- **選定技術**: `expo-sqlite` (SQLite 3)
- **決定理由**:
  1. 日常のデータ蓄積・閲覧はすべて端末内SQLite(iOS Data Protection準拠)に物理完結させ、オフライン動作を保証。
  2. AI画像解析時のみオンデマンドでAPIとエフェメラル通信を行い、クラウドDB側にデータを永続保存しないゼロ・リテンション設計を採用。
  3. 9大栄養素（糖類含む）の欠損値を「0」と捏造せず `null` / `UNVERIFIED` として管理。

---

## ADR-003: クライアント側画像最適化による低遅延化
- **選定技術**: `expo-image-manipulator` (長辺800px, 品質0.6)
- **決定理由**: 端末側圧縮によりペイロードを約80KBへ低減し、実測平均2〜4秒の高速解析レスポンスを確立。

---

## ADR-004: 2段階・即時フェイルオーバー設計
- **選定技術**: `gemini-3.8-flash` (主系) ➔ `gemini-flash-latest` (縮退系)
- **決定理由**: 503過負荷検知時に待機時間を挟まず直ちに切り替え、APIクォータ消費を最小化しつつ可用性を担保。

---

## ADR-005: 5層の防御的例外プログラミング層
- **決定理由**:
  1. UI排他制御層 (isSaving)
  2. 通信レジリエンス層 (AbortController 12秒)
  3. 安全構文パーサー層 (safeParseJson)
  4. ドメイン整合性層 (糖類>炭水化物矛盾検知)
  5. トランザクション永続化層 (SQLite Transaction Rollback)
