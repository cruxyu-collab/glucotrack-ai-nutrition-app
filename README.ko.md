# 🍏 GlucoTrack - AI 기반 2형 당뇨 식단 관리 모바일 앱 (iOS)

[ [日本語](README.md) | 한국어 ]

> **2형 당뇨병 환자의 효율적인 자가 관리를 위한 9대 영양소 추적 iOS 애플리케이션 (iPhone 16e 실기기 검증 완료)**

[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_57-000000?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Local_Storage-003B57?style=for-the-badge&logo=sqlite)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-Vision_API-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)

---

## 📖 프로젝트 개요

**GlucoTrack**은 2형 당뇨병 환자의 일상적인 식단 기록 피로도를 혁신적으로 낮추고 혈당 관리를 돕기 위해 개발된 모바일 애플리케이션입니다.

기존 당뇨 관리 앱들의 한계인 '수동 입력의 번거로움', '영양성분표 수기 입력 오차', '민감한 건강 정보의 클라우드 유출 우려'를 해결하기 위해, **기기 내부 완전 폐쇄형 SQLite 데이터베이스**와 **초경량 클라이언트 AI 파이프라인**을 결합했습니다.

Mac이 없는 Windows PC 개발 환경에서 최신 기종인 iPhone 16e 실기기를 기반으로 100% 무료 개발 환경을 구축하고, 1~2초대 실시간 AI 분석 응답성을 완성했습니다.

---

## 🌟 주요 기능 및 UX 특징

1. **Dual AI 추론 파이프라인**:
   - **사진 모드**: 800px 경량화 전처리를 통해 영양성분표(OCR) 또는 음식 사진으로부터 1~2초 만에 9대 영양소를 자동 추출.
   - **텍스트 모드**: 음식명 입력만으로 이미지 전송 없이 1초 미만으로 1인분 기준 영양소를 즉시 추정.
2. **당뇨 관리 맞춤형 9대 영양소 3x3 그리드**:
   - 임상 중요도 순서(1.열량 → 2.탄수화물 → 3.당류 → **4.나트륨** → 5.식이섬유 → 6.총지방 → 7.포화지방 → 8.트랜스지방 → 9.콜레스테롤)로 전 화면 통일 표시.
3. **데이터 무결성 보장 및 임상 가드레일 (Guardrails)**:
   - **비식품 감지 차단**: 문구, 가구 등 비식품 사진 인식 시 저장을 원천 차단.
   - **논리적 모순 방어**: 당류 > 탄수화물 등 생화학적 모순 자동 탐지 및 경고.
   - **혈당 스파이크 알림**: 1회 식사 당류 30g 이상 또는 탄수화물 70g 이상 시 경고 배너 발화.
   - **데이터 날조 방지**: 모르는 수치를 0으로 임의 조작하지 않고 `null` 및 `UNVERIFIED`로 엄격 관리.
4. **도트 캘린더 & 날짜 네비게이션**:
   - 좁은 달력 셀에 복잡한 숫자를 배제하고 '기록 완료(녹색)', '고당류 경고(주황색)' 미니멀 도트로 시각화.
   - 특정 날짜 터치 시 하단 요약 카드를 통해 해당 일자의 기록으로 즉시 이동.
5. **완전 로컬 저장 (프라이버시 절대 보호)**:
   - 식단 데이터와 사진을 외부 서버로 전송하지 않고 기기 내부 SQLite에만 폐쇄형 영구 저장.

---

## 🛠 기술 스택

- **프레임워크**: React Native (Expo SDK 58)
- **개발 언어**: TypeScript 5.0+
- **로컬 데이터베이스**: `expo-sqlite` (완전 폐쇄형 관계형 DB)
- **AI 엔진**: Google Gemini API (`gemini-3.8-flash` -> `gemini-flash-latest` 무지연 우회)
- **이미지 파이프라인**: `expo-image-manipulator` (800px 다운스케일링)
- **다국어 지원**: `i18next`, `react-i18next`, `@react-native-async-storage/async-storage`
- **테스트 기기**: iPhone 16e (iOS 18)

---

## 📚 상세 기술 문서

- 📐 **[아키텍처 설계 결정서 (docs/ko/DECISIONS.ko.md)](docs/ko/DECISIONS.ko.md)**
- 📊 **[프로젝트 진척 보고서 (docs/ko/PROJECT_STATUS.ko.md)](docs/ko/PROJECT_STATUS.ko.md)**
- 🤝 **[최종 인수인계서 (docs/ko/HANDOFF.ko.md)](docs/ko/HANDOFF.ko.md)**