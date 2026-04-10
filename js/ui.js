// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function getCellCoord(index) {
    const cols = 7;
    const row = Math.floor(index / cols);
    let col = index % cols;
    if (row % 2 === 1) col = cols - 1 - col;
    return { row, col };
}

// ==================== МОДАЛЬНЫЕ ОКНА ====================
function showModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
}

function closeModalOnBackground(e, id) {
    if (e.target === e.currentTarget) closeModal(id);
}

// ==================== ЛОГ СОБЫТИЙ ====================
let voiceTurnBuffer = '';
let isSpeaking = false;
let isSpeechEnabled = true;
let currentVoice = null;
let voices = [];
let speechSynthesis = window.speechSynthesis;

function addLog(msg, type = 'normal') {
    let logDiv = document.getElementById('eventLog');
    if (!logDiv) return;

    let div = document.createElement('div');
    div.className = 'log-entry';

    if (type === 'error') div.classList.add('error');
    else if (type === 'success') div.classList.add('success');
    else if (type === 'bankrupt') div.classList.add('bankrupt');
    else if (type === 'insurance-success') div.classList.add('insurance-success');
    else if (type === 'insurance-error') div.classList.add('insurance-error');
    else if (type === 'turn') div.classList.add('turn');

    div.innerHTML = msg;
    logDiv.appendChild(div);
    logDiv.scrollTop = logDiv.scrollHeight;

    while (logDiv.children.length > 80) logDiv.removeChild(logDiv.firstChild);

    // Озвучка: исключаем ход, бросок кубика и покупки
    if (isSpeechEnabled && currentVoice && type !== 'turn') {
        // Не озвучиваем сообщения о бросании кубика и покупках
        let shouldSpeak = !msg.includes('🎲')&&  // && 
                         !msg.includes('🤖');
                         //!msg.includes('куплена')                        
        
        if (shouldSpeak) {
            speakText(msg, type);
        }
    }
}

// ==================== ИЗОБРАЖЕНИЕ ДОСКИ ====================
function updateUI() {
    let container = document.getElementById('playersList');
    if (!container) return;

    container.innerHTML = '';
    game.players.forEach((p, idx) => {
        let div = document.createElement('div');
        div.className = `player-card ${idx === game.currentPlayer ? 'active' : ''} ${p.isBankrupt ? 'bankrupt' : ''} ${p.finished ? 'finished' : ''}`;

        let insuranceIcons = [];
        if (p.hasHealthInsurance) insuranceIcons.push('🏥');
        if (p.hasShipInsurance) insuranceIcons.push('🚢');
        let insSpan = insuranceIcons.length ? `<div class="insurance-icons">${insuranceIcons.join(' ')}</div>` : '';

        let positionText = p.finished ? '🏝️' : `📍 Клетка ${p.position}`;
        let moneyText = p.isBankrupt ? '<span style="color:#dc2626;font-weight:bold;font-size:1.1em">0 — ПРОИГРАЛ</span>' : `💰 ${p.money}`;

        div.innerHTML = `
            <div><span>${p.avatar}</span> <strong>${p.name}</strong></div>
            <div>${moneyText}</div>
            <div>${positionText}</div>
            <div>🛴${p.hasScooter ? '✅' : '❌'} ${p.hasScooterInsurance ? '🛡️' : ''}</div>
            <div>📱${p.hasPhone ? '✅' : '❌'} ${p.hasPhoneInsurance ? '🛡️' : ''}</div>
            ${insSpan}
        `;
        container.appendChild(div);
    });

    drawBoard();
}

