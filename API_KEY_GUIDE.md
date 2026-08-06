# 🔑 LLM API Key 발급 및 설정 가이드

본 프로젝트는 다양한 이종 LLM(Google Gemini, Anthropic Claude, OpenAI, Groq, NVIDIA Build, OpenRouter) 간에 실시간 정보 공유 및 교차 검증을 진행합니다.

모든 API 키는 **서버에 저장되지 않으며, 오직 사용자의 브라우저(localStorage)에만 안전하게 보관**됩니다.

---

## ⚡ 추천 무제한/무료 LLM API (Gemini, Groq, NVIDIA, OpenRouter)

### 1. Google Gemini API (💎 하루 1,500회 상시 무료)
- **발급 방법**:
  1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속 및 로그인
  2. `Create API Key` 클릭 후 `AIzaSy...` 키 복사 및 등록
ㅁ# 🔑 LLM API Key 발급 및 설정 가이드

본 프로젝트는 다양한 이종 LLM(Google Gemini, Anthropic Claude, OpenAI, Groq, NVIDIA Build, OpenRouter) 간에 실시간 정보 공유 및 교차 검증을 진행합니다.

모든 API 키는 **서버에 저장되지 않으며, 오직 사용자의 브라우저(localStorage)에만 안전하게 보관**됩니다.

---

## ⚡ 추천 무제한/무료 LLM API (Gemini, Groq, NVIDIA, OpenRouter)

### 1. Google Gemini API (💎 하루 1,500회 상시 무료)
- **발급 방법**:
  1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속 및 로그인
  2. `Create API Key` 클릭 후 `AIzaSy...` 키 복사 및 등록

---

