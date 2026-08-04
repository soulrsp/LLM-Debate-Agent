# 🛡️ LLM Fact-Check Arena (다중 LLM 자유 정보 공유 & 환각 최소화 파이프라인)

Google Gemini, Anthropic Claude, OpenAI ChatGPT 3개의 서로 다른 대형 언어 모델(LLM)이 지정된 주제에 대하여 **[팩트 탐색 - 교차 감정 및 환각 교정 - 지식 합성]** 역할을 맡아 라운드별로 정보와 지식을 자유롭게 공유(`Context Accumulation`)하고, 상호 간의 수치 오류, 비약적 추정, 환각(Hallucination)을 검증하여 **최고 신뢰도의 최종 팩트체크 보고서**를 생성하는 자동화 시스템입니다.

---

## 🌟 주요 특징 및 기능

1. **다중 LLM 검증 팀 (Fact-Check Team)**
   - **Gemini 2.0 (Fact Finder)**: 1차 실증 팩트 데이터, 수치, 표준 정의 추출
   - **Claude 3.5 Sonnet (Cross Auditor)**: 1차 지식 중 환각(Hallucination), 비약, 오차 정밀 감정 및 교정
   - **ChatGPT (GPT-4o, Synthesizer)**: 상충 지점 조정 및 누락된 맥락 보완 지식 수렴
   - **Consensus Verifier**: [100% 확정 팩트], [식별/교정된 오정보], [신뢰도 점수 X/100] 포함 종합 보고서 생성

2. **최종 보고서 전용 다운로드 지원**
   - 최종 교차검증 보고서를 `.md` (Markdown) 및 `.txt` (Text) 형식으로 한 번의 클릭으로 다운로드

3. **데모 모드 & 실시간 API 연동 하이브리드 지원**
   - API 키가 없어도 데모 시뮬레이션 모드로 모든 기능을 즉시 테스트할 수 있습니다.
   - 🔑 API 키 설정 팝업에서 소유하신 키를 입력하면 실제 공식 API 연동 모드로 전환됩니다.
   - 키 발급 상세 안내는 [API_KEY_GUIDE.md](file:///c:/Users/ADMIN/Desktop/Coding/Antigravity/LLM-Debate-Project/API_KEY_GUIDE.md)를 참고하세요.

---

## 🚀 시작하기 (웹 앱 실행)

```bash
# 디렉터리 이동
cd LLM-Debate-Project

# 의존성 설치
npm install

# 서버 실행
npm start
```

브라우저에서 **[http://localhost:3000](http://localhost:3000)**으로 접속하세요.

---

## 📂 주요 파일 구조

```text
LLM-Debate-Project/
├── API_KEY_GUIDE.md        # LLM별 공식 API 키 발급 가이드 문서
├── server.js               # Express API 백엔드 프록시 (Gemini, Claude, OpenAI 지원)
├── public/                 # 모던 글래스모피즘 프론트엔드
│   ├── index.html          # 메인 HTML UI (입력창 4배 확대 & API 가이드 아코디언 포함)
│   ├── style.css           # 글래스모피즘 디자인 시스템 및 가상 모션 애니메이션
│   └── app.js             # 교차 검증 파이프라인 제어 및 파일 다운로드 로직
├── n8n_workflow.json       # n8n 노코드 도구용 워크플로우 블루프린트
└── README.md               # 프로젝트 안내 문서
```