function drawBoard() {
    let canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    let ctx = canvas.getContext('2d');
    let size = 7, spacing = 6;
    let cellW = Math.min(72, (canvas.parentElement.clientWidth - 40) / size - spacing) * 0.97;
    let startX = 20, startY = 20;
    let totalW = size * cellW + spacing * (size - 1) + 40;
    let totalH = size * cellW + spacing * (size - 1) + 40;

    canvas.width = totalW;
    canvas.height = totalH;

    // Фон
    ctx.fillStyle = '#fef7e0';
    ctx.fillRect(0, 0, totalW, totalH);

    // Рисование клеток
    for (let i = 0; i <= 48; i++) {
        let { row, col } = getCellCoord(i);
        let x = startX + col * (cellW + spacing);
        let y = startY + row * (cellW + spacing);
        let cell = BOARD_CELLS[i];

        ctx.fillStyle = i === 48 ? '#f5576c' : i === 0 ? '#43e97b' : cell.type === 'teleport' ? '#fbc4ff' : '#ffffff';
        ctx.fillRect(x, y, cellW, cellW);
        ctx.strokeStyle = '#aaa';
        ctx.strokeRect(x, y, cellW, cellW);

        ctx.fillStyle = '#333';
        ctx.font = `bold ${Math.max(9, cellW * 0.12)}px Arial`;
        ctx.fillText(i, x + 3, y + 12);

        ctx.font = `${Math.max(27, cellW * 0.45)}px Arial`;
        ctx.fillText(cell.emoji, x + cellW / 2 - 18, y + cellW / 2 + 12);

        if (cell.type === 'teleport') {
            ctx.fillStyle = '#aa2e6e';
            ctx.font = `bold ${Math.max(21, cellW * 0.33)}px Arial`;
            ctx.fillText(cell.emoji, x + cellW - 24, y + cellW - 10);
        }
    }

    // Линии пути
    ctx.beginPath();
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 4.4;
    for (let i = 0; i < 48; i++) {
        let { row: r1, col: c1 } = getCellCoord(i);
        let { row: r2, col: c2 } = getCellCoord(i + 1);
        let x1 = startX + c1 * (cellW + spacing) + cellW / 2;
        let y1 = startY + r1 * (cellW + spacing) + cellW / 2;
        let x2 = startX + c2 * (cellW + spacing) + cellW / 2;
        let y2 = startY + r2 * (cellW + spacing) + cellW / 2;

        let dx = x2 - x1, dy = y2 - y1;
        let len = Math.sqrt(dx * dx + dy * dy);

        if (len > 0) {
            let margin = cellW / 2 + 2;
            let sx = x1 + dx * margin / len;
            let sy = y1 + dy * margin / len;
            let ex = x2 - dx * margin / len;
            let ey = y2 - dy * margin / len;

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
        }
    }

    // Рисование игроков
    game.players.forEach((p, idx) => {
        if (p.isBankrupt || p.finished) return;

        let { row, col } = getCellCoord(p.position);
        let x = startX + col * (cellW + spacing) + cellW / 2 - 7;
        let y = startY + row * (cellW + spacing) + cellW / 2;
        let off = idx * 4;
        let radius = Math.max(24, cellW * 0.2);

        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        let grad = ctx.createRadialGradient(x + off - radius * 0.25, y - radius * 0.25, radius * 0.2, x + off, y, radius * 1.1);
        if (idx === game.currentPlayer) {
            grad.addColorStop(0, '#ff9a9e');
            grad.addColorStop(0.5, '#f5576c');
            grad.addColorStop(1, '#c4455a');
        } else {
            grad.addColorStop(0, '#89f7fe');
            grad.addColorStop(0.5, '#3b82f6');
            grad.addColorStop(1, '#1e40af');
        }

        ctx.beginPath();
        ctx.arc(x + off, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowBlur = 4;
        ctx.strokeStyle = idx === game.currentPlayer ? '#ffd700' : '#ffffff';
        ctx.lineWidth = idx === game.currentPlayer ? 3 : 2;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = `${Math.max(27, cellW * 0.4)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.avatar, x + off, y);

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    });
}

function setupCanvasClick() {
    let canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    canvas.addEventListener('click', (e) => {
        let rect = canvas.getBoundingClientRect();
        let scaleX = canvas.width / rect.width;
        let scaleY = canvas.height / rect.height;
        let mx = (e.clientX - rect.left) * scaleX;
        let my = (e.clientY - rect.top) * scaleY;

        let size = 7, spacing = 6;
        let cellW = (canvas.width - 40 - spacing * (size - 1)) / size;
        let startX = 20, startY = 20;

        for (let i = 0; i <= 48; i++) {
            let { row, col } = getCellCoord(i);
            let x = startX + col * (cellW + spacing);
            let y = startY + row * (cellW + spacing);

            if (mx >= x && mx <= x + cellW && my >= y && my <= y + cellW) {
                let cell = BOARD_CELLS[i];
                document.getElementById('cellInfo').innerHTML = `📍 КЛЕТКА ${i}: ${cell.name} ${cell.cost ? `| 💰 Стоимость: ${cell.cost}` : ''}`;
                break;
            }
        }
    });
}

// ==================== ОЗВУЧКА ====================
function initVoices() {
    if (!speechSynthesis) {
        console.warn('Web Speech API не поддерживается');
        return;
    }

    function loadVoices() {
        const allVoices = speechSynthesis.getVoices();
        voices = allVoices.filter(v => {
            const lang = v.lang.toLowerCase();
            return lang.includes('ru') || lang.includes('russian');
        });

        if (voices.length < 3) voices = allVoices;

        const voiceSelect = document.getElementById('voiceSelect');
        if (voiceSelect) {
            voiceSelect.innerHTML = '<option value="off">🔇 ВЫКЛ</option>';
            voices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
        }
    }

    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }

    loadVoices();
    setTimeout(loadVoices, 100);
    setTimeout(loadVoices, 500);
}

function speakText(text, type = 'normal') {
    if (!isSpeechEnabled || !speechSynthesis || !currentVoice) return;
    /*
    let cleanText = text.replace(/<[^>]*>/g, '')
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
        .replace(/📍|⭐|✅|❌|❓|❗️|🔊|🎮|🛡️|🛴|📱|💰️|🏁|🔧|🐕|⬆️|🔋|🥵|🚨|👑|🥈|🥉|‍🎓|→|←|↑|↓|➡|⬆|⬇|▶|◀|▪|▫|●|○|◆|◇|□|■|△|▲|▼/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ').trim();
    */
    let cleanText = text.replace(/<[^>]*>/g, '')
        .replace(/➡/g, 'перешел на')
        .replace(/💰️?/g, 'монет')
        .replace(/100000/g, 'сто тысяч')
        .replace(/50000/g, 'пятьдесят тысяч')
        .replace(/45000/g, 'сорок пять тысяч')
        .replace(/30000/g, 'тридцать тысяч')
        .replace(/20000/g, 'двадцать тысяч')
        .replace(/15000/g, 'пятнадцать тысяч')
        .replace(/10000/g, 'десять тысяч')
        .replace(/5000/g, 'пять тысяч')
        .replace(/3000/g, 'три тысячи')
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')  // удалить все остальные эмодзи
        .replace(/📍|⭐|✅|❌|❓|❗️|🔊|🎮|🛡️|🛴|📱|💰️|🏁|🔧|🐕|⬆️|🔋|🥵|🚨|👑|🥈|🥉|‍🎓|→|←|↑|↓|➡|⬆|⬇|▶|◀|▪|▫|●|○|◆|◇|□|■|△|▲|▼/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ').trim();

    if (!cleanText || cleanText.length < 3) return;

    isSpeaking = true;
    document.getElementById('eventsRollButton').disabled = true;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (currentVoice) utterance.voice = currentVoice;
    utterance.lang = 'ru-RU';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    utterance.onend = function() {
        isSpeaking = false;
        if (game.gameStarted && game.active) document.getElementById('eventsRollButton').disabled = false;
    };

    utterance.onerror = function() {
        isSpeaking = false;
        if (game.gameStarted && game.active) document.getElementById('eventsRollButton').disabled = false;
    };

    speechSynthesis.speak(utterance);
}

function changeVoice() {
    const voiceSelect = document.getElementById('voiceSelect');
    const selectedIndex = voiceSelect.value;

    if (selectedIndex === 'off') {
        isSpeechEnabled = false;
        currentVoice = null;
        if (speechSynthesis) speechSynthesis.cancel();
    } else {
        isSpeechEnabled = true;
        if (voices[selectedIndex]) {
            currentVoice = voices[selectedIndex];
            const testUtterance = new SpeechSynthesisUtterance('Голос выбран');
            testUtterance.voice = currentVoice;
            testUtterance.lang = 'ru-RU';
            speechSynthesis.speak(testUtterance);
        }
    }
}

function showTournament() {
    showModal('tournamentModal');
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
window.showModal = showModal;
window.closeModal = closeModal;
window.closeModalOnBackground = closeModalOnBackground;
window.changeVoice = changeVoice;
window.showTournament = showTournament;
window.addLog = addLog;
