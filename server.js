const express = require('express');
const cors = require('cors');
const path = require('path');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Provider Configurations with Official Tested Model IDs
const PROVIDER_CONFIGS = {
  gemini: { name: 'Gemini 3.6 Flash', roleKey: 'FactFinder', roleLabel: '🔍 팩트 & 수치 탐색', stanceClass: 'factfinder' },
  claude: { name: 'Claude 3.5', roleKey: 'CrossAuditor', roleLabel: '🛡️ 교차 감정 & 환각 교정', stanceClass: 'auditor' },
  openai: { name: 'ChatGPT (GPT-4o-mini)', roleKey: 'Synthesizer', roleLabel: '🧩 지식 합성 & 맥락 보완', stanceClass: 'synthesizer', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  groq: { name: 'Groq (Llama 3.3 70B)', roleKey: 'FactFinder', roleLabel: '⚡ Groq 초고속 탐색', stanceClass: 'factfinder', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  nvidia: { name: 'NVIDIA Nemotron', roleKey: 'CrossAuditor', roleLabel: '🚀 NVIDIA 심층 교차 감정', stanceClass: 'auditor', baseUrl: 'https://integrate.api.nvidia.com/v1', model: 'meta/llama-3.3-70b-instruct' },
  openrouter: { name: 'OpenRouter Free', roleKey: 'FactFinder', roleLabel: '🌐 OpenRouter 교차 탐색', stanceClass: 'factfinder', baseUrl: 'https://openrouter.ai/api/v1', model: 'meta-llama/llama-3.3-70b-instruct' }
};

// Helper for calling Gemini API (Supports both traditional AIzaSy and new 2026 AQ.Ab keys)
async function callGemini(apiKey, systemPrompt, userPrompt) {
  const modelsToTry = [
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.0-flash',
    'gemini-2.5-flash-preview-05-20',
    'gemini-2.0-flash'
  ];
  let lastError = null;

  const sanitizedSys = cleanText(systemPrompt);
  const sanitizedUser = cleanText(userPrompt);
  const cleanKey = apiKey.trim();

  for (const model of modelsToTry) {
    console.log(`[REAL NET CALL] Calling Gemini API (${model})...`);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-goog-api-key': cleanKey
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${sanitizedSys}\n\n${sanitizedUser}` }]
          }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.3 }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429) {
          throw new Error(`Gemini 429 Quota Exceeded (무료 한도 초과): ${errText}`);
        }
        if (response.status === 404) {
          throw new Error(`Gemini 404 Error (${model}): 해당 모델 엔드포인트를 찾을 수 없습니다. (${errText})`);
        }
        throw new Error(`Gemini Error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const finishReason = data.candidates?.[0]?.finishReason || 'UNKNOWN';
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      console.log(`[Gemini Debug] Model: ${model}, FinishReason: ${finishReason}, OutputLength: ${rawText ? rawText.length : 0} chars`);
      
      if (!rawText) throw new Error('Gemini API return format mismatch or empty content.');

      const text = cleanText(rawText);
      if (isDegenerateLoop(text)) throw new Error('Gemini returned degenerate token loop.');
      return text;
    } catch (e) {
      lastError = e;
      if (modelsToTry.length > 1) {
        console.warn(`[Gemini Fallback] ${model} failed (${e.message}), trying next candidate...`);
      }
    }
  }

  throw lastError;
}

// Helper for calling Claude API
async function callClaude(apiKey, systemPrompt, userPrompt, model = 'claude-3-5-haiku-20241022') {
  console.log(`[REAL NET CALL] Calling Anthropic Claude API (${model})...`);
  const url = 'https://api.anthropic.com/v1/messages';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1200,
      system: cleanText(systemPrompt),
      messages: [{ role: 'user', content: cleanText(userPrompt) }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text;
  if (!rawText) throw new Error('Claude API return format mismatch or empty content.');

  const text = cleanText(rawText);
  if (isDegenerateLoop(text)) throw new Error('Claude returned degenerate token loop.');
  return text;
}

// Helper to sanitize control characters and non-printable bytes
function cleanText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    .replace(/[\uFFFD\uFFFE\uFFFF]/g, '')
    .replace(/(?:\x05|\\x05|\u0005){2,}/g, '')
    .trim();
}

// Detect if LLM model degenerated into repeating control characters or 'I' loops
function isDegenerateLoop(text) {
  if (!text) return true;
  const cleaned = text.replace(/[\s\x00-\x1F\x7F-\x9F]/g, '');
  if (cleaned.length < 5) return false;
  const charCounts = {};
  for (const ch of cleaned) {
    charCounts[ch] = (charCounts[ch] || 0) + 1;
  }
  const maxCharCount = Math.max(...Object.values(charCounts));
  return (maxCharCount / cleaned.length > 0.65);
}

// Helper for calling OpenAI-Compatible REST APIs (OpenAI, Groq, Cerebras, NVIDIA Build, OpenRouter)
async function callOpenAICompatible(baseUrl, apiKey, systemPrompt, userPrompt, model, providerName = 'API') {
  console.log(`[REAL NET CALL] Calling ${providerName} (${model}) at ${baseUrl}...`);
  const url = `${baseUrl}/chat/completions`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey.trim()}`,
    'User-Agent': 'LLM-FactCheck-Arena/1.0'
  };

  if (baseUrl.includes('openrouter')) {
    headers['HTTP-Referer'] = 'http://localhost:3000';
    headers['X-Title'] = 'LLM Fact-Check Arena';
  }

  // Define candidate models for each provider if primary model returns 404/413 or fails
  let modelsToTry = [model];
  if (baseUrl.includes('openrouter')) {
    modelsToTry = [model, 'meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-r1:free', 'google/gemma-2-9b-it:free', 'openrouter/auto'];
  } else if (baseUrl.includes('groq')) {
    modelsToTry = [model, 'llama-3.1-8b-instant', 'llama-3.3-70b-specdec', 'qwen-2.5-coder-32b', 'deepseek-r1-distill-qwen-32b'];
  } else if (baseUrl.includes('nvidia')) {
    modelsToTry = [model, 'nvidia/llama-3.3-nemotron-super-49b-v1.5', 'meta/llama3-70b-instruct', 'deepseek-ai/deepseek-r1'];
  }

  const sanitizedSys = cleanText(systemPrompt);
  const sanitizedUser = cleanText(userPrompt);

  let lastError = null;
  for (const currentModel of modelsToTry) {
    try {
      const reqBody = {
        model: currentModel,
        max_tokens: baseUrl.includes('groq') ? 3000 : 8192,
        temperature: 0.6,
        messages: [
          { role: 'system', content: sanitizedSys },
          { role: 'user', content: sanitizedUser }
        ]
      };

      if (!baseUrl.includes('groq')) {
        reqBody.presence_penalty = 0.2;
        reqBody.frequency_penalty = 0.2;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(reqBody)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${providerName} Error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content;
      if (!rawText) throw new Error(`${providerName} API return format mismatch or empty content.`);

      const text = cleanText(rawText);
      if (isDegenerateLoop(text)) {
        throw new Error(`${providerName} returned repetitive control loop ('IIIIII' or '\\x05'), switching to next model candidate...`);
      }

      return text;
    } catch (e) {
      lastError = e;
      if (modelsToTry.length > 1) {
        console.warn(`[${providerName} Fallback] ${currentModel} failed (${e.message}), trying next candidate...`);
      }
    }
  }

  throw lastError;
}

// Universal PDF Text Extractor Helper
async function extractPdfText(buffer) {
  const uint8Data = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  if (pdfParse.PDFParse) {
    const parser = new pdfParse.PDFParse(uint8Data);
    if (typeof parser.load === 'function') await parser.load(uint8Data);
    if (typeof parser.getText === 'function') {
      const res = await parser.getText();
      if (typeof res === 'string') return res;
      if (res && res.text) return res.text;
      if (res && typeof res === 'object') {
        return Object.values(res).filter(v => typeof v === 'string').join('\n');
      }
    }
  } else if (typeof pdfParse === 'function') {
    const data = await pdfParse(buffer);
    return data.text || '';
  } else if (typeof pdfParse.default === 'function') {
    const data = await pdfParse.default(buffer);
    return data.text || '';
  }
  throw new Error('PDF 파서 모듈 초기화 실패');
}

const { createWorker } = require('tesseract.js');

// Universal Image OCR Extractor Helper (PNG, JPG, JPEG, WEBP, BMP, GIF)
async function extractImageText(buffer) {
  let worker = null;
  try {
    console.log('[OCR] Performing image OCR text extraction...');
    worker = await createWorker(['eng', 'kor']);
    const { data } = await worker.recognize(buffer);
    await worker.terminate();
    console.log(`[OCR SUCCESS] Extracted ${data.text ? data.text.length : 0} characters from image`);
    return data.text || '';
  } catch (err) {
    if (worker) try { await worker.terminate(); } catch (e) {}
    console.warn(`[OCR Warning] Multi-lang OCR failed (${err.message}), falling back to eng worker...`);
    try {
      const engWorker = await createWorker('eng');
      const { data } = await engWorker.recognize(buffer);
      await engWorker.terminate();
      return data.text || '';
    } catch (e) {
      throw new Error(`이미지 텍스트 인식(OCR) 실패: ${err.message}`);
    }
  }
}

// Helper for parsing a single file buffer into extracted text
async function parseFileBuffer(originalname, size, buffer) {
  const ext = path.extname(originalname).toLowerCase();
  let extractedText = '';

  const imageExts = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.tiff'];

  if (ext === '.pdf') {
    extractedText = await extractPdfText(buffer);
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value || '';
  } else if (imageExts.includes(ext)) {
    extractedText = await extractImageText(buffer);
  } else {
    // Text-based formats (.txt, .md, .json, .csv, .log, .js, .py, .html, etc.)
    extractedText = buffer.toString('utf-8');
  }

  extractedText = (extractedText || '').trim();
  return {
    filename: originalname,
    filesize: size,
    charCount: extractedText.length,
    extractedText: extractedText.slice(0, 15000)
  };
}

// Single File Upload Route
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '업로드된 파일이 없습니다.' });
    }

    const { originalname, size, buffer } = req.file;
    console.log(`[FILE UPLOAD] Received ${originalname} (${size} bytes)`);

    const parsed = await parseFileBuffer(originalname, size, buffer);

    if (!parsed.extractedText) {
      return res.json({
        success: false,
        error: '파일에서 텍스트를 추출할 수 없습니다. (스캔 전용 이미지 PDF이거나 파일이 비어 있음)'
      });
    }

    console.log(`[FILE UPLOAD SUCCESS] Extracted ${parsed.charCount} characters from ${originalname}`);
    return res.json({ success: true, ...parsed });
  } catch (err) {
    console.error('File Upload Error:', err);
    return res.status(500).json({ success: false, error: `파일 분석 실패: ${err.message}` });
  }
});

// Multiple Files Upload Route (up to 10 files simultaneously)
app.post('/api/upload-multiple', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: '업로드된 파일이 없습니다.' });
    }

    console.log(`[MULTI-FILE UPLOAD] Processing ${files.length} files...`);
    const parsedFiles = [];

    for (const f of files) {
      try {
        const parsed = await parseFileBuffer(f.originalname, f.size, f.buffer);
        if (parsed.extractedText) {
          parsedFiles.push(parsed);
        }
      } catch (err) {
        console.warn(`[MULTI-FILE UPLOAD] Failed to parse ${f.originalname}: ${err.message}`);
      }
    }

    if (parsedFiles.length === 0) {
      return res.json({ success: false, error: '업로드된 파일에서 텍스트를 추출할 수 없습니다.' });
    }

    return res.json({
      success: true,
      files: parsedFiles,
      totalFiles: parsedFiles.length
    });
  } catch (err) {
    console.error('Multi-File Upload Error:', err);
    return res.status(500).json({ success: false, error: `다중 파일 분석 실패: ${err.message}` });
  }
});

// Smart File Content Prompt Truncator (Prevents TPM 413 & 504 Timeout Errors)
function buildFilesPrompt(attachedFiles, attachedFile, maxTotalChars = 6000) {
  const list = attachedFiles && attachedFiles.length > 0 ? attachedFiles : (attachedFile ? [attachedFile] : []);
  if (list.length === 0) return '';

  const perFileLimit = Math.max(1000, Math.floor(maxTotalChars / list.length));
  let promptText = `\n\n[업로드 첨부 분석 문서 목록 (총 ${list.length}개 파일)]:\n`;

  list.forEach((f, idx) => {
    let rawText = (f.extractedText || '').trim();
    if (rawText.length > perFileLimit) {
      rawText = rawText.slice(0, perFileLimit) + `\n...[하략 - 총 ${rawText.length.toLocaleString()}자 중 주요 ${perFileLimit.toLocaleString()}자 요약 포함]`;
    }
    promptText += `\n=== [문서 ${idx + 1}] ${f.filename} ===\n${rawText}\n`;
  });

  return promptText;
}

function buildMultiReferencePrompt(referenceSessions, referenceSession) {
  let list = [];
  if (Array.isArray(referenceSessions) && referenceSessions.length > 0) {
    list = referenceSessions;
  } else if (referenceSession && referenceSession.topic) {
    list = [referenceSession];
  }

  if (list.length === 0) return '';

  let promptText = `\n\n[이전 비교 기준 토론 기록 연계 (총 ${list.length}개 세션 연계 중)]:\n`;
  list.forEach((s, idx) => {
    const summaryText = (s.consensusReport || s.debateHistory || '').trim();
    promptText += `\n=== [연계 기준 ${idx + 1}] 주제: "${s.title || s.topic}" (일시: ${s.date || '최근'}) ===\n${summaryText.slice(0, 3000)}\n`;
  });
  promptText += `\n위 ${list.length}개의 이전 비교 기준 기록들(A1, A2...) 대비 이번 검증 질의(A')에서 어떤 수치나 지식의 변화, 의견 및 팩트의 발전이 일어났는지 종합 대조하여 상세 분석하세요.`;
  return promptText;
}

// Dispatch single model call with error filtering
async function executeProviderCall(providerKey, apiKey, roleKey, topic, roundNumber, debateHistory, referenceSession, attachedFile, attachedFiles, referenceSessions) {
  const config = PROVIDER_CONFIGS[providerKey];
  if (!config) throw new Error(`Unknown provider: ${providerKey}`);

  const currentRole = roleKey || config.roleKey;
  const sysKoreanRule = "\n\n[언어 출력 강제 규칙]: 답변은 반드시 100% 한글(한국어)로만 작성하세요. 한자(漢字, 中文)나 일본어 문자는 절대로 사용하지 마시고, 모든 전문용어와 고유명사는 반드시 한국어(한글)로 번역하거나 한글 표기로 작성하세요.";

  const systemPrompts = {
    'FactFinder': `당신은 최신 데이터와 정확한 팩트를 추출하는 전문 분석 AI(${config.name})입니다. 질문 '${topic}'에 대해 추측이나 환각(Hallucination)을 철저히 배제하고, 객관적으로 검증 가능한 실증 데이터와 팩트만을 제시하세요.${sysKoreanRule}`,
    'CrossAuditor': `당신은 엄격한 팩트체커이자 교차 검증 AI(${config.name})입니다. 이전 발언들에 포함된 정보 중 숫자의 오차, 근거 없는 추측, 환각(Hallucination), 논리적 오류가 있는지 정밀 감정하고 교정하세요.${sysKoreanRule}`,
    'Synthesizer': `당신은 지식 합성 및 종합 검증 AI(${config.name})입니다. 공유된 정보를 바탕으로 상충되는 주장을 조정하고, 누락된 핵심 맥락을 채워 정제된 신뢰 지식을 완성하세요.${sysKoreanRule}`
  };

  let userPrompt = `[조사/검증 주제]: ${topic}\n[진행 라운드]: Round ${roundNumber}`;
  userPrompt += buildFilesPrompt(attachedFiles, attachedFile, 6000);
  userPrompt += `\n\n[이전 모델들의 정보 공유 및 교차 검증 기록]:\n${debateHistory || '(첫 번째 정보 탐색 라운드입니다)'}`;
  userPrompt += buildMultiReferencePrompt(referenceSessions, referenceSession);
  userPrompt += `\n\n위 내용을 바탕으로 당신의 역할(${currentRole})에 맞게 사실 관계를 교차 검증하고 환각을 줄이기 위한 의견을 100% 한글(한국어)로 제시하세요.`;

  const sysPrompt = systemPrompts[currentRole] || systemPrompts['FactFinder'];

  if (providerKey === 'gemini') {
    return await callGemini(apiKey, sysPrompt, userPrompt);
  } else if (providerKey === 'claude') {
    return await callClaude(apiKey, sysPrompt, userPrompt);
  } else {
    return await callOpenAICompatible(config.baseUrl, apiKey, sysPrompt, userPrompt, config.model, config.name);
  }
}

// Fallback Mock Fact-Checking Responses
function generateMockResponse(modelName, role, topic, roundNumber, debateHistory, referenceSession, attachedFile) {
  const hasRef = Boolean(referenceSession && referenceSession.topic);
  const refText = hasRef ? `\n\n🔍 **[이전 토론(A: ${referenceSession.topic}) 대비 변화 분석]**:\n이전 검증 결론 대비 이번 신규 질의(A')에서는 데이터의 최신화 및 조건부 수치의 정밀화가 이루어졌으며, 이전 지식의 일부 모호했던 지점이 대폭 보완되었습니다.` : '';
  const fileNote = attachedFile ? `\n\n📁 **[첨부 문서(${attachedFile.filename}) 분석 내용 포함됨]**` : '';

  if (role === 'FactFinder' || modelName.includes('Gemini') || modelName.includes('Groq')) {
    return `[라운드 ${roundNumber} 팩트 탐색 - ${modelName}]\n질의 '${topic}'에 대해 객관적으로 검증 가능한 수치 및 핵심 사실을 공유합니다.${fileNote}${refText}\n\n📌 **주요 팩트 및 근거 데이터**:\n1. **핵심 정의**: 해당 주제의 정설로 인정받는 과학적/학술적 표준 개념\n2. **검증된 수치**: 첨부 문서 및 공식 연구 보고서에 기재된 데이터 지표\n3. **확인된 사실**: 학계 및 기관 발표로 교차 검증이 완료된 부분\n\n다른 모델분들께서는 위 사실 중 오류나 미확인 추정이 포함되어 있는지 검증해 주시기 바랍니다.`;
  } else if (role === 'CrossAuditor' || modelName.includes('Claude') || modelName.includes('NVIDIA')) {
    return `[라운드 ${roundNumber} 교차 감정 & 환각 교정 - ${modelName}]\n이전 발언에서 공유된 정보 중 **환각(Hallucination) 가능성이 있거나 교정이 필요한 지점**을 분석합니다.${fileNote}${refText}\n\n🛡️ **교차 검증 및 환각 감지 분석**:\n- ✅ **확정된 사실**: 제시된 핵심 개념 및 주요 수치는 타당함\n- ⚠️ **주의/교정 필요 (Potential Hallucination)**: 구체적 맥락이나 조건이 명시되지 않을 경우 오해를 부를 수 있는 부분이 존재함\n- 💡 **보완 제언**: 단정적 표현 대신 통계적 범위나 예외 조건을 명확히 기재할 것을 제안합니다.`;
  } else {
    return `[라운드 ${roundNumber} 지식 합성 & 맥락 보완 - ${modelName}]\n모든 AI 모델이 교차 검증한 결과를 종합하고 누락된 중요 맥락을 보완합니다.${fileNote}${refText}\n\n🧩 **맥락 합성 및 보완 정보**:\n1. **상충 지점 해소**: 이전 라운드에서 제시된 데이터 간의 미세한 오차 원인을 규명함\n2. **추가 검증 정보**: 최신 논문 및 교차 자료 분석 결과 반영\n3. **최종 합의점 수렴**: 세 모델 간 이견 없는 객관적 사실군 구획화 완료.`;
  }
}

// Single Turn API Dispatcher: Queries Provider or Returns Filtered Success
app.post('/api/debate/step', async (req, res) => {
  try {
    const { providerKey, modelName, role, stance, topic, roundNumber, debateHistory, referenceSession, attachedFile, attachedFiles, apiKeys } = req.body;
    const key = apiKeys?.[providerKey];

    const fileCount = (attachedFiles && attachedFiles.length) || (attachedFile ? 1 : 0);
    console.log(`\n[STEP REQUEST] Provider: ${providerKey}, HasKey: ${Boolean(key && key.trim())}, Files: ${fileCount}`);

    if (key && key.trim()) {
      try {
        const text = await executeProviderCall(providerKey, key.trim(), role, topic, roundNumber, debateHistory, referenceSession, attachedFile, attachedFiles);
        console.log(`[STEP SUCCESS] Real API call returned output for ${providerKey}`);
        return res.json({ success: true, providerKey, modelName: PROVIDER_CONFIGS[providerKey]?.name || modelName, text, isMock: false });
      } catch (err) {
        console.warn(`[API ERROR FOR ${providerKey}]: ${err.message}`);
        
        let shortErr = err.message;
        if (err.message.includes('401')) shortErr = 'API Key 인증 실패 (401 Invalid Key)';
        else if (err.message.includes('429')) shortErr = '무료 사용 한도/쿼터 초과 (429 Rate Limit)';
        else if (err.message.includes('404')) shortErr = '지원되지 않는 모델 ID 또는 엔드포인트 (404 Not Found)';
        else if (err.message.includes('400')) shortErr = '잘못된 요청 형식/권한 부족 (400 Bad Request)';

        return res.json({
          success: false,
          providerKey,
          modelName: PROVIDER_CONFIGS[providerKey]?.name || modelName,
          error: shortErr,
          rawError: err.message,
          filtered: true
        });
      }
    } else {
      console.log(`[MOCK FALLBACK] No key present for ${providerKey}, returning simulation.`);
      await new Promise(r => setTimeout(r, 800));
      const text = generateMockResponse(modelName || 'Gemini 2.0', role || 'FactFinder', topic, roundNumber, debateHistory, referenceSession, attachedFile);
      return res.json({ success: true, providerKey, modelName: PROVIDER_CONFIGS[providerKey]?.name || modelName, text, isMock: true });
    }
  } catch (err) {
    console.error('Error in /api/debate/step:', err);
    res.json({ success: false, error: err.message, filtered: true });
  }
});

// Final Consensus & Verified Knowledge Synthesis API
app.post('/api/debate/judge', async (req, res) => {
  try {
    const { topic, debateHistory, referenceSession, attachedFile, attachedFiles, apiKeys } = req.body;

    const systemPrompt = `당신은 여러 이종 LLM이 교차 검증한 대화록과 첨부 문서들을 바탕으로 최종 신뢰할 수 있는 정보를 정리하는 '최종 교차검증 통합관' AI입니다. 환각(Hallucination)이 감지되거나 교정된 지점을 명확히 밝히고 최고 신뢰도의 종합 보고서를 작성하세요.`;
    
    let userPrompt = `[검증 주제]: ${topic}`;
    userPrompt += buildFilesPrompt(attachedFiles, attachedFile, 6000);
    userPrompt += `\n\n[다중 LLM 교차 검증 기록]:\n${debateHistory}`;

    if (referenceSession && referenceSession.topic) {
      userPrompt += `\n\n[이전 비교 기준 기록 (기존 주제 A: ${referenceSession.topic})]:\n${referenceSession.consensusReport || ''}\n\n이전 검증(A) 대비 이번 새 검증(A')에서의 주요 의견/지식 변화 분석 항목도 보고서에 추가하세요.`;
    }

    userPrompt += `\n\n다음 항목에 따라 환각이 최소화된 최종 팩트체크 종합 보고서를 작성하세요:\n1. 🎯 **최종 팩트체크 결론 (Executive Summary)**\n2. 🔄 **이전 검증(A) 대비 이번 검증(A') 핵심 변화 및 발전 (A vs A' Comparison)**\n3. ✅ **교차 확인된 확정 팩트 (100% Verified Facts)**\n4. ⚠️ **교정/식별된 환각 및 오정보 (Identified & Corrected Hallucinations)**\n5. 📊 **정보 신뢰도 점수 및 검증 평가 (Confidence Score: X/100)**\n6. 💡 **사용자를 위한 최종 가이드라인**`;

    // Try available active keys for judge in order of preference
    const activeProviders = ['openai', 'groq', 'nvidia', 'openrouter', 'claude', 'gemini'];
    let responseText = '';
    let isMock = false;

    for (const pKey of activeProviders) {
      const k = apiKeys?.[pKey];
      if (k && k.trim()) {
        try {
          const cfg = PROVIDER_CONFIGS[pKey];
          if (pKey === 'gemini') responseText = await callGemini(k.trim(), systemPrompt, userPrompt);
          else if (pKey === 'claude') responseText = await callClaude(k.trim(), systemPrompt, userPrompt);
          else responseText = await callOpenAICompatible(cfg.baseUrl, k.trim(), systemPrompt, userPrompt, cfg.model, cfg.name);
          console.log(`[JUDGE SUCCESS] Real API call returned report for referee using ${pKey}`);
          break;
        } catch (e) {
          console.warn(`[Referee Judge Error for ${pKey}]: ${e.message}`);
        }
      }
    }

    if (!responseText) {
      await new Promise(r => setTimeout(r, 1200));
      const refComp = (referenceSession && referenceSession.topic) 
        ? `\n\n**2. 🔄 이전 검증(A: ${referenceSession.topic}) 대비 A' 변화 분석**\n- **주요 지식 진전**: 이전 기준 대비 이번 검증(A')에서 최신 실증 데이터 및 구체적 조건이 새롭게 수렴됨.\n- **관점/의견 교정**: 기존에 다소 모호했던 일부 세부 주장이 명확한 데이터 지표로 재정의됨.`
        : '';

      responseText = `🎯 **[Multi-LLM 최종 교차검증 팩트체크 보고서]**\n\n**1. 최종 팩트체크 결론 (Executive Summary)**\n여러 이종 LLM이 교차 감정을 진행한 결과, 주제 **'${topic}'**에 대하여 단순 소문이나 비약적 추정(Hallucination)을 배제한 고신뢰도 검증 결과를 도출하였습니다.${refComp}\n\n**3. ✅ 교차 확인된 확정 팩트 (100% Verified Facts)**\n- **사실 1**: 다수 학술 논문 및 실증 데이터로 검증된 핵심 수치와 메커니즘 확인.\n- **사실 2**: 참여한 AI 모델들이 모두 동일하게 동의하는 표준 정의 및 적용 가능 범위 확인.\n\n**4. ⚠️ 교정/식별된 환각 및 오정보 (Identified & Corrected Hallucinations)**\n- **교정 지점 1**: 초기에 제시된 일부 단정적 성과 수치는 조건부 수치로 교정됨.\n- **교정 지점 2**: 출처가 불분명한 일부 인용 사례는 과장된 지칭임이 확인되어 보고서에서 제외 조치함.\n\n**5. 📊 정보 신뢰도 평가 (Confidence Score)**\n- **최종 신뢰도 점수**: **97 / 100** (교차 감정을 통해 초기 환각 위험 요소 90% 이상 제거됨)\n\n**6. 💡 종합 가이드라인**\n본 검증 보고서에 기재된 [확정 팩트]는 실무 및 학술 자료로 안심하고 활용하실 수 있습니다.`;
      isMock = true;
    }

    res.json({ success: true, text: responseText, isMock });
  } catch (err) {
    console.error('Error in /api/debate/judge:', err);
    res.status(500).json({ error: err.message });
  }
});

// Share Link Vault Store (Ultra-Short URL Support)
const SHARE_STORE = new Map();

app.post('/api/share/save', (req, res) => {
  try {
    const { payload } = req.body;
    if (!payload) return res.status(400).json({ error: 'Payload missing' });
    const shareId = 's_' + Math.random().toString(36).substring(2, 10);
    SHARE_STORE.set(shareId, payload);
    const hostUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, shareId, shareUrl: `${hostUrl}/?share=${shareId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/share/:shareId', (req, res) => {
  const { shareId } = req.params;
  const data = SHARE_STORE.get(shareId);
  if (!data) return res.status(404).json({ error: 'Shared session not found' });
  res.json({ success: true, payload: data });
});

// Firebase Security Config Proxy Endpoint
app.get('/api/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyD2NhBdVelBLheEQVbsT4cObzvsMgLgtMo",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "llm-debate-agent.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "llm-debate-agent",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "llm-debate-agent.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "119510377719",
    appId: process.env.FIREBASE_APP_ID || "1:119510377719:web:2fe1a6eb61df0fef1adff2",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-VGCSC2RZTC"
  });
});

// Word (.docx) Document Generator Endpoint
app.post('/api/export/docx', async (req, res) => {
  try {
    const { title, reportText, fullLog } = req.body;

    const docParagraphs = [
      new Paragraph({
        children: [
          new TextRun({ text: `🛡️ Multi-LLM 팩트체크 검증 보고서`, bold: true, size: 36, color: '0284C7' })
        ],
        spacing: { after: 150 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `검증 주제: `, bold: true, size: 24 }),
          new TextRun({ text: title || '주제 미지정', size: 24, italic: true })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `생성 일시: ${new Date().toLocaleString('ko-KR')}`, size: 20, color: '666666' })
        ],
        spacing: { after: 300 }
      })
    ];

    if (reportText) {
      docParagraphs.push(new Paragraph({
        children: [new TextRun({ text: '👑 최종 교차검증 통합 보고서', bold: true, size: 28, color: 'D97706' })],
        spacing: { before: 200, after: 150 }
      }));

      const lines = reportText.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          docParagraphs.push(new Paragraph({
            children: [new TextRun({ text: trimmed.replace(/\*\*/g, ''), bold: true, size: 22, color: '1E293B' })],
            spacing: { before: 150, after: 80 }
          }));
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          docParagraphs.push(new Paragraph({
            children: [new TextRun({ text: `• ${trimmed.replace(/^[-*]\s*/, '').replace(/\*\*/g, '')}`, size: 20 })],
            spacing: { after: 60 }
          }));
        } else {
          docParagraphs.push(new Paragraph({
            children: [new TextRun({ text: trimmed.replace(/\*\*/g, ''), size: 20 })],
            spacing: { after: 80 }
          }));
        }
      });
    }

    if (fullLog && fullLog.length > 0) {
      docParagraphs.push(new Paragraph({
        children: [new TextRun({ text: '💬 라운드별 세부 검증 대화록', bold: true, size: 26, color: '0284C7' })],
        spacing: { before: 400, after: 150 }
      }));

      fullLog.forEach(turn => {
        if (turn.round !== 'Consensus') {
          docParagraphs.push(new Paragraph({
            children: [
              new TextRun({ text: `[Round ${turn.round}] ${turn.speaker} (${turn.role || turn.stance || ''})`, bold: true, size: 22, color: '334155' })
            ],
            spacing: { before: 150, after: 60 }
          }));
          docParagraphs.push(new Paragraph({
            children: [new TextRun({ text: turn.text || '', size: 20 })],
            spacing: { after: 120 }
          }));
        }
      });
    }

    const doc = new Document({
      sections: [{ children: docParagraphs }]
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=FactCheck_Report.docx`);
    res.send(buffer);
  } catch (err) {
    console.error('Error generating docx:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`LLM Fact-Checking Pipeline Server running at http://localhost:${PORT}`);
});
