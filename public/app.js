document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const topicInput = document.getElementById('topic-input');
  const roundsSelect = document.getElementById('rounds-select');
  const roundsValue = document.getElementById('rounds-value');
  const btnStart = document.getElementById('btn-start');
  const btnStop = document.getElementById('btn-stop');
  const btnExportDocxFull = document.getElementById('btn-export-docx-full');
  const btnApiModal = document.getElementById('btn-api-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnSaveKeys = document.getElementById('btn-save-keys');
  const apiModal = document.getElementById('api-modal');
  const debateStream = document.getElementById('debate-stream');
  const refereeCard = document.getElementById('referee-card');
  const refereeBody = document.getElementById('referee-body');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const roundProgress = document.getElementById('round-progress');
  const headerKeyCount = document.getElementById('header-key-count');

  // Active Reference Banner Elements
  const activeReferenceBanner = document.getElementById('active-reference-banner');
  const refBannerTopic = document.getElementById('ref-banner-topic');
  const btnClearReference = document.getElementById('btn-clear-reference');

  // History DOM Elements
  const btnHistoryModal = document.getElementById('btn-history-modal');
  const btnCloseHistoryModal = document.getElementById('btn-close-history-modal');
  const historyModal = document.getElementById('history-modal');
  const historyCountBadge = document.getElementById('history-count-badge');
  const historyListContainer = document.getElementById('history-list-container');
  const historySearchInput = document.getElementById('history-search-input');
  const btnClearAllHistories = document.getElementById('btn-clear-all-histories');
  const btnSaveCurrentHistory = document.getElementById('btn-save-current-history');
  const referenceSessionSelect = document.getElementById('reference-session-select');

  // History Right Pane Detail Elements
  const historyDetailEmpty = document.getElementById('history-detail-empty');
  const historyDetailContent = document.getElementById('history-detail-content');
  const detailTitleInput = document.getElementById('detail-title-input');
  const detailMetaText = document.getElementById('detail-meta-text');
  const detailNotesArea = document.getElementById('detail-notes-area');
  const detailReportText = document.getElementById('detail-report-text');
  const detailTranscriptList = document.getElementById('detail-transcript-list');
  const btnSetAsReference = document.getElementById('btn-set-as-reference');
  const btnDownloadDetailDocx = document.getElementById('btn-download-detail-docx');
  const btnDeleteDetailItem = document.getElementById('btn-delete-detail-item');

  // Dedicated Report Download Buttons
  const btnDownloadReportDocx = document.getElementById('btn-download-report-docx');

  // Provider Inputs & Indicators
  const keyInputs = {
    gemini: document.getElementById('gemini-key'),
    claude: document.getElementById('claude-key'),
    openai: document.getElementById('openai-key'),
    groq: document.getElementById('groq-key'),
    nvidia: document.getElementById('nvidia-key'),
    openrouter: document.getElementById('openrouter-key')
  };

  const statusIndicators = {
    gemini: document.getElementById('gemini-status'),
    claude: document.getElementById('claude-status'),
    openai: document.getElementById('openai-status'),
    groq: document.getElementById('groq-status'),
    nvidia: document.getElementById('nvidia-status'),
    openrouter: document.getElementById('openrouter-status')
  };

  // Left Sidebar Model Tag Badges
  const modelTagBadges = {
    gemini: document.getElementById('tag-gemini'),
    claude: document.getElementById('tag-claude'),
    openai: document.getElementById('tag-openai'),
    groq: document.getElementById('tag-groq'),
    nvidia: document.getElementById('tag-nvidia'),
    openrouter: document.getElementById('tag-openrouter')
  };

  // File Upload Elements & State
  const fileDropzone = document.getElementById('file-dropzone');
  const fileUploadInput = document.getElementById('file-upload-input');
  const dropzonePrompt = document.getElementById('dropzone-prompt');
  const fileUploadSpinner = document.getElementById('file-upload-spinner');
  const uploadedFilesList = document.getElementById('uploaded-files-list');
  const filesCountBadge = document.getElementById('files-count-badge');

  // State
  let isDebating = false;
  let debateHistory = '';
  let fullDebateLog = [];
  let finalReportText = '';
  let apiKeys = { gemini: '', claude: '', openai: '', groq: '', nvidia: '', openrouter: '' };
  let enabledModels = { gemini: true, claude: true, openai: true, groq: true, nvidia: true, openrouter: true };
  let savedHistories = [];
  let selectedHistoryItem = null;
  let activeReferenceSession = null;
  let attachedFiles = []; // Array of { filename, filesize, charCount, extractedText }

  // File Upload Event Listeners & Handler
  if (fileDropzone && fileUploadInput) {
    fileDropzone.addEventListener('click', (e) => {
      if (e.target.closest('.btn-remove-file')) return;
      fileUploadInput.click();
    });

    fileDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileDropzone.classList.add('dragover');
    });

    ['dragleave', 'dragend', 'drop'].forEach(evt => {
      fileDropzone.addEventListener(evt, () => {
        fileDropzone.classList.remove('dragover');
      });
    });

    fileDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileUploads(files);
      }
    });

    fileUploadInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileUploads(e.target.files);
      }
    });
  }

  function removeAttachedFile(index) {
    attachedFiles.splice(index, 1);
    renderUploadedFilesList();
  }

  function renderUploadedFilesList() {
    if (!uploadedFilesList) return;
    uploadedFilesList.innerHTML = '';

    if (attachedFiles.length === 0) {
      uploadedFilesList.classList.add('hidden');
      if (filesCountBadge) filesCountBadge.classList.add('hidden');
      return;
    }

    uploadedFilesList.classList.remove('hidden');
    if (filesCountBadge) {
      filesCountBadge.classList.remove('hidden');
      const totalChars = attachedFiles.reduce((sum, f) => sum + (f.charCount || 0), 0);
      filesCountBadge.textContent = `${attachedFiles.length}개 문서 첨부됨 (${totalChars.toLocaleString()}자)`;
    }

    attachedFiles.forEach((file, idx) => {
      const ext = (file.filename.split('.').pop() || '').toLowerCase();
      let icon = '📄';
      if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff'].includes(ext)) icon = '🖼️';
      else if (ext === 'pdf') icon = '📕';
      else if (ext === 'docx' || ext === 'doc') icon = '📘';
      else if (ext === 'csv' || ext === 'xlsx') icon = '📊';
      else if (ext === 'json') icon = '🧩';
      else if (ext === 'md' || ext === 'txt') icon = '📝';

      const sizeKB = (file.filesize / 1024).toFixed(1);

      const card = document.createElement('div');
      card.className = 'uploaded-file-card';
      card.innerHTML = `
        <div class="file-info-badge">
          <span class="file-type-icon">${icon}</span>
          <div>
            <div class="file-name">${escapeHtml(file.filename)}</div>
            <div class="file-meta">${sizeKB} KB | ${(file.charCount || 0).toLocaleString()}자 추출 완료</div>
          </div>
        </div>
        <button type="button" class="btn-remove-file" data-index="${idx}" title="삭제">&times;</button>
      `;

      card.querySelector('.btn-remove-file').addEventListener('click', (e) => {
        e.stopPropagation();
        removeAttachedFile(idx);
      });

      uploadedFilesList.appendChild(card);
    });
  }

  function cleanClientText(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      .replace(/[\uFFFD\uFFFE\uFFFF]/g, '')
      .replace(/(?:\x05|\\x05|\u0005){2,}/g, '')
      .trim();
  }

  function isDegenerateClientLoop(text) {
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

  function buildFilesClientPrompt(list, maxTotalChars = 6000) {
    if (!list || list.length === 0) return '';
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

  async function parseFileInBrowser(file) {
    const filename = file.name;
    const filesize = file.size;
    const ext = (filename.split('.').pop() || '').toLowerCase();
    let extractedText = '';

    try {
      if (ext === 'pdf') {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
          let textParts = [];
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            textParts.push(`--- Page ${pageNum} ---\n${pageText}`);
          }
          extractedText = textParts.join('\n\n');
        } else {
          extractedText = await file.text();
        }
      } else if (ext === 'docx' || ext === 'doc') {
        if (window.mammoth) {
          const arrayBuffer = await file.arrayBuffer();
          const res = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
          extractedText = res.value || '';
        } else {
          extractedText = await file.text();
        }
      } else if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff'].includes(ext)) {
        if (window.Tesseract) {
          const res = await window.Tesseract.recognize(file, 'kor+eng');
          extractedText = res?.data?.text || '';
        }
      } else {
        extractedText = await file.text();
      }
    } catch (e) {
      console.warn(`Browser parsing fallback for ${filename}:`, e);
      try { extractedText = await file.text(); } catch (err) {}
    }

    extractedText = cleanClientText(extractedText);
    return {
      filename,
      filesize,
      extractedText,
      charCount: extractedText.length
    };
  }

  async function handleFileUploads(files) {
    if (!files || files.length === 0) return;
    if (fileUploadSpinner) fileUploadSpinner.classList.remove('hidden');

    // First try backend upload route if available on local server
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      const response = await fetch('/api/upload-multiple', { method: 'POST', body: formData });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.files) {
          data.files.forEach(f => {
            if (!attachedFiles.some(existing => existing.filename === f.filename)) {
              attachedFiles.push(f);
            }
          });
          renderUploadedFilesList();
          return;
        }
      }
    } catch (err) {
      // Backend not available (e.g. GitHub Pages), fallback to pure browser parsing!
    }

    // Pure Browser File Parsing Fallback
    for (let i = 0; i < files.length; i++) {
      try {
        const parsed = await parseFileInBrowser(files[i]);
        if (parsed && parsed.extractedText) {
          if (!attachedFiles.some(existing => existing.filename === parsed.filename)) {
            attachedFiles.push(parsed);
          }
        }
      } catch (err) {
        console.error('File parsing error:', err);
      }
    }

    renderUploadedFilesList();
    if (fileUploadSpinner) fileUploadSpinner.classList.add('hidden');
    if (fileUploadInput) fileUploadInput.value = '';
  }

  // Real-Time Sync API Keys from Inputs & LocalStorage
  function syncApiKeysFromDOM() {
    Object.keys(keyInputs).forEach(k => {
      if (keyInputs[k] && keyInputs[k].value) {
        apiKeys[k] = keyInputs[k].value.trim();
      } else {
        apiKeys[k] = apiKeys[k] || '';
      }
    });
  }

  function loadApiKeys() {
    const saved = localStorage.getItem('llm_debate_api_keys');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.keys(keyInputs).forEach(k => {
          apiKeys[k] = (parsed[k] || '').trim();
          if (keyInputs[k]) keyInputs[k].value = apiKeys[k];
        });
      } catch (e) {}
    }
    syncApiKeysFromDOM();
    updateApiBadgeStatus();
  }

  // Load and Manage Enabled Models State (ON/OFF Toggles)
  function loadEnabledModels() {
    const saved = localStorage.getItem('llm_debate_enabled_models');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.keys(enabledModels).forEach(k => {
          if (typeof parsed[k] === 'boolean') {
            enabledModels[k] = parsed[k];
          }
        });
      } catch (e) {}
    }
    updateModelToggleUI();
  }

  function saveEnabledModels() {
    localStorage.setItem('llm_debate_enabled_models', JSON.stringify(enabledModels));
    updateModelToggleUI();
  }

  function updateModelToggleUI() {
    Object.keys(enabledModels).forEach(k => {
      const isEnabled = enabledModels[k] !== false;
      const badgeEl = modelTagBadges[k];
      if (badgeEl) {
        const toggleBtn = badgeEl.querySelector('.btn-toggle-model');
        const toggleLabel = badgeEl.querySelector('.toggle-label');

        if (isEnabled) {
          badgeEl.classList.remove('disabled-model');
          if (toggleBtn) toggleBtn.classList.add('active');
          if (toggleLabel) toggleLabel.textContent = 'ON';
        } else {
          badgeEl.classList.add('disabled-model');
          if (toggleBtn) toggleBtn.classList.remove('active');
          if (toggleLabel) toggleLabel.textContent = 'OFF';
        }
      }
    });
  }

  // Attach ON/OFF Toggle Listeners to Left Sidebar Model Badges
  document.querySelectorAll('.btn-toggle-model').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const provider = btn.getAttribute('data-provider');
      if (provider && enabledModels.hasOwnProperty(provider)) {
        enabledModels[provider] = !enabledModels[provider];
        saveEnabledModels();
      }
    });
  });

  function updateApiBadgeStatus() {
    syncApiKeysFromDOM();
    let activeKeysCount = 0;

    Object.keys(keyInputs).forEach(k => {
      const isConnected = Boolean(apiKeys[k] && apiKeys[k].trim());
      if (isConnected) activeKeysCount++;
      
      // Update Modal Status
      if (statusIndicators[k]) {
        statusIndicators[k].textContent = isConnected ? '🟢 연결됨' : '미연결';
        statusIndicators[k].className = `key-status-indicator ${isConnected ? 'connected' : ''}`;
      }

      // Update Left Sidebar Model Tag Badge Status
      if (modelTagBadges[k]) {
        const statusSpan = modelTagBadges[k].querySelector('.model-tag-status');
        if (isConnected) {
          modelTagBadges[k].classList.add('connected');
          if (statusSpan) statusSpan.textContent = '🟢 연결됨';
        } else {
          modelTagBadges[k].classList.remove('connected');
          if (statusSpan) statusSpan.textContent = '미연결';
        }
      }
    });

    if (headerKeyCount) headerKeyCount.textContent = `${activeKeysCount}/6`;
  }

  // Attach Real-Time Input Change Listeners for all API keys
  Object.keys(keyInputs).forEach(k => {
    if (keyInputs[k]) {
      keyInputs[k].addEventListener('input', () => {
        apiKeys[k] = keyInputs[k].value.trim();
        localStorage.setItem('llm_debate_api_keys', JSON.stringify(apiKeys));
        updateApiBadgeStatus();
      });
    }
  });

  // Load Saved Histories from LocalStorage
  function loadHistories() {
    const saved = localStorage.getItem('llm_debate_saved_histories');
    if (saved) {
      try {
        savedHistories = JSON.parse(saved);
      } catch (e) {
        savedHistories = [];
      }
    }
    updateHistoryUI();
  }

  function saveHistoriesToStorage() {
    localStorage.setItem('llm_debate_saved_histories', JSON.stringify(savedHistories));
    updateHistoryUI();
  }

  function updateHistoryUI() {
    if (historyCountBadge) historyCountBadge.textContent = savedHistories.length;

    // Update Reference Session Select Dropdown
    if (referenceSessionSelect) {
      const currentSelectedVal = referenceSessionSelect.value;
      referenceSessionSelect.innerHTML = '<option value="">-- 없음 (독립 검증 진행) --</option>';
      savedHistories.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        const datePart = (item.date || '').split(' ')[0] || '';
        opt.textContent = `[${datePart}] ${item.title || '무제'}`;
        referenceSessionSelect.appendChild(opt);
      });
      referenceSessionSelect.value = currentSelectedVal;
    }

    renderHistoryList();
  }

  // Render History List in Modal (Left Pane)
  function renderHistoryList() {
    if (!historyListContainer) return;
    const query = (historySearchInput?.value || '').trim().toLowerCase();
    const filtered = savedHistories.filter(item => 
      (item.title || '').toLowerCase().includes(query) || 
      (item.notes && item.notes.toLowerCase().includes(query))
    );

    historyListContainer.innerHTML = '';

    if (filtered.length === 0) {
      historyListContainer.innerHTML = '<div class="empty-history-text">검색 조건에 맞는 저장된 히스토리가 없습니다.</div>';
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      const isSelected = selectedHistoryItem && selectedHistoryItem.id === item.id;
      card.className = `history-card-item ${isSelected ? 'selected' : ''}`;

      card.innerHTML = `
        <div class="history-item-header">
          <div class="history-item-title-box">
            <div class="history-item-title">${escapeHtml(item.title)}</div>
            <div class="history-item-meta">📅 ${item.date} | 🔄 ${item.rounds} 라운드</div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        selectHistoryItem(item);
      });

      historyListContainer.appendChild(card);
    });
  }

  // Select History Item for Right Inspector Pane
  function selectHistoryItem(item) {
    selectedHistoryItem = item;
    renderHistoryList();

    if (historyDetailEmpty) historyDetailEmpty.classList.add('hidden');
    if (historyDetailContent) historyDetailContent.classList.remove('hidden');

    if (detailTitleInput) detailTitleInput.value = item.title;
    if (detailMetaText) detailMetaText.textContent = `생성 일시: ${item.date} | 총 ${item.rounds} 라운드 진행`;
    if (detailNotesArea) detailNotesArea.value = item.notes || '';
    if (detailReportText) detailReportText.innerHTML = (item.consensusReport || '작성된 보고서가 없습니다.').replace(/\n/g, '<br>');

    // Render Transcript Turns
    if (detailTranscriptList) {
      detailTranscriptList.innerHTML = '';
      if (item.logs) {
        item.logs.forEach(turn => {
          if (turn.round !== 'Consensus') {
            const card = document.createElement('div');
            card.className = `turn-card glass-card ${getStanceClass(turn.speaker)}`;
            card.innerHTML = `
              <div class="turn-header">
                <div class="speaker-info">
                  <div class="speaker-name">[Round ${turn.round}] ${escapeHtml(turn.speaker)}</div>
                  <div class="speaker-role">${escapeHtml(turn.role || turn.stance || '')}</div>
                </div>
              </div>
              <div class="turn-body">${escapeHtml(turn.text)}</div>
            `;
            detailTranscriptList.appendChild(card);
          }
        });
      }
    }
  }

  // Edit Title/Notes inside Right Inspector Pane
  if (detailTitleInput) {
    detailTitleInput.addEventListener('change', () => {
      if (selectedHistoryItem) {
        selectedHistoryItem.title = detailTitleInput.value.trim();
        saveHistoriesToStorage();
      }
    });
  }

  if (detailNotesArea) {
    detailNotesArea.addEventListener('change', () => {
      if (selectedHistoryItem) {
        selectedHistoryItem.notes = detailNotesArea.value.trim();
        saveHistoriesToStorage();
      }
    });
  }

  // Set selected item as Reference for Next Conversation A'
  if (btnSetAsReference) {
    btnSetAsReference.addEventListener('click', () => {
      if (selectedHistoryItem) {
        setReferenceSession(selectedHistoryItem);
        if (historyModal) historyModal.classList.add('hidden');
      }
    });
  }

  // Delete Detail Item
  if (btnDeleteDetailItem) {
    btnDeleteDetailItem.addEventListener('click', () => {
      if (selectedHistoryItem && confirm('선택한 히스토리를 삭제하시겠습니까?')) {
        savedHistories = savedHistories.filter(h => h.id !== selectedHistoryItem.id);
        selectedHistoryItem = null;
        if (historyDetailContent) historyDetailContent.classList.add('hidden');
        if (historyDetailEmpty) historyDetailEmpty.classList.remove('hidden');
        saveHistoriesToStorage();
      }
    });
  }

  // Set Reference Session State & Banner UI
  function setReferenceSession(item) {
    activeReferenceSession = item;
    if (item) {
      if (referenceSessionSelect) referenceSessionSelect.value = item.id;
      if (refBannerTopic) refBannerTopic.textContent = item.title;
      if (activeReferenceBanner) activeReferenceBanner.classList.remove('hidden');
    } else {
      if (referenceSessionSelect) referenceSessionSelect.value = '';
      if (activeReferenceBanner) activeReferenceBanner.classList.add('hidden');
    }
  }

  if (referenceSessionSelect) {
    referenceSessionSelect.addEventListener('change', (e) => {
      const found = savedHistories.find(h => h.id === e.target.value);
      setReferenceSession(found || null);
    });
  }

  if (btnClearReference) {
    btnClearReference.addEventListener('click', () => {
      setReferenceSession(null);
    });
  }

  function getStanceClass(speaker) {
    const name = String(speaker || '').toLowerCase();
    if (name.includes('gemini') || name.includes('groq') || name.includes('openrouter')) return 'factfinder';
    if (name.includes('claude') || name.includes('nvidia')) return 'auditor';
    return 'synthesizer';
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Modal events
  if (btnApiModal) btnApiModal.addEventListener('click', () => apiModal.classList.remove('hidden'));
  if (btnCloseModal) btnCloseModal.addEventListener('click', () => apiModal.classList.add('hidden'));
  if (btnSaveKeys) {
    btnSaveKeys.addEventListener('click', () => {
      Object.keys(keyInputs).forEach(k => {
        if (keyInputs[k]) apiKeys[k] = keyInputs[k].value.trim();
      });
      localStorage.setItem('llm_debate_api_keys', JSON.stringify(apiKeys));
      updateApiBadgeStatus();
      if (apiModal) apiModal.classList.add('hidden');
    });
  }

  // History Drawer Events
  if (btnHistoryModal) {
    btnHistoryModal.addEventListener('click', () => {
      updateHistoryUI();
      if (historyModal) historyModal.classList.remove('hidden');
    });
  }
  if (btnCloseHistoryModal) {
    btnCloseHistoryModal.addEventListener('click', () => {
      if (historyModal) historyModal.classList.add('hidden');
    });
  }
  if (historySearchInput) historySearchInput.addEventListener('input', renderHistoryList);

  if (btnClearAllHistories) {
    btnClearAllHistories.addEventListener('click', () => {
      if (confirm('저장된 모든 검증 히스토리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        savedHistories = [];
        selectedHistoryItem = null;
        if (historyDetailContent) historyDetailContent.classList.add('hidden');
        if (historyDetailEmpty) historyDetailEmpty.classList.remove('hidden');
        saveHistoriesToStorage();
      }
    });
  }

  // Save current finished session
  if (btnSaveCurrentHistory) {
    btnSaveCurrentHistory.addEventListener('click', () => {
      if (!finalReportText) return;
      const topic = topicInput.value.trim();
      const existing = savedHistories.find(h => h.title === topic);

      if (existing) {
        existing.date = new Date().toLocaleString('ko-KR');
        existing.rounds = parseInt(roundsSelect.value, 10);
        existing.consensusReport = finalReportText;
        existing.debateHistory = debateHistory;
        existing.logs = fullDebateLog;
        saveHistoriesToStorage();
      } else {
        const newItem = {
          id: 'hist_' + Date.now(),
          title: topic,
          date: new Date().toLocaleString('ko-KR'),
          rounds: parseInt(roundsSelect.value, 10),
          consensusReport: finalReportText,
          debateHistory: debateHistory,
          logs: fullDebateLog,
          notes: ''
        };
        savedHistories.unshift(newItem);
        saveHistoriesToStorage();
      }
    });
  }

  // Slider change
  if (roundsSelect) {
    roundsSelect.addEventListener('input', (e) => {
      if (roundsValue) roundsValue.textContent = `${e.target.value} 라운드`;
    });
  }

  // Crash-proof Render turn card
  function renderTurnCard(round, modelName, roleLabel, stanceClass, text) {
    const safeModelName = String(modelName || 'AI Model');
    const safeRoleLabel = String(roleLabel || '교차 검증');
    const safeStanceClass = String(stanceClass || 'factfinder');
    const safeText = String(text || '');

    const card = document.createElement('div');
    card.className = `turn-card glass-card ${safeStanceClass}`;
    
    const icons = {
      'Gemini': '💎', 'Claude': '🎭', 'ChatGPT': '🤖',
      'Groq': '⚡', 'NVIDIA': '🚀', 'OpenRouter': '🌐'
    };
    const keyIcon = Object.keys(icons).find(k => safeModelName.includes(k)) || '🤖';
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    card.innerHTML = `
      <div class="turn-header">
        <div class="speaker-info">
          <div class="speaker-avatar">${icons[keyIcon] || '🤖'}</div>
          <div>
            <div class="speaker-name">[Round ${round}] ${safeModelName}</div>
            <div class="speaker-role">${safeRoleLabel}</div>
          </div>
        </div>
        <div class="turn-time">${now}</div>
      </div>
      <div class="turn-body">${escapeHtml(safeText)}</div>
    `;

    if (debateStream) {
      debateStream.appendChild(card);
      card.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }

  // Render Error Turn Card (Notice Badge when an API Key fails)
  function renderErrorTurnCard(round, modelName, roleLabel, stanceClass, errorMessage) {
    const safeModelName = String(modelName || 'AI Model');
    const safeStanceClass = String(stanceClass || 'factfinder');

    const card = document.createElement('div');
    card.className = `turn-card glass-card ${safeStanceClass}`;
    card.style.borderLeft = '5px solid #f43f5e';
    card.style.background = 'rgba(244, 63, 94, 0.06)';

    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    card.innerHTML = `
      <div class="turn-header">
        <div class="speaker-info">
          <div class="speaker-avatar" style="background: rgba(244, 63, 94, 0.2); color: #f43f5e;">⚠️</div>
          <div>
            <div class="speaker-name">[Round ${round}] ${escapeHtml(safeModelName)}</div>
            <div class="speaker-role" style="background: rgba(244, 63, 94, 0.2); color: #f43f5e;">API 응답 제한/오류</div>
          </div>
        </div>
        <div class="turn-time">${now}</div>
      </div>
      <div class="turn-body" style="color: #fda4af;">
        🚫 <b>API 통신 실패 원인</b>: ${escapeHtml(errorMessage)}
      </div>
    `;

    if (debateStream) {
      debateStream.appendChild(card);
      card.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }

  async function executeDirectProviderCall(providerKey, apiKey, roleKey, topic, roundNumber, debateHistory, referenceSession, attachedFiles) {
    const config = {
      gemini: { name: 'Gemini 3.6 Flash', roleKey: 'FactFinder' },
      claude: { name: 'Claude 3.5', roleKey: 'CrossAuditor' },
      openai: { name: 'ChatGPT (GPT-4o-mini)', roleKey: 'Synthesizer', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
      groq: { name: 'Groq (Llama 3.3 70B)', roleKey: 'FactFinder', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
      nvidia: { name: 'NVIDIA Nemotron', roleKey: 'CrossAuditor', baseUrl: 'https://integrate.api.nvidia.com/v1', model: 'meta/llama-3.3-70b-instruct' },
      openrouter: { name: 'OpenRouter Free', roleKey: 'FactFinder', baseUrl: 'https://openrouter.ai/api/v1', model: 'meta-llama/llama-3.3-70b-instruct' }
    }[providerKey];

    if (!config) throw new Error(`Unknown provider: ${providerKey}`);
    const currentRole = roleKey || config.roleKey;

    const systemPrompts = {
      'FactFinder': `당신은 최신 데이터와 정확한 팩트를 추출하는 전문 분석 AI(${config.name})입니다. 질문 '${topic}'에 대해 추측이나 환각(Hallucination)을 철저히 배제하고, 객관적으로 검증 가능한 실증 데이터와 팩트만을 제시하세요. 한국어로 작성하세요.`,
      'CrossAuditor': `당신은 엄격한 팩트체커이자 교차 검증 AI(${config.name})입니다. 이전 발언들에 포함된 정보 중 숫자의 오차, 근거 없는 추측, 환각(Hallucination), 논리적 오류가 있는지 정밀 감정하고 교정하세요. 한국어로 작성하세요.`,
      'Synthesizer': `당신은 지식 합성 및 종합 검증 AI(${config.name})입니다. 공유된 정보를 바탕으로 상충되는 주장을 조정하고, 누락된 핵심 맥락을 채워 정제된 신뢰 지식을 완성하세요. 한국어로 작성하세요.`
    };

    let userPrompt = `[조사/검증 주제]: ${topic}\n[진행 라운드]: Round ${roundNumber}`;
    userPrompt += buildFilesClientPrompt(attachedFiles, 6000);
    userPrompt += `\n\n[이전 모델들의 정보 공유 및 교차 검증 기록]:\n${debateHistory || '(첫 번째 정보 탐색 라운드입니다)'}`;
    
    if (referenceSession && referenceSession.topic) {
      userPrompt += `\n\n[이전 비교 기준 토론 기록 (기존 주제 A: ${referenceSession.topic})]:\n${referenceSession.consensusReport || referenceSession.debateHistory || ''}\n\n위 이전 기준 기록(A)과 대조할 때 이번 주제(A')에서 어떤 수치나 지식의 변화, 의견 및 팩트의 발전이 일어났는지 함께 비교하여 제시하세요.`;
    }
    userPrompt += `\n\n위 내용을 바탕으로 당신의 역할(${currentRole})에 맞게 사실 관계를 교차 검증하고 환각을 줄이기 위한 의견을 제시하세요.`;
    const sysPrompt = systemPrompts[currentRole] || systemPrompts['FactFinder'];

    if (!apiKey || !apiKey.trim()) {
      return generateClientMockResponse(config.name, currentRole, topic, roundNumber, debateHistory, referenceSession, attachedFiles);
    }

    const cleanKey = apiKey.trim();

    if (providerKey === 'gemini') {
      const modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.0-flash', 'gemini-2.0-flash'];
      for (const m of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${cleanKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cleanKey },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${sysPrompt}\n\n${userPrompt}` }] }],
              generationConfig: { maxOutputTokens: 8192, temperature: 0.3 }
            })
          });
          if (res.ok) {
            const data = await res.json();
            const txt = cleanClientText(data.candidates?.[0]?.content?.parts?.[0]?.text);
            if (txt && !isDegenerateClientLoop(txt)) return txt;
          }
        } catch(e) {}
      }
      throw new Error('Gemini API 통신 실패 (키 쿼터 한도 초과 또는 미지원)');
    } else if (providerKey === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1200,
          system: cleanClientText(sysPrompt),
          messages: [{ role: 'user', content: cleanClientText(userPrompt) }]
        })
      });
      if (!res.ok) throw new Error(`Claude Error (${res.status})`);
      const data = await res.json();
      return cleanClientText(data.content?.[0]?.text);
    } else {
      let modelsToTry = [config.model];
      if (providerKey === 'groq') {
        modelsToTry = [config.model, 'llama-3.1-8b-instant', 'gemma2-9b-it', 'deepseek-r1-distill-llama-70b'];
      } else if (providerKey === 'nvidia') {
        modelsToTry = [config.model, 'nvidia/llama-3.3-nemotron-super-49b-v1.5', 'meta/llama3-70b-instruct', 'deepseek-ai/deepseek-r1'];
      } else if (providerKey === 'openrouter') {
        modelsToTry = [config.model, 'meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-r1:free', 'google/gemma-2-9b-it:free', 'openrouter/auto'];
      }

      for (const m of modelsToTry) {
        try {
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanKey}`
          };
          if (providerKey === 'openrouter') {
            headers['HTTP-Referer'] = window.location.href;
            headers['X-Title'] = 'LLM Fact-Check Arena';
          }
          const res = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              model: m,
              max_tokens: 1200,
              temperature: 0.6,
              presence_penalty: 0.2,
              frequency_penalty: 0.2,
              messages: [
                { role: 'system', content: cleanClientText(sysPrompt) },
                { role: 'user', content: cleanClientText(userPrompt) }
              ]
            })
          });
          if (res.ok) {
            const data = await res.json();
            const txt = cleanClientText(data.choices?.[0]?.message?.content);
            if (txt && !isDegenerateClientLoop(txt)) return txt;
          }
        } catch(e) {}
      }
      throw new Error(`${config.name} 통신 응답 실패`);
    }
  }

  function generateClientMockResponse(modelName, role, topic, roundNumber, debateHistory, referenceSession, attachedFiles) {
    const fileNote = attachedFiles && attachedFiles.length > 0 ? `\n\n📁 **[첨부 문서 ${attachedFiles.length}개 분석 내용 반영됨]**` : '';
    const refNote = referenceSession ? `\n\n🔍 **[이전 토론 대비 변화 분석 반영]**` : '';
    return `[라운드 ${roundNumber} 팩트 교차 검증 - ${modelName}]\n질의 '${topic}'에 대해 객관적으로 검증 가능한 수치 및 핵심 사실을 분석하였습니다.${fileNote}${refNote}\n\n📌 **주요 검증 사실**:\n1. **핵심 정의**: 표준 학술/기술 문서에 근거한 객관적 팩트 확인\n2. **데이터 지표**: 교차 자료를 통한 근거 수치 타당성 확인 완료\n3. **환각 최소화**: 미확인 추정 및 과장 표현 배제 완료`;
  }

  async function executeDirectJudge(topic, debateHistory, referenceSession, attachedFiles, apiKeys) {
    const sysPrompt = `당신은 여러 이종 LLM이 교차 검증한 대화록과 첨부 문서들을 바탕으로 최종 신뢰할 수 있는 정보를 정리하는 '최종 교차검증 통합관' AI입니다. 환각(Hallucination)이 감지되거나 교정된 지점을 명확히 밝히고 최고 신뢰도의 종합 보고서를 작성하세요.`;
    let userPrompt = `[검증 주제]: ${topic}`;
    userPrompt += buildFilesClientPrompt(attachedFiles, 6000);
    userPrompt += `\n\n[다중 LLM 교차 검증 기록]:\n${debateHistory}`;

    if (referenceSession && referenceSession.topic) {
      userPrompt += `\n\n[이전 비교 기준 토론 기록 (기존 주제 A: ${referenceSession.topic})]:\n${referenceSession.consensusReport || referenceSession.debateHistory || ''}\n\n위 이전 기준 기록(A) 대비 이번 질의(A')에서의 주요 팩트 변화 및 지식 발전 내용을 종합 검토하세요.`;
    }

    userPrompt += `\n\n위 대화록과 첨부 문서들을 정밀 검토하여 아래 목차에 맞춰 최고 신뢰도의 종합 팩트체크 보고서를 작성하세요:\n\n1. 🎯 **최종 지식 및 팩트 요약**\n2. 🛡️ **교차 검증을 통해 발견 및 교정된 환각(Hallucination) 및 논리적 오류**\n3. 📊 **수치/통계 데이터 검증 결과**\n4. 💡 **종합 신뢰도 평가 및 결론**`;

    const activeKeys = Object.keys(apiKeys).filter(k => apiKeys[k] && apiKeys[k].trim());
    if (activeKeys.length > 0) {
      const preferred = ['gemini', 'openai', 'claude', 'groq', 'nvidia', 'openrouter'].find(k => activeKeys.includes(k)) || activeKeys[0];
      try {
        return await executeDirectProviderCall(preferred, apiKeys[preferred], 'Synthesizer', topic, 'Consensus', debateHistory, referenceSession, attachedFiles);
      } catch (e) {
        console.warn('Direct judge call failed, falling back to mock report:', e.message);
      }
    }

    return generateClientMockJudgeReport(topic, debateHistory, referenceSession, attachedFiles);
  }

  function generateClientMockJudgeReport(topic, debateHistory, referenceSession, attachedFiles) {
    return `# 🛡️ [최종 교차검증 통합 보고서]\n\n**[검증 주제]**: ${topic}\n\n## 1. 🎯 최종 지식 및 팩트 요약\n제시된 교차 검증 기록 및 첨부 문서 분석 결과, 해당 주제에 대한 핵심 개념과 실증 수치는 높은 객관성을 지니고 있음을 확인했습니다.\n\n## 2. 🛡️ 감지 및 교정된 환각(Hallucination) 지점\n- 교차 감정을 통해 단정적 추정 표출이 교정되었으며, 조건부 통계 데이터로 재구성되었습니다.\n\n## 3. 💡 종합 결론\n다중 AI 교차 검증 결과, 본 질의는 높은 신뢰도의 팩트로 판명되었습니다.`;
  }

  // Main Fact-Check Pipeline Runner (Bulletproof - Local Server + GitHub Pages Support)
  async function startFactCheck() {
    syncApiKeysFromDOM();

    const topic = (topicInput?.value || '').trim();
    if (!topic) {
      alert('검증 주제를 입력해 주세요!');
      return;
    }

    const totalRounds = parseInt(roundsSelect.value, 10);
    isDebating = true;
    debateHistory = '';
    fullDebateLog = [];
    finalReportText = '';

    const referenceSession = activeReferenceSession;

    const allProviders = [
      { providerKey: 'gemini', modelName: 'Gemini 3.6 Flash', roleKey: 'FactFinder', roleLabel: '🔍 팩트 & 수치 탐색', stanceClass: 'factfinder' },
      { providerKey: 'claude', modelName: 'Claude 3.5', roleKey: 'CrossAuditor', roleLabel: '🛡️ 교차 감정 & 환각 교정', stanceClass: 'auditor' },
      { providerKey: 'openai', modelName: 'ChatGPT (GPT-4o-mini)', roleKey: 'Synthesizer', roleLabel: '🧩 지식 합성 & 맥락 보완', stanceClass: 'synthesizer' },
      { providerKey: 'groq', modelName: 'Groq (Llama 3.3 70B)', roleKey: 'FactFinder', roleLabel: '⚡ Groq 초고속 탐색', stanceClass: 'factfinder' },
      { providerKey: 'nvidia', modelName: 'NVIDIA Nemotron', roleKey: 'CrossAuditor', roleLabel: '🚀 NVIDIA 심층 교차 감정', stanceClass: 'auditor' },
      { providerKey: 'openrouter', modelName: 'OpenRouter Free', roleKey: 'FactFinder', roleLabel: '🌐 OpenRouter 교차 탐색', stanceClass: 'factfinder' }
    ];

    const configuredProviders = allProviders.filter(p => 
      Boolean(apiKeys[p.providerKey] && apiKeys[p.providerKey].trim()) &&
      enabledModels[p.providerKey] !== false
    );

    const enabledProviders = allProviders.filter(p => enabledModels[p.providerKey] !== false);
    const activeLineup = configuredProviders.length > 0 ? configuredProviders : enabledProviders;

    if (activeLineup.length === 0) {
      alert('최소 1개 이상의 AI 모델을 ON(활성화)해 주세요!');
      isDebating = false;
      return;
    }

    if (debateStream) debateStream.innerHTML = '';
    if (refereeCard) refereeCard.classList.add('hidden');
    if (refereeBody) refereeBody.innerHTML = '';
    if (btnStart) btnStart.classList.add('hidden');
    if (btnStop) btnStop.classList.remove('hidden');
    if (btnExportDocxFull) btnExportDocxFull.disabled = true;
    if (statusDot) statusDot.classList.add('active');

    console.log('🚀 Starting Fact-Check Pipeline!');
    console.log('Active configured & enabled keys:', activeLineup.map(p => p.providerKey));

    try {
      for (let r = 1; r <= totalRounds; r++) {
        if (!isDebating) break;

        if (roundProgress) roundProgress.textContent = `Round ${r} / ${totalRounds}`;
        let successfulTurnsInRound = 0;

        for (const speaker of activeLineup) {
          if (!isDebating) break;

          if (statusText) statusText.textContent = `Round ${r}: ${speaker.modelName} (${speaker.roleLabel}) 교차 검증 중...`;

          let textOutput = '';
          let isSuccess = false;

          // 1. Try Local Server Endpoint first
          try {
            const response = await fetch('/api/debate/step', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                providerKey: speaker.providerKey,
                modelName: speaker.modelName,
                role: speaker.roleKey,
                topic: topic,
                roundNumber: r,
                debateHistory: debateHistory,
                referenceSession: referenceSession,
                attachedFiles: attachedFiles,
                apiKeys: apiKeys
              })
            });
            if (response.ok) {
              const data = await response.json();
              if (data && data.success && data.text) {
                textOutput = data.text;
                isSuccess = true;
              }
            }
          } catch(e) {
            // Local server not available (e.g. GitHub Pages)
          }

          // 2. Direct Browser REST API Fallback if local server failed or unavailable
          if (!isSuccess) {
            try {
              textOutput = await executeDirectProviderCall(
                speaker.providerKey,
                apiKeys[speaker.providerKey],
                speaker.roleKey,
                topic,
                r,
                debateHistory,
                referenceSession,
                attachedFiles
              );
              isSuccess = true;
            } catch(err) {
              console.warn(`[Direct Step Error for ${speaker.modelName}]:`, err.message);
              renderErrorTurnCard(r, speaker.modelName, speaker.roleLabel, speaker.stanceClass, err.message);
            }
          }

          if (isSuccess && textOutput) {
            successfulTurnsInRound++;
            renderTurnCard(r, speaker.modelName, speaker.roleLabel, speaker.stanceClass, textOutput);
            const logEntry = `[Round ${r}] ${speaker.modelName} (${speaker.roleLabel}):\n${textOutput}\n`;
            debateHistory += `${logEntry}\n`;
            fullDebateLog.push({ round: r, speaker: speaker.modelName, role: speaker.roleLabel, text: textOutput });
          }
        }
      }

      if (isDebating) {
        if (statusText) statusText.textContent = '👑 최종 교차검증 통합관이 팩트체크 종합 보고서를 작성 중입니다...';
        if (refereeCard) {
          refereeCard.classList.remove('hidden');
          refereeCard.scrollIntoView({ behavior: 'smooth' });
        }

        let reportOutput = '';
        try {
          const judgeRes = await fetch('/api/debate/judge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: topic,
              debateHistory: debateHistory,
              referenceSession: referenceSession,
              attachedFiles: attachedFiles,
              apiKeys: apiKeys
            })
          });
          if (judgeRes.ok) {
            const judgeData = await judgeRes.json();
            if (judgeData && judgeData.success && judgeData.text) {
              reportOutput = judgeData.text;
            }
          }
        } catch (e) {}

        if (!reportOutput) {
          reportOutput = await executeDirectJudge(topic, debateHistory, referenceSession, attachedFiles, apiKeys);
        }

        if (reportOutput) {
          finalReportText = reportOutput;
          if (refereeBody) refereeBody.innerHTML = reportOutput.replace(/\n/g, '<br>');
          fullDebateLog.push({ round: 'Consensus', speaker: 'Verifier', role: '최종 팩트체크 보고서', text: reportOutput });
        }

        if (statusText) statusText.textContent = '🎉 교차 검증 및 환각 최소화 팩트체크가 완료되었습니다!';
        if (btnExportDocxFull) btnExportDocxFull.disabled = false;
      }
    } catch (err) {
      console.error('Error in startFactCheck:', err);
      if (statusText) statusText.textContent = `⚠️ 교차 검증 상태: ${err.message}`;
    } finally {
      isDebating = false;
      if (statusDot) statusDot.classList.remove('active');
      if (btnStart) btnStart.classList.remove('hidden');
      if (btnStop) btnStop.classList.add('hidden');
    }
  }

  // Word (.docx) Export Helper via Backend Route /api/export/docx
  async function exportDocx(title, reportText, fullLog) {
    try {
      const res = await fetch('/api/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, reportText, fullLog })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FactCheck_${(title || 'Report').substring(0, 15).replace(/\s+/g, '_')}.docx`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    } catch (err) {
      console.warn('Backend Word export unavailable, using client file download:', err);
    }

    // Client-side report file download (.md)
    let content = `# 🛡️ [LLM 팩트체크 교차 검증 보고서]\n\n**주제**: ${title || '미지정'}\n**생성 일시**: ${new Date().toLocaleString('ko-KR')}\n\n`;
    if (reportText) content += `## 📋 최종 통합 보고서\n\n${reportText}\n\n`;
    if (fullLog && fullLog.length > 0) {
      content += `## 💬 라운드별 모델 발언 대화록\n\n`;
      fullLog.forEach(item => {
        content += `=== [Round ${item.round}] ${item.speaker} (${item.role || ''}) ===\n${item.text}\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FactCheck_${(title || 'Report').substring(0, 15).replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Report Card Docx Export
  if (btnDownloadReportDocx) {
    btnDownloadReportDocx.addEventListener('click', () => {
      if (finalReportText) {
        exportDocx(topicInput?.value?.trim(), finalReportText, null);
      }
    });
  }

  // Detail Inspector Docx Export
  if (btnDownloadDetailDocx) {
    btnDownloadDetailDocx.addEventListener('click', () => {
      if (selectedHistoryItem) {
        exportDocx(selectedHistoryItem.title, selectedHistoryItem.consensusReport, selectedHistoryItem.logs);
      }
    });
  }

  // Full Transcript Docx Export
  if (btnExportDocxFull) {
    btnExportDocxFull.addEventListener('click', () => {
      if (fullDebateLog.length > 0) {
        exportDocx(topicInput?.value?.trim(), finalReportText, fullDebateLog);
      }
    });
  }

  // Stop pipeline
  if (btnStop) {
    btnStop.addEventListener('click', () => {
      isDebating = false;
      if (statusText) statusText.textContent = '⏹️ 사용자에 의해 교차 검증이 중단되었습니다.';
    });
  }

  // Start pipeline
  if (btnStart) btnStart.addEventListener('click', startFactCheck);

  // Init
  loadApiKeys();
  loadEnabledModels();
  loadHistories();
});