### 2. Groq API (⚡ Llama 3.3 70B 초고속 상시 무료)
- **특징**: 세계 최고 수준의 AI 인퍼런스 엔진. Llama 3.3 70B 모델을 상시 무료로 무제한 호출 가능.
- **발급 방법**:
  1. [Groq Console](https://console.groq.com/keys) 접속 및 회원가입
  2. `Create API Key` 클릭 후 생성된 `gsk_...` 키 복사
  3. 앱의 `🔑 API 키 설정` ➔ `Groq API Key` 입력란에 붙여넣기

---

### 3. NVIDIA Build API (🚀 1,000 크레딧 무료)
- **특징**: 엔비디아 공식 AI 클라우드. Llama 3.3 70B 및 Nemotron 70B 무료 호출 제공.
- **발급 방법**:
  1. [NVIDIA Build Console](https://build.nvidia.com/) 접속 및 로그인
  2. 원하는 모델(예: Llama 3.3 70B) 선택 후 `Get API Key` 클릭
  3. 생성된 `nvapi-...` 키 복사 및 등록

---

### 4. OpenRouter API (🌐 무제한 무료 오픈소스 LLM)
- **특징**: 다양한 오픈소스 AI 무료 제공.
- **📌 주요 참고 사항**: 계정 인증 및 API 키 활성화를 위해 소액($1) 크레딧(Credit)을 충전해야 합니다. **본 프로젝트에서 사용되는 `:free` 무료 라우팅 모델들(예: Meta Llama 3.3 70B Free 등)은 결제 금액이 실제로 전혀 차감되지 않으며 전액 무료로 이용 가능합니다.**
- **발급 방법**:
  1. [OpenRouter Keys](https://openrouter.ai/keys) 접속 및 가입
  2. Account ➔ Credits에서 $1 충전 후 `Create Key` 클릭하여 `sk-or-v1-...` 키 복사 및 등록

---

## 💳 유료 LLM API (Claude, ChatGPT)

### 1. Anthropic Claude API
- **발급 방법**: [Anthropic Console](https://console.anthropic.com/settings/keys) 접속 ➔ `Create Key`

### 2. OpenAI ChatGPT API
- **발급 방법**: [OpenAI Platform](https://platform.openai.com/api-keys) 접속 ➔ `Create new secret key`

---

## 🛡️ 에러 자동 필터링 (Silent Error Filter)

만약 6개 LLM 중 일부 키가 미등록되어 있거나 쿼터 초과/인증 실패(401/429)가 발생해도, **정상 응답을 반환한 LLM들만 실시간 추출하여 교차 검증 파이프라인이 정상적으로 끝까지 수행**됩니다.

---

## 🔥 Firebase Cloud DB (타 기기/스마트폰 Ultra-Short 공유)

본 프로젝트는 백엔드 서버가 없는 GitHub Pages 정적 사이트에서도 **다른 스마트폰, 타인 PC, 카카오톡 공유 시 100% 원문 데이터가 복원**되도록 **Firebase Firestore Cloud DB**를 내장 지원합니다.

- **작동 원리**:
  1. `대화 공유 (링크 복사)` 버튼 클릭 시 전체 대화록과 종합 보고서가 Firebase Firestore DB에 안전하게 보관됩니다.
  2. 생성된 **7자리 초단축 URL (`?share=f_docId`)**을 수신받은 사람은 어떤 기기/브라우저에서든 100% 원문 그대로 대화록 및 보고서를 열람할 수 있습니다.
- **내 나만의 Firebase 키로 변경 방법 (선택 사항)**:
  - 브라우저 개발자 도구 콘솔(`F12`)에서 `localStorage.setItem('llm_debate_firebase_config', JSON.stringify({ apiKey: "YOUR_KEY", projectId: "YOUR_PROJECT_ID", ... }))`을 실행하시면 나만의 Firebase Firestore DB로 커스텀 연동이 가능합니다.


---

### 2. Groq API (⚡ Llama 3.3 70B 초고속 상시 무료)
- **특징**: 세계 최고 수준의 AI 인퍼런스 엔진. Llama 3.3 70B 모델을 상시 무료로 무제한 호출 가능.
- **발급 방법**:
  1. [Groq Console](https://console.groq.com/keys) 접속 및 회원가입
  2. `Create API Key` 클릭 후 생성된 `gsk_...` 키 복사
  3. 앱의 `🔑 API 키 설정` ➔ `Groq API Key` 입력란에 붙여넣기

---

### 3. NVIDIA Build API (🚀 1,000 크레딧 무료)
- **특징**: 엔비디아 공식 AI 클라우드. Llama 3.3 70B 및 Nemotron 70B 무료 호출 제공.
- **발급 방법**:
  1. [NVIDIA Build Console](https://build.nvidia.com/) 접속 및 로그인
  2. 원하는 모델(예: Llama 3.3 70B) 선택 후 `Get API Key` 클릭
  3. 생성된 `nvapi-...` 키 복사 및 등록

---

### 4. OpenRouter API (🌐 무제한 무료 오픈소스 LLM)
- **특징**: 다양한 오픈소스 AI 무료 제공.
- **📌 주요 참고 사항**: 계정 인증 및 API 키 활성화를 위해 소액($1) 크레딧(Credit)을 충전해야 합니다. **본 프로젝트에서 사용되는 `:free` 무료 라우팅 모델들(예: Meta Llama 3.3 70B Free 등)은 결제 금액이 실제로 전혀 차감되지 않으며 전액 무료로 이용 가능합니다.**
- **발급 방법**:
  1. [OpenRouter Keys](https://openrouter.ai/keys) 접속 및 가입
  2. Account ➔ Credits에서 $1 충전 후 `Create Key` 클릭하여 `sk-or-v1-...` 키 복사 및 등록

---

## 💳 유료 LLM API (Claude, ChatGPT)

### 1. Anthropic Claude API
- **발급 방법**: [Anthropic Console](https://console.anthropic.com/settings/keys) 접속 ➔ `Create Key`

### 2. OpenAI ChatGPT API
- **발급 방법**: [OpenAI Platform](https://platform.openai.com/api-keys) 접속 ➔ `Create new secret key`

---

## 🛡️ 에러 자동 필터링 (Silent Error Filter)

만약 6개 LLM 중 일부 키가 미등록되어 있거나 쿼터 초과/인증 실패(401/429)가 발생해도, **정상 응답을 반환한 LLM들만 실시간 추출하여 교차 검증 파이프라인이 정상적으로 끝까지 수행**됩니다.
