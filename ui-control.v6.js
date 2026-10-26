/* F-Forum v6.0 — UI điều khiển showcase */
(function () {
  const cfg = window.astralDragonCfg || {};
  const statusBadge = document.getElementById('statusBadge');
  const aiStateBadge = document.getElementById('aiStateBadge');
  const vuMonBadge = document.getElementById('vuMonBadge');
  const vuMonBar = document.getElementById('vuMonBar');
  const vuMonProgressText = document.getElementById('vuMonProgressText');
  const forumFocusStatus = document.getElementById('forumFocusStatus');

  setInterval(function () {
    if (window.__astralDragonMode) statusBadge.textContent = 'Engine: ' + window.__astralDragonMode.toUpperCase();
    if (window.__astralDragonState) aiStateBadge.textContent = 'AI: ' + window.__astralDragonState;
    const energy = Math.round(cfg.vuMonEnergy || 0);
    if (vuMonBadge) {
      vuMonBadge.textContent = cfg.dragonAscended ? 'ĐÃ HÓA KIM LONG (100%)' : 'Linh Khí Vũ Môn: ' + energy + '%';
    }
    if (vuMonBar) vuMonBar.style.width = energy + '%';
    if (vuMonProgressText) {
      vuMonProgressText.textContent = cfg.dragonAscended
        ? '100 / 100 — Cá Chép đã Vượt Vũ Môn Hóa Kim Long Trạng Nguyên!'
        : energy + ' / 100 Linh Khí (Double-click hoặc bấm Thả Hạt Tri Thức)';
    }
    if (forumFocusStatus) {
      forumFocusStatus.textContent = cfg.typingFocus
        ? '• Trạng thái: Đang gõ bài (Linh thú tự lùi ra rìa & giảm sáng)'
        : '• Trạng thái đọc bài: Bình thường (Linh thú bơi tự do)';
    }
  }, 200);

  /* ---- Thẻ thơ ---- */
  const ffCardCrest = document.getElementById('ffCardCrest');
  const ffCardPoem = document.getElementById('ffCardPoem');
  const ffCardStamp = document.getElementById('ffCardStamp');
  const btnNextPoem = document.getElementById('btnNextPoem');
  const genderProfileSelect = document.getElementById('genderProfileSelect');
  const fullHolidaySelect = document.getElementById('fullHolidaySelect');

  function syncPoeticCard() {
    const evKey = cfg.eventMode || 'vn_2010';
    let preset = cfg.getEvent ? cfg.getEvent(evKey) : (cfg.presets[evKey] || cfg.presets.normal);
    if (preset.gender === 'female' && cfg.userGender !== 'female') preset = cfg.getEvent('normal');
    const poems = preset.poems || ['Biển học mênh mông rèn chí lớn,<br>Đèn khuya sáng tỏ bậc kỳ tài.'];
    const pIdx = (cfg.poemIdx || 0) % poems.length;
    if (ffCardCrest && cfg.crests[preset.crest]) ffCardCrest.innerHTML = cfg.crests[preset.crest];
    if (ffCardPoem) ffCardPoem.innerHTML = cfg.customWish ? cfg.customWish : poems[pIdx];
    if (ffCardStamp) ffCardStamp.textContent = preset.stamp || 'Kỷ niệm F-Forum';
    if (btnNextPoem) btnNextPoem.textContent = 'Thơ ' + (pIdx + 1) + '/' + poems.length;
    if (fullHolidaySelect && fullHolidaySelect.value !== evKey && fullHolidaySelect.querySelector('option[value="' + evKey + '"]')) {
      fullHolidaySelect.value = evKey;
    }
  }

  if (btnNextPoem) {
    btnNextPoem.addEventListener('click', function () {
      const preset = cfg.getEvent(cfg.eventMode);
      const len = preset.poems.length;
      cfg.customWish = '';
      cfg.poemIdx = ((cfg.poemIdx || 0) + 1) % len;
      syncPoeticCard();
      if (cfg.triggerPulse) cfg.triggerPulse();
    });
  }

  if (fullHolidaySelect) {
    fullHolidaySelect.addEventListener('change', function () {
      cfg.customWish = '';
      cfg.poemIdx = 0;
      if (cfg.setEventMode) cfg.setEventMode(fullHolidaySelect.value);
      syncPoeticCard();
      if (cfg.triggerPulse) cfg.triggerPulse();
      document.querySelectorAll('.event-btn').forEach(function (b) {
        const active = b.getAttribute('data-event') === fullHolidaySelect.value;
        b.className = active
          ? 'event-btn px-2.5 py-2 rounded-xl text-xs font-semibold border border-amber-400/70 bg-amber-500/15 text-amber-200 transition text-left'
          : 'event-btn px-2.5 py-2 rounded-xl text-xs font-semibold border border-slate-600/40 hover:border-amber-400/50 transition text-left';
      });
    });
  }

  if (genderProfileSelect) {
    genderProfileSelect.addEventListener('change', function () {
      cfg.userGender = genderProfileSelect.value;
      if (cfg.setEventMode) cfg.setEventMode(cfg.eventMode);
      syncPoeticCard();
    });
  }

  syncPoeticCard();

  document.querySelectorAll('.event-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const ev = btn.getAttribute('data-event');
      cfg.customWish = '';
      cfg.poemIdx = 0;
      if (cfg.setEventMode) cfg.setEventMode(ev);
      syncPoeticCard();
      if (cfg.announceWish) cfg.announceWish('');
      document.querySelectorAll('.event-btn').forEach(function (b) {
        b.className = 'event-btn px-2.5 py-2 rounded-xl text-xs font-semibold border border-slate-600/40 hover:border-amber-400/50 transition text-left';
      });
      btn.className = 'event-btn px-2.5 py-2 rounded-xl text-xs font-semibold border border-amber-400/70 bg-amber-500/15 text-amber-200 transition text-left';
    });
  });

  const customWishInput = document.getElementById('customWishInput');
  document.getElementById('btnSendWish').addEventListener('click', function () {
    const val = (customWishInput.value || '').trim();
    if (cfg.announceWish) cfg.announceWish(val);
    syncPoeticCard();
    showToast('Đã cập nhật dải lụa lời chúc trên mặt hồ!');
  });

  document.getElementById('btnDropFood').addEventListener('click', function () {
    if (cfg.spawnKnowledgeFood) cfg.spawnKnowledgeFood();
  });
  document.getElementById('btnEvoDragon').addEventListener('click', function () {
    if (cfg.ascendDragon) cfg.ascendDragon();
  });

  const btnToggleLotus = document.getElementById('btnToggleLotus');
  btnToggleLotus.addEventListener('click', function () {
    cfg.showLotus = !cfg.showLotus;
    btnToggleLotus.textContent = cfg.showLotus ? 'Lá Sen Hồ: BẬT' : 'Lá Sen Hồ: TẮT';
  });

  /* ---- Chọn giống cá ---- */
  document.querySelectorAll('.breed-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const breed = btn.getAttribute('data-breed');
      if (cfg.setBreed) cfg.setBreed(breed);
      if (cfg.triggerPulse) cfg.triggerPulse();
      document.querySelectorAll('.breed-btn').forEach(function (b) {
        b.className = 'breed-btn text-left p-3.5 rounded-xl border border-slate-600/40 hover:border-cyan-400/50 transition flex items-start gap-3';
      });
      btn.className = 'breed-btn text-left p-3.5 rounded-xl border border-amber-400/70 bg-amber-500/15 transition flex items-start gap-3';
    });
  });

  /* ---- Theme ---- */
  const btnTheme = document.getElementById('btnTheme');
  const themeIcon = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');
  btnTheme.addEventListener('click', function () {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') !== 'light';
    if (isDark) {
      html.setAttribute('data-theme', 'light');
      themeIcon.textContent = '☀';
      themeLabel.textContent = 'Nền Sáng (Giấy Học Đường)';
    } else {
      html.setAttribute('data-theme', 'dark');
      themeIcon.textContent = '◑';
      themeLabel.textContent = 'Nền Tối (Tinh Hà)';
    }
  });

  document.getElementById('btnPulse').addEventListener('click', function () {
    if (cfg.triggerPulse) cfg.triggerPulse();
  });

  /* ---- Skins ---- */
  document.querySelectorAll('.skin-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const sk = btn.getAttribute('data-skin');
      if (cfg.rebuildSkin) cfg.rebuildSkin(sk);
      if (cfg.triggerPulse) cfg.triggerPulse();
      document.querySelectorAll('.skin-btn').forEach(function (b) {
        b.className = 'skin-btn px-2 py-1.5 rounded-xl text-xs font-semibold border border-slate-600/40 hover:border-cyan-400/50 transition';
      });
      btn.className = 'skin-btn px-2 py-1.5 rounded-xl text-xs font-semibold border border-amber-400/70 bg-amber-500/20 text-amber-200 transition';
    });
  });

  document.getElementById('rngScale').addEventListener('input', function (e) {
    cfg.scale = parseFloat(e.target.value) || 1.05;
  });
  document.getElementById('rngWave').addEventListener('input', function (e) {
    cfg.waveAmp = parseFloat(e.target.value) || 1.0;
  });

  const btnToggleGlyphs = document.getElementById('btnToggleGlyphs');
  btnToggleGlyphs.addEventListener('click', function () {
    cfg.showGlyphs = !cfg.showGlyphs;
    btnToggleGlyphs.textContent = cfg.showGlyphs ? '∑ Ký tự: BẬT' : '∑ Ký tự: TẮT';
  });

  /* ---- Nút test forum ---- */
  let c1 = 0;
  document.getElementById('testBtn1').addEventListener('click', function () {
    c1++;
    document.getElementById('cnt1').textContent = c1;
  });
  document.getElementById('testBtn2').addEventListener('click', function () {
    if (cfg.triggerPulse) cfg.triggerPulse(window.innerWidth * 0.5, window.innerHeight * 0.5);
  });
  document.getElementById('testBtn3').addEventListener('click', function () {
    cfg.spinDir = (cfg.spinDir || 1) * -1;
    if (cfg.triggerPulse) cfg.triggerPulse();
  });

  const forumReplyBox = document.getElementById('forumReplyBox');
  document.getElementById('btnPostReply').addEventListener('click', function () {
    forumReplyBox.blur();
    if (cfg.spawnKnowledgeFood) cfg.spawnKnowledgeFood(window.innerWidth * 0.5, window.innerHeight * 0.45);
    showToast('Đã đăng bình luận & thưởng 3 Hạt Tri Thức cho Linh Thú!');
  });

  /* ---- Pomodoro ---- */
  let pomoSec = 25 * 60, pomoRunning = false, pomoInterval = null;
  const pomoDisplay = document.getElementById('pomoTimerDisplay');
  const btnPomoStart = document.getElementById('btnPomoStart');
  btnPomoStart.addEventListener('click', function () {
    pomoRunning = !pomoRunning;
    if (pomoRunning) {
      btnPomoStart.textContent = '⏸ Tạm dừng';
      pomoInterval = setInterval(function () {
        if (pomoSec > 0) {
          pomoSec--;
          const m = String(Math.floor(pomoSec / 60)).padStart(2, '0');
          const s = String(pomoSec % 60).padStart(2, '0');
          pomoDisplay.textContent = m + ':' + s;
        } else {
          clearInterval(pomoInterval);
          pomoRunning = false;
          btnPomoStart.textContent = '▶ Bắt đầu';
          if (cfg.ascendDragon) cfg.ascendDragon();
        }
      }, 1000);
    } else {
      clearInterval(pomoInterval);
      btnPomoStart.textContent = '▶ Tiếp tục';
    }
  });

  const btnPauseSpirit = document.getElementById('btnPauseSpirit');
  btnPauseSpirit.addEventListener('click', function () {
    cfg.paused = !cfg.paused;
    btnPauseSpirit.textContent = cfg.paused ? 'Hiện Linh Thú' : 'Ẩn Linh Thú';
  });

  /* ---- Modal code ---- */
  const codeModal = document.getElementById('codeModal');
  const codeDisplay = document.getElementById('codeDisplay');
  const rawScript = document.getElementById('spiritDragonScript').textContent.trim();
  codeDisplay.textContent = rawScript;

  document.getElementById('btnViewCode').addEventListener('click', function () {
    codeModal.classList.remove('hidden');
    codeModal.classList.add('flex');
  });
  document.getElementById('btnCloseModal').addEventListener('click', function () {
    codeModal.classList.add('hidden');
    codeModal.classList.remove('flex');
  });
  codeModal.addEventListener('click', function (e) {
    if (e.target === codeModal) {
      codeModal.classList.add('hidden');
      codeModal.classList.remove('flex');
    }
  });

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(function () { t.classList.add('hidden'); }, 2400);
  }

  document.getElementById('btnCopyCode').addEventListener('click', function () {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(rawScript).then(function () {
          showToast('Đã sao chép toàn bộ mã nguồn .JS v6.0!');
        }).catch(function () { fallbackCopy(rawScript); });
      } else {
        fallbackCopy(rawScript);
      }
    } catch (err) {
      fallbackCopy(rawScript);
    }
  });

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('Đã sao chép toàn bộ mã nguồn .JS v6.0!'); } catch (e) {}
    document.body.removeChild(ta);
  }

  document.getElementById('btnDownloadJs').addEventListener('click', function () {
    const blob = new Blob([rawScript], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fforum-scholar-spirit-v6.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('⬇ Đang tải xuống fforum-scholar-spirit-v6.js');
  });
})();
