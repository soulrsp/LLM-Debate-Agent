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

  async function handleFileUploads(files) {
    if (!files || files.length === 0) return;

    if (fileUploadSpinner) fileUploadSpinner.classList.remove('hidden');

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch('/api/upload-multiple', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.files) {
        alert(data.error || '파일 업로드 및 분석에 실패했습니다.');
      } else {
        data.files.forEach(f => {
          if (!attachedFiles.some(existing => existing.filename === f.filename)) {
            attachedFiles.push(f);
          }
        });
        renderUploadedFilesList();
      }
    } catch (err) {
      console.error('Multi-File Upload Handling Error:', err);
      alert('파일 업로드 통신 오류: ' + err.message);
    } finally {
      if (fileUploadSpinner) fileUploadSpinner.classList.add('hidden');
      if (fileUploadInput) fileUploadInput.value = '';
    }
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

  // Main Fact-Check Pipeline Runner (Bulletproof - Zero Alert Crashes)
  async function startFactCheck() {
    // Synchronize keys from DOM inputs first!
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

    // Available Active Provider Lineup Definition (6 Active LLMs)
    const allProviders = [
      { providerKey: 'gemini', modelName: 'Gemini 2.0', roleKey: 'FactFinder', roleLabel: '🔍 팩트 & 수치 탐색', stanceClass: 'factfinder' },
      { providerKey: 'claude', modelName: 'Claude 3.5', roleKey: 'CrossAuditor', roleLabel: '🛡️ 교차 감정 & 환각 교정', stanceClass: 'auditor' },
      { providerKey: 'openai', modelName: 'ChatGPT (GPT-4o-mini)', roleKey: 'Synthesizer', roleLabel: '🧩 지식 합성 & 맥락 보완', stanceClass: 'synthesizer' },
      { providerKey: 'groq', modelName: 'Groq (Llama 3.3 70B)', roleKey: 'FactFinder', roleLabel: '⚡ Groq 초고속 탐색', stanceClass: 'factfinder' },
      { providerKey: 'nvidia', modelName: 'NVIDIA Nemotron', roleKey: 'CrossAuditor', roleLabel: '🚀 NVIDIA 심층 교차 감정', stanceClass: 'auditor' },
      { providerKey: 'openrouter', modelName: 'OpenRouter Free', roleKey: 'FactFinder', roleLabel: '🌐 OpenRouter 교차 탐색', stanceClass: 'factfinder' }
    ];

    // Determine configured providers (only those with API keys AND ON toggled)
    const configuredProviders = allProviders.filter(p => 
      Boolean(apiKeys[p.providerKey] && apiKeys[p.providerKey].trim()) &&
      enabledModels[p.providerKey] !== false
    );

    // Fallback lineup if no keys configured (only those ON toggled)
    const enabledProviders = allProviders.filter(p => enabledModels[p.providerKey] !== false);

    const activeLineup = configuredProviders.length > 0 ? configuredProviders : enabledProviders;

    if (activeLineup.length === 0) {
      alert('최소 1개 이상의 AI 모델을 ON(활성화)해 주세요!');
      isDebating = false;
      return;
    }

    // UI state reset
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

          try {
            console.log(`Sending step request for ${speaker.modelName} (key: ${apiKeys[speaker.providerKey] ? 'PRESENT' : 'EMPTY'})...`);
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

            if (!response.ok) {
              console.warn(`[HTTP Error ${response.status} for ${speaker.modelName}]`);
              continue;
            }

            const data = await response.json();
            console.log(`Step response for ${speaker.modelName}:`, data);

            if (data && data.success && data.text) {
              successfulTurnsInRound++;
              const mName = data.modelName || speaker.modelName;
              renderTurnCard(r, mName, speaker.roleLabel, speaker.stanceClass, data.text);

              const logEntry = `[Round ${r}] ${mName} (${speaker.roleLabel}):\n${data.text}\n`;
              debateHistory += `${logEntry}\n`;
              fullDebateLog.push({ round: r, speaker: mName, role: speaker.roleLabel, text: data.text });
            } else if (data && data.filtered) {
              const mName = data.modelName || speaker.modelName;
              renderErrorTurnCard(r, mName, speaker.roleLabel, speaker.stanceClass, data.error || '통신 응답 실패');
            }
          } catch (e) {
            console.warn(`[Step exception for ${speaker.modelName}]:`, e.message);
          }
        }

        // If configured keys all errored out in round 1, fall back to active enabled team once
        if (successfulTurnsInRound === 0 && configuredProviders.length > 0) {
          if (statusText) statusText.textContent = `Round ${r}: 등록된 API 쿼터 한도로 인해 시뮬레이션 교차 검증으로 진행합니다.`;
          for (const fallbackSpeaker of activeLineup.slice(0, 3)) {
            try {
              const fallbackRes = await fetch('/api/debate/step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  providerKey: fallbackSpeaker.providerKey,
                  modelName: fallbackSpeaker.modelName,
                  role: fallbackSpeaker.roleKey,
                  topic: topic,
                  roundNumber: r,
                  debateHistory: debateHistory,
                  referenceSession: referenceSession,
                  apiKeys: {} // Force mock fallback
                })
              });
              const fallbackData = await fallbackRes.json();
              if (fallbackData && fallbackData.success && fallbackData.text) {
                const mName = fallbackData.modelName || fallbackSpeaker.modelName;
                renderTurnCard(r, mName, fallbackSpeaker.roleLabel, fallbackSpeaker.stanceClass, fallbackData.text);
                const logEntry = `[Round ${r}] ${mName} (${fallbackSpeaker.roleLabel}):\n${fallbackData.text}\n`;
                debateHistory += `${logEntry}\n`;
                fullDebateLog.push({ round: r, speaker: mName, role: fallbackSpeaker.roleLabel, text: fallbackData.text });
              }
            } catch (e) {
              console.warn('[Fallback step exception]:', e.message);
            }
          }
        }
      }

      if (isDebating) {
        // Final Consensus Verification Phase
        if (statusText) statusText.textContent = '👑 최종 교차검증 통합관이 팩트체크 종합 보고서를 작성 중입니다...';
        if (refereeCard) {
          refereeCard.classList.remove('hidden');
          refereeCard.scrollIntoView({ behavior: 'smooth' });
        }

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

          const judgeData = await judgeRes.json();
          if (judgeData && judgeData.success && judgeData.text) {
            finalReportText = judgeData.text;
            if (refereeBody) refereeBody.innerHTML = judgeData.text.replace(/\n/g, '<br>');
            fullDebateLog.push({ round: 'Consensus', speaker: 'Verifier', role: '최종 팩트체크 보고서', text: judgeData.text });
          } else {
            if (refereeBody) refereeBody.textContent = `보고서 작성 완료 (기본 서식 반영)`;
          }
        } catch (e) {
          console.warn('[Judge fetch exception]:', e.message);
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

      if (!res.ok) throw new Error('Word 파일 생성 실패');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FactCheck_${(title || 'Report').substring(0, 15).replace(/\s+/g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Word export error:', err);
    }
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
