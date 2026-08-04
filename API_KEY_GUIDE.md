# 🔑 LLM API Key 발급 및 설정 가이드

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
- **발급 방법**:
  1. [OpenRouter Keys](https://openrouter.ai/keys) 접속 및 가입
  2. `Create Key` 클릭 후 `sk-or-v1-...` 키 복사 및 등록

---

## 💳 유료 LLM API (Claude, ChatGPT)

### 1. Anthropic Claude API
- **발급 방법**: [Anthropic Console](https://console.anthropic.com/settings/keys) 접속 ➔ `Create Key`

### 2. OpenAI ChatGPT API
- **발급 방법**: [OpenAI Platform](https://platform.openai.com/api-keys) 접속 ➔ `Create new secret key`

---

## 🛡️ 에러 자동 필터링 (Silent Error Filter)

만약 6개 LLM 중 일부 키가 미등록되어 있거나 쿼터 초과/인증 실패(401/429)가 발생해도, **정상 응답을 반환한 LLM들만 실시간 추출하여 교차 검증 파이프라인이 정상적으로 끝까지 수행**됩니다.
