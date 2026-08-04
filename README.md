# 🛡️ LLM Fact-Check Arena (다중 LLM 자유 정보 공유 & 환각 최소화 파이프라인)

Google Gemini, Anthropic Claude, OpenAI ChatGPT, Groq, NVIDIA Nemotron, OpenRouter 등 6대 대형 언어 모델(LLM)이 지정된 주제에 대하여 **[팩트 탐색 - 교차 감정 및 환각 교정 - 지식 합성]** 역할을 맡아 라운드별로 정보와 지식을 자유롭게 공유(`Context Accumulation`)하고, 상호 간의 수치 오류, 비약적 추정, 환각(Hallucination)을 검증하여 **최고 신뢰도의 최종 팩트체크 보고서**를 생성하는 자동화 시스템입니다.

---

## 🌐 바로 사용하기 (웹 브라우저 접속)

별도의 서버 설치 없이 웹 브라우저에서 바로 사용하실 수 있습니다:

👉 **[LLM Fact-Check Arena 웹 서비스 바로가기 (soulrsp.github.io/LLM-Debate-Agent)](https://soulrsp.github.io/LLM-Debate-Agent/)**

> 💡 **사용 방법**: 
> 1. 위 URL 접속 후 오른쪽 상단 **`🔑 API 키 설정`** 버튼을 누릅니다.
> 2. 보유하신 LLM API 키(Gemini, Groq, OpenRouter 등)를 입력합니다. (키는 사용자의 브라우저 LocalStorage에만 안전하게 저장되며 외부 서버로 전송되지 않습니다.)
> 3. 검증하고자 하는 주제나 문서(PDF, Word, PNG 등)를 업로드하고 **`교차 검증 시작하기`**를 누르면 끝!

---

## 🌟 주요 특징 및 기능

1. **6대 이종 LLM 교차 검증 팀 (Serverless Direct API)**
   - **Gemini 3.6 Flash**: 1차 실증 팩트 데이터, 수치, 표준 정의 추출
   - **Claude 3.5 Sonnet / Haiku**: 1차 지식 중 환각(Hallucination), 비약, 오차 정밀 감정 및 교정
   - **ChatGPT (GPT-4o-mini)**: 상충 지점 조정 및 누락된 맥락 보완 지식 수렴
   - **Groq (Llama 3.3 70B)**: 초고속 팩트 검증 및 분당 12,000 토큰 세이프가드
   - **NVIDIA Nemotron**: 70B 파라미터 기반 심층 팩트체크
   - **OpenRouter Free**: 무제한 오픈소스 모델 교차 검증

2. **다중 문서 및 이미지 OCR 분석 지원**
   - PDF, Word(.docx), TXT, CSV, JSON 뿐만 아니라 **PNG, JPG, WEBP 이미지 속 글자(OCR)**까지 브라우저 내에서 직접 인식하여 교차 검증에 주입

3. **100% 브라우저 직송 (Serverless Client Architecture)**
   - 백엔드 서버 없이 브라우저에서 API를 직접 호출하므로 사용자의 API Key나 업로드 문서 데이터가 제3자 서버에 누출되지 않습니다.

---

## 🚀 로컬 개발 서버 실행 (선택 사항)

```bash
# 디렉터리 이동
cd LLM-Debate-Project

# 의존성 설치
npm install

# 로컬 개발 서버 실행
node server.js
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
