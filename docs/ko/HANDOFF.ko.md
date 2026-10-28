# HANDOFF (프로젝트 최종 인수인계서)

## 1. 프로젝트 개요
- **저장소명**: `02_glucotrack-ai-nutrition-app`
- **목적**: 2형 당뇨 환자 맞춤형 9대 영양소 추적 iOS 모바일 앱
- **개발 환경**: Windows PC (Mac 미보유, Expo SDK 58 / React Native TypeScript)
- **동작 검증 기기**: iPhone 16e (실기기 검증 완료)

---

## 2. 실기기 실행 절차
- 프로젝트 폴더로 이동:
  cd C:\yu\취업준비프로젝트\02_glucotrack-ai-nutrition-app
- 개발 서버 실행:
  npx expo start
- iPhone 16e의 Expo Go 앱에서 프로젝트를 선택하여 즉시 실행.

---

## 3. 핵심 운영 가이드
1. **GitHub 제출 시**: 루트의 `README.md`가 메인 대문으로 노출되며, 상세 결정 사항은 `docs/DECISIONS.md` 링크를 통해 면접관이 직접 확인합니다.
2. **포트폴리오 시연 영상 촬영 시**: 설정(⚙️) 창에서 `[🧪 포트폴리오용 2개월 샘플 데이터 생성]`을 눌러 캘린더와 과거 기록을 풍부하게 채운 뒤 촬영합니다.
3. **AI 통신 정책**: 1순위 `gemini-3.8-flash` 실패 시 대기 시간 0초로 즉시 `gemini-flash-latest`로 우회하여 429 제한을 방어합니다.
4. **향후 유지보수 시**: 저(AI)는 본 `HANDOFF.ko.md`와 `DECISIONS.ko.md`의 내용을 절대적 진실로 삼아 개발 컨텍스트를 즉시 복원합니다.