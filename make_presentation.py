# -*- coding: utf-8 -*-
"""
GlucoTrack 技術ポートフォリオ プレゼンテーション自動生成スクリプト (v2.2)
実務経験 約20年、5層防御的プログラミング、スクリーンショット自動埋め込み対応
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    COLOR_BG_DARK = RGBColor(15, 23, 42)
    COLOR_PRIMARY = RGBColor(2, 132, 199)
    COLOR_ACCENT = RGBColor(16, 185, 129)
    COLOR_TEXT_MAIN = RGBColor(30, 41, 59)
    COLOR_TEXT_MUTED = RGBColor(100, 116, 139)
    COLOR_CARD_BG = RGBColor(248, 250, 252)
    COLOR_CARD_BORDER = RGBColor(226, 232, 240)
    COLOR_WHITE = RGBColor(255, 255, 255)

    def add_header(slide, title_text, category_text="GlucoTrack Architecture Portfolio"):
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.35))
        tf_cat = cat_box.text_frame
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = COLOR_PRIMARY

        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.7), Inches(0.6))
        tf_title = title_box.text_frame
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_TEXT_MAIN

        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.45), Inches(11.7), Inches(0.02))
        line.fill.solid()
        line.fill.fore_color.rgb = COLOR_CARD_BORDER
        line.line.color.rgb = COLOR_CARD_BORDER

    def add_card(slide, left, top, width, height, title="", bg_color=COLOR_CARD_BG, border_color=COLOR_CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1)

        if title:
            title_box = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.15), width - Inches(0.4), Inches(0.35))
            tf = title_box.text_frame
            p = tf.paragraphs[0]
            p.text = title
            p.font.size = Pt(13)
            p.font.bold = True
            p.font.color.rgb = COLOR_PRIMARY
        return card

    def try_add_image(slide, img_path, left, top, width, height, placeholder_title):
        if os.path.exists(img_path):
            slide.shapes.add_picture(img_path, left, top, width, height)
        else:
            add_card(slide, left, top, width, height, placeholder_title, bg_color=RGBColor(241, 245, 249))
            tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(1.0), width - Inches(0.4), Inches(1.5))
            tf = tb.text_frame
            p = tf.paragraphs[0]
            p.text = f"[ 実機画面キャプチャ配置枠 ]\n{os.path.basename(img_path)} を\nscreenshots/ フォルダに保存すると\n自動で差し替えられます。"
            p.font.size = Pt(11)
            p.font.color.rgb = COLOR_TEXT_MUTED

    # ==========================================
    # SLIDE 1: 表紙 ＆ シニアエンジニアプロファイル
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = COLOR_BG_DARK
    bg1.line.fill.background()

    t_box1 = s1.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.7), Inches(2.2))
    tf1 = t_box1.text_frame
    p1 = tf1.paragraphs[0]
    p1.text = "GlucoTrack: AI-Driven Healthcare Architecture"
    p1.font.size = Pt(36)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_WHITE

    p2 = tf1.add_paragraph()
    p2.text = "2型糖尿病・生活習慣病患者向け 9大栄養素追跡 iOS アプリケーション (iPhone 16e 実機検証済)"
    p2.font.size = Pt(16)
    p2.font.color.rgb = COLOR_PRIMARY
    p2.space_before = Pt(6)

    prof_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.8), Inches(11.7), Inches(4.0))
    prof_card.fill.solid()
    prof_card.fill.fore_color.rgb = RGBColor(30, 41, 59)
    prof_card.line.color.rgb = COLOR_PRIMARY
    prof_card.line.width = Pt(1.5)

    prof_box = s1.shapes.add_textbox(Inches(1.1), Inches(3.0), Inches(11.1), Inches(3.6))
    ptf = prof_box.text_frame

    pp1 = ptf.paragraphs[0]
    pp1.text = "■ 開発者基本情報 & シニアエンジニアプロファイル"
    pp1.font.size = Pt(14)
    pp1.font.bold = True
    pp1.font.color.rgb = COLOR_ACCENT

    profile_items = [
        "• 氏名 (Candidate): [ 氏名をご記入ください / 例: YU ]",
        "• 連絡先 (Contact): [ メールアドレス / 電話番号 ]",
        "• 開発実務経験: ソフトウェアエンジニア実務経験 約20年 (エンタープライズJava / クラウド・モバイルアーキテクチャ)",
        "• 公的認証・国家資格: 情報処理技師 (韓国国家資格 / 日本 応用情報技術者 相互認証対象)",
        "• AI & クラウド専門資格: AWS Certified AI Practitioner (AIF-C01) / AIプロンプト活用能力試験 2級 (AI-POT)",
        "• ベンダー認定技術資格: Oracle Certified Professional (OCP) / Sun Certified Java Programmer (SCJP)",
        "• GitHub Repository: https://github.com/[アカウント名]/02_glucotrack-ai-nutrition-app"
    ]
    for item in profile_items:
        p = ptf.add_paragraph()
        p.text = item
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_WHITE
        p.space_before = Pt(4)

    # ==========================================
    # SLIDE 2: 開発背景と解決した課題
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "背景と課題: 糖尿病食事療法の認知的負荷を極小化")

    add_card(s2, Inches(0.8), Inches(1.7), Inches(7.5), Inches(5.3), "【課題とアプローチ】入力負荷ゼロとローカルファースト")
    b2_text = s2.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(7.1), Inches(4.5))
    tf2 = b2_text.text_frame
    tf2.word_wrap = True

    p = tf2.paragraphs[0]
    p.text = "• 継続困難に伴う治療離脱の課題:"
    p.font.size = Pt(13)
    p.font.bold = True
    p = tf2.add_paragraph()
    p.text = "  - 糖尿病治療において食事記録は重要である一方、毎食の計量や栄養計算に伴う認知的負荷が高く、継続的記録の脱落要因となっている。\n  - 既存アプリの手動検索やグラム入力が記録断念を招く最大の障壁。"
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MUTED

    p = tf2.add_paragraph()
    p.text = "• AI自動構造化による解決アプローチ:"
    p.font.size = Pt(13)
    p.font.bold = True
    p.space_before = Pt(10)
    p = tf2.add_paragraph()
    p.text = "  - 食品表示ラベル(OCR)や料理写真を撮るだけで、9大栄養素を瞬時に解析・構造化。\n  - 写真撮影が難しい環境でも、料理名テキスト入力から約1秒で栄養素を自動推計展開。"
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MUTED

    p = tf2.add_paragraph()
    p.text = "• ローカルファースト SQLite 永続化:"
    p.font.size = Pt(13)
    p.font.bold = True
    p.space_before = Pt(10)
    p = tf2.add_paragraph()
    p.text = "  - 日々の食事データは外部クラウドDBへ保存せず、端末内SQLiteで安全に完結。\n  - インフラ運用コスト $0 とデータガバナンスを完全に両立。"
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MUTED

    try_add_image(s2, "screenshots/screenshot_main.png", Inches(8.6), Inches(1.7), Inches(3.9), Inches(5.3), "メイン画面 (3x3グリッド)")

    # ==========================================
    # SLIDE 3: システムアーキテクチャ
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "システムアーキテクチャ: Local-First × On-Demand AI")

    layers = [
        ("1. クライアント層 (Client)", "• UI / UX Layer\n  - React Native (Expo SDK 58)\n  - TypeScript 型安全設計\n  - 3x3 栄養素マトリックス表示\n  - ドットカレンダー状態可視化\n\n• Internationalization\n  - i18next (日韓リソース完全分離)\n  - 実行時即時言語トグル", Inches(0.8)),
        ("2. 安全検証・データ層 (Local)", "• Validation Layer\n  - nutritionValidator.ts\n  - 非食品ガードレール (isFood)\n  - 生化学的矛盾検知 (糖質>炭水化物)\n  - 血糖スパイク注意アラート\n\n• Local Database\n  - expo-sqlite (SQLite 3)\n  - iOS Data Protection 準拠\n  - 3段階データ完全性(null保護)\n  - CSVエクスポートエンジン", Inches(4.8)),
        ("3. AI推論層 (On-Demand)", "• Image Preprocessing\n  - expo-image-manipulator\n  - 端末側 800px リサイズ処理\n  - ペイロード95%削減\n\n• Multimodal AI API\n  - Google Gemini API\n  - 主系: gemini-3.8-flash\n  - 縮退: gemini-flash-latest\n  - リトライ待機なし即時切替\n  - responseMimeType: 'application/json'", Inches(8.9))
    ]

    for title, text, left in layers:
        add_card(s3, left, Inches(1.7), Inches(3.6), Inches(5.3), title)
        tb = s3.shapes.add_textbox(left + Inches(0.2), Inches(2.3), Inches(3.2), Inches(4.5))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = text
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_TEXT_MAIN

    # ==========================================
    # SLIDE 4: AI最適化1: 画像前処理とレスポンス
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "AIエンジニアリング: クライアント側画像最適化による低遅延化")

    add_card(s4, Inches(0.8), Inches(1.7), Inches(7.5), Inches(5.3), "【ボトルネックの特定と前処理パイプライン】")
    b4 = s4.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(7.1), Inches(4.5))
    tf4 = b4.text_frame
    tf4.word_wrap = True

    p = tf4.paragraphs[0]
    p.text = "• 高画素カメラ撮影画像の転送ボトルネック:"
    p.font.size = Pt(13)
    p.font.bold = True
    p = tf4.add_paragraph()
    p.text = "  - iPhone 16eの高画素撮影生画像(数MB)をそのままAPI転送すると、ネットワーク往復遅延により食事記録の快適性が著しく損なわれる。"
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MUTED

    p = tf4.add_paragraph()
    p.text = "• 端末側長辺800pxリサイズによる最適化:"
    p.font.size = Pt(13)
    p.font.bold = True
    p.space_before = Pt(10)
    p = tf4.add_paragraph()
    p.text = "  - expo-image-manipulator を活用し、送信直前に長辺800px(品質0.6)へ瞬時圧縮。\n  - ペイロード量を約80KBへ 95%削減 し、通信オーバーヘッドを極小化。"
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MUTED

    p = tf4.add_paragraph()
    p.text = "• 実測平均 2〜4秒 の快適な推論レスポンス:"
    p.font.size = Pt(13)
    p.font.bold = True
    p.space_before = Pt(10)
    p = tf4.add_paragraph()
    p.text = "  - 食品表示ラベルの微細な文字認識(OCR)精度を保持。\n  - 実機検証において、撮影から9大栄養素の展開完了まで実測平均2〜4秒を達成。"
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MUTED

    try_add_image(s4, "screenshots/screenshot_ai.png", Inches(8.6), Inches(1.7), Inches(3.9), Inches(5.3), "AI解析画面 (OCR展開)")

    # ==========================================
    # SLIDE 5: AI最適化2: デュアルエンジン・フェイルオーバー
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "AIエンジニアリング: API一時過負荷を回避する即時フェイルオーバー")

    add_card(s5, Inches(0.8), Inches(1.7), Inches(5.6), Inches(5.3), "【課題】無料枠クォータ制限とモデル過負荷")
    b5_l = s5.shapes.add_textbox(Inches(1.0), Inches(2.3), Inches(5.2), Inches(4.5))
    tf5_l = b5_l.text_frame
    tf5_l.word_wrap = True
    p = tf5_l.paragraphs[0]
    p.text = "• HTTP 503 (High Demand) リスク:\n  - クラウドAI無料枠では、特定モデルへのアクセス集中時に一時的な過負荷(503)が発生する。\n\n• レートリミット (429) の連鎖防止:\n  - 503発生時に無駄な同一モデル再試行を繰り返すと、プロジェクト全体のクォータ(1分15回)を急速に消費してしまう課題。"
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MAIN

    add_card(s5, Inches(6.8), Inches(1.7), Inches(5.7), Inches(5.3), "【設計】リトライ待機なし即時フェイルオーバー")
    b5_r = s5.shapes.add_textbox(Inches(7.0), Inches(2.3), Inches(5.3), Inches(4.5))
    tf5_r = b5_r.text_frame
    tf5_r.word_wrap = True
    p = tf5_r.paragraphs[0]
    p.text = "• 高信頼モデル3種への厳選:\n  - gemini-3.8-flash -> gemini-flash-lite-latest -> gemini-flash-latest\n\n• リトライ待機なしの即時切替:\n  - 503検知時は待機時間を挟まず直ちに下位モデルへ即時切替実行。\n\n• プロンプトガバナンス:\n  - responseMimeType: 'application/json' によりMarkdownコードブロックや不要な出力を構造的に抑止。"
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MAIN

    # ==========================================
    # SLIDE 6: シニアの品質保証: 5層の防御的プログラミング
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "品質保証: 5層の防御的プログラミングと例外処理マトリックス")

    cards_data = [
        ("1. UI/入力境界 (Concurrency Lock)", "保存ボタンのダブルタップ連打による重複登録を防止するisSaving排他制御。\n非同期通信中(isAnalyzing)のボタン無効化とUIフリーズ防止設計。", Inches(0.8), Inches(1.7)),
        ("2. ネットワーク/通信境界 (Resilience)", "12秒のAbortControllerタイムアウトによる無応答防止。\nオフライン(DNS断)検知、および503過負荷検知時の即時フェイルオーバー。", Inches(6.8), Inches(1.7)),
        ("3. AI推論/構文境界 (Safe Parser)", "LLMのマークダウンや未クォートキーを自動補正するsafeParseJson。\nGoogle Safety Filter(有害性)遮断ハンドリングと非食品(isFood)強制遮断。", Inches(0.8), Inches(4.4)),
        ("4. データ整合性/ドメイン境界 (Integrity)", "「糖質>炭水化物」の生化学的矛盾検知、負数(マイナス値)の完全排除。\n全項目null保存の遮断、およびSQLiteトランザクション自動ロールバック保証。", Inches(6.8), Inches(4.4))
    ]

    for title, text, left, top in cards_data:
        add_card(s6, left, top, Inches(5.6 if left < Inches(5) else 5.7), Inches(2.5), title)
        tb = s6.shapes.add_textbox(left + Inches(0.2), top + Inches(0.6), Inches(5.2), Inches(1.7))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = text
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_TEXT_MAIN

    # ==========================================
    # SLIDE 7: ミニマルUI/UX設計
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "UI/UXデザイン: 患者の認知的負荷を極小化する情報設計")

    add_card(s7, Inches(0.8), Inches(1.7), Inches(7.5), Inches(5.3), "【3x3マトリックス ＆ ドットカレンダー】")
    b7 = s7.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(7.1), Inches(4.5))
    tf7 = b7.text_frame
    tf7.word_wrap = True

    p = tf7.paragraphs[0]
    p.text = "• 臨床優先度順の 3x3 栄養素マトリックス:"
    p.font.size = Pt(13)
    p.font.bold = True
    p = tf7.add_paragraph()
    p.text = "  - 1.熱量, 2.炭水化物, 3.糖質, 4.ナトリウム, 5.食物繊維, 6.総脂質, 7.飽和脂肪, 8.トランス脂肪, 9.コレステロール\n  - 公式値(緑ドット)とAI推計値(黄ドット)の内訳を明示。"
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MUTED

    p = tf7.add_paragraph()
    p.text = "• 認知的負荷を排除したドットカレンダー:"
    p.font.size = Pt(13)
    p.font.bold = True
    p.space_before = Pt(10)
    p = tf7.add_paragraph()
    p.text = "  - 日付セル内の数字詰め込みを廃止し、緑(記録完了)・黄(高糖質警告)のミニマルドットで月間推移を可視化。\n  - 日曜(赤)・土曜(青)の色分けと今日識別リングを導入。"
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MUTED

    p = tf7.add_paragraph()
    p.text = "• 混線ゼロの2系統タブ入力UX:"
    p.font.size = Pt(13)
    p.font.bold = True
    p.space_before = Pt(10)
    p = tf7.add_paragraph()
    p.text = "  - 写真解析とテキスト推計をタブで完全分離し、非同期通信の衝突を排除。"
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MUTED

    try_add_image(s7, "screenshots/screenshot_calendar.png", Inches(8.6), Inches(1.7), Inches(3.9), Inches(5.3), "ドットカレンダー画面")

    # ==========================================
    # SLIDE 8: データガバナンスと医療機関連携
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "データガバナンス: ローカルファースト保管とCSV診察連携")

    add_card(s8, Inches(0.8), Inches(1.7), Inches(7.5), Inches(5.3), "【プライバシー保護とデータポータビリティ】")
    b8 = s8.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(7.1), Inches(4.5))
    tf8 = b8.text_frame
    tf8.word_wrap = True

    p = tf8.paragraphs[0]
    p.text = "• オンデバイス完結のローカルファースト保管:"
    p.font.size = Pt(13)
    p.font.bold = True
    p = tf8.add_paragraph()
    p.text = "  - 食事写真、日時、メモ、栄養素データはすべて端末内SQLiteにiOS Data Protection準拠で保存。\n  - 外部クラウドDBを持たないため、機微な医療データの漏洩リスクを構造的に排除。"
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MUTED

    p = tf8.add_paragraph()
    p.text = "• 診察提出用 CSVエクスポート機能 (主治医連携):"
    p.font.size = Pt(13)
    p.font.bold = True
    p.space_before = Pt(10)
    p = tf8.add_paragraph()
    p.text = "  - スタンドアロン型アプリの課題である「医師との情報共有」をワンタップ標準CSV出力で解決。\n  - 病院PCのExcel環境を考慮し、文字化けを防止するUTF-8 BOM付きCSVを生成。\n  - iOS共有メニュー経由でAirDropやメール等へ即時提出可能。"
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MUTED

    try_add_image(s8, "screenshots/screenshot_settings.png", Inches(8.6), Inches(1.7), Inches(3.9), Inches(5.3), "設定・エクスポート画面")

    # ==========================================
    # SLIDE 9: ドメイン拡張性 (高血圧・生活習慣病)
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "ドメイン拡張性: 高血圧症・生活習慣病モニタリングへの応用基盤")

    add_card(s9, Inches(0.8), Inches(1.7), Inches(5.6), Inches(5.3), "高血圧症 (Hypertension) モニタリング")
    b9_l = s9.shapes.add_textbox(Inches(1.0), Inches(2.3), Inches(5.2), Inches(4.5))
    tf9_l = b9_l.text_frame
    tf9_l.word_wrap = True
    p = tf9_l.paragraphs[0]
    p.text = "• 併発疾患を見据えた栄養素モデル:\n  - 糖尿病患者の多くが併発する高血圧症を考慮し、食塩摂取指標である「ナトリウム」を上位4位に優先配置。\n\n• 減塩モニタリングへの即時転用:\n  - 食塩摂取目標値の閾値アラートや生活習慣病管理アプリへ追加開発なしで即座に展開可能なスキーマ設計。"
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MAIN

    add_card(s9, Inches(6.8), Inches(1.7), Inches(5.7), Inches(5.3), "精密糖質・生活習慣改善モニタリング")
    b9_r = s9.shapes.add_textbox(Inches(7.0), Inches(2.3), Inches(5.3), Inches(4.5))
    tf9_r = b9_r.text_frame
    tf9_r.word_wrap = True
    p = tf9_r.paragraphs[0]
    p.text = "• 炭水化物・糖質・食物繊維の精密管理:\n  - 日常的な血糖モニタリングの基礎データとして転用可能な精度フラグ付き内訳モデル。\n\n• 汎用生活習慣病プラットフォーム化:\n  - 肥満症、脂質異常症、腎症予防など、他の生活習慣病モニタリング機能を追加可能な高い拡張性を保持。"
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MAIN

    # ==========================================
    # SLIDE 10: 結論 ＆ シニアエンジニアの提供価値
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    bg10 = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg10.fill.solid()
    bg10.fill.fore_color.rgb = COLOR_BG_DARK
    bg10.line.fill.background()

    t_box10 = s10.shapes.add_textbox(Inches(0.8), Inches(0.6), Inches(11.7), Inches(1.0))
    tf10 = t_box10.text_frame
    p = tf10.paragraphs[0]
    p.text = "Conclusion: シニアエンジニアとしての技術的提供価値"
    p.font.size = Pt(26)
    p.font.bold = True
    p.font.color.rgb = COLOR_WHITE

    v_cards = [
        ("1. 実務経験 約20年の知見 × 最新AIの統制力", "単なるAPI呼び出しにとどまらず、画像前処理、即時フェイルオーバー、多層バリデーション防壁までを自律設計。AIの挙動を完全に制御・統制するアーキテクト視点。"),
        ("2. ビジネス直結のゼロコスト・高品質設計", "インフラ維持費 $0、有償ライセンス依存 $0 を達成しながら、商用レベルの堅牢性、プライバシー保護、実測2〜4秒の高速レスポンスを完全両立。"),
        ("3. 日本のIT開発現場への即戦力性", "情報処理技師(応用情報相互認証)およびAWS AI資格に裏打ちされた確かな設計力。厳格なADRドキュメント化と型安全性を徹底し、日本の高品質なプロジェクトへ即時貢献。")
    ]

    for idx, (title, desc) in enumerate(v_cards):
        top_pos = Inches(1.8 + idx * 1.5)
        c = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top_pos, Inches(11.7), Inches(1.3))
        c.fill.solid()
        c.fill.fore_color.rgb = RGBColor(30, 41, 59)
        c.line.color.rgb = COLOR_PRIMARY

        tb = s10.shapes.add_textbox(Inches(1.0), top_pos + Inches(0.12), Inches(11.3), Inches(1.05))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT

        p_desc = tf.add_paragraph()
        p_desc.text = desc
        p_desc.font.size = Pt(11)
        p_desc.font.color.rgb = COLOR_WHITE
        p_desc.space_before = Pt(4)

    f_box = s10.shapes.add_textbox(Inches(0.8), Inches(6.5), Inches(11.7), Inches(0.6))
    ftf = f_box.text_frame
    fp = ftf.paragraphs[0]
    fp.text = "GlucoTrack Architecture Portfolio  |  Candidate: [氏名]  |  GitHub: https://github.com/[アカウント名]/02_glucotrack-ai-nutrition-app"
    fp.font.size = Pt(11)
    fp.font.color.rgb = COLOR_TEXT_MUTED

    output_filename = "GlucoTrack_Portfolio_Presentation.pptx"
    prs.save(output_filename)
    print(f"Presentation successfully created: {output_filename}")

if __name__ == "__main__":
    create_deck()