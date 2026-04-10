// ==================== АУДИО ====================
let audioContext = null;
let musicSource = null;
let musicEnabled = true;
let isMusicPlaying = false;
let musicGain = null;
let currentMusicType = 'ingosstrakh';

// Инициализация аудио контекста
function initAudio() {
    if (audioContext) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        musicGain = audioContext.createGain();
        musicGain.gain.value = 0.3;
        musicGain.connect(audioContext.destination);
    } catch (e) {
        console.warn('AudioContext error:', e);
    }
}

// Звук броска кубика
function playDiceSound() {
    if (!audioContext) initAudio();
    if (!audioContext) return;
    if (audioContext.state === 'suspended') audioContext.resume();
    const now = audioContext.currentTime;
    playJingleNote(660, now, 0.18);
    playJingleNote(880, now + 0.12, 0.22);
}

function playJingleNote(freq, startTime, duration) {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
}

// Фоновая музыка
function playBackgroundMusic() {
    if (!musicEnabled || currentMusicType === 'off') return;
    if (isMusicPlaying) return;
    initAudio();
    if (!audioContext) return;
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => startMusicLoop());
    } else {
        startMusicLoop();
    }
}

function startMusicLoop() {
    if (!musicEnabled || currentMusicType === 'off' || !audioContext) return;
    if (isMusicPlaying) return;
    isMusicPlaying = true;
    const now = audioContext.currentTime;
    const tempo = currentMusicType === 'energetic' ? 130 : (currentMusicType === 'relax' ? 70 : 100);
    const beatDuration = 60 / tempo;
    let melody = [];

    if (currentMusicType === 'ingosstrakh') {
        melody = [
            { note: "C4", duration: 1, time: 0 },
            { note: "E4", duration: 1, time: 1 },
            { note: "G4", duration: 1.5, time: 2 },
            { note: "C5", duration: 1.5, time: 3.5 },
            { note: "G4", duration: 1, time: 5 },
            { note: "E4", duration: 1, time: 6 },
            { note: "C4", duration: 2, time: 7 }
        ];
    } else if (currentMusicType === 'adventure') {
        melody = [
            { note: "C4", duration: 0.5, time: 0 },
            { note: "E4", duration: 0.5, time: 0.5 },
            { note: "G4", duration: 0.5, time: 1 },
            { note: "C5", duration: 1, time: 1.5 },
            { note: "B4", duration: 0.5, time: 2.5 },
            { note: "G4", duration: 0.5, time: 3 },
            { note: "E4", duration: 0.5, time: 3.5 }
        ];
    } else if (currentMusicType === 'relax') {
        melody = [
            { note: "C4", duration: 2, time: 0 },
            { note: "G4", duration: 2, time: 2 },
            { note: "E4", duration: 2, time: 4 },
            { note: "C5", duration: 2, time: 6 }
        ];
    }

    const noteFreq = {
        "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00,
        "A4": 440.00, "B4": 493.88, "C5": 523.25, "D5": 587.33, "E5": 659.25,
        "F5": 698.46, "G5": 783.99, "A5": 880.00, "B5": 987.77, "C6": 1046.50
    };

    function playNote(freq, startTime, duration) {
        if (!audioContext) return;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(musicGain);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.15, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    function scheduleLoop(startTime) {
        melody.forEach(m => {
            const f = noteFreq[m.note];
            if (f) playNote(f, startTime + m.time * beatDuration, m.duration * beatDuration);
        });
    }

    function loop() {
        if (!musicEnabled || currentMusicType === 'off' || !audioContext || audioContext.state !== 'running') {
            isMusicPlaying = false;
            return;
        }
        const now = audioContext.currentTime;
        scheduleLoop(now);
        setTimeout(() => {
            if (musicEnabled && currentMusicType !== 'off') loop();
        }, 17000);
    }

    loop();
}

function stopBackgroundMusic() {
    isMusicPlaying = false;
}

// Предпросмотр музыки в настройках
function previewMusic() {
    const sel = document.getElementById('musicSelect');
    const pt = sel.value;

    if (pt === 'off') {
        currentMusicType = 'off';
        musicEnabled = false;
        stopBackgroundMusic();
        return;
    }

    const ot = currentMusicType;
    currentMusicType = pt;
    const wp = isMusicPlaying;

    if (wp) stopBackgroundMusic();

    initAudio();
    if (!audioContext) return;

    const now = audioContext.currentTime;
    const nf = {
        "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00,
        "A4": 440.00, "B4": 493.88, "C5": 523.25, "D5": 587.33, "E5": 659.25
    };

    let notes = [];
    if (pt === 'ingosstrakh') notes = [{ note: "C4", time: 0 }, { note: "E4", time: 0.3 }, { note: "G4", time: 0.6 }, { note: "C5", time: 0.9 }];
    else if (pt === 'adventure') notes = [{ note: "C4", time: 0 }, { note: "E4", time: 0.2 }, { note: "G4", time: 0.4 }, { note: "C5", time: 0.6 }];
    else if (pt === 'relax') notes = [{ note: "C4", time: 0 }, { note: "G4", time: 0.5 }, { note: "E4", time: 1 }, { note: "C5", time: 1.5 }];

    notes.forEach(n => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.type = 'sine';
        osc.frequency.value = nf[n.note];
        gain.gain.setValueAtTime(0.2, now + n.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + 0.2);
        osc.start(now + n.time);
        osc.stop(now + n.time + 0.2);
    });

    setTimeout(() => {
        currentMusicType = ot;
        if (wp && musicEnabled && ot !== 'off') {
            setTimeout(() => playBackgroundMusic(), 100);
        }
    }, 2500);
}

function changeMusic() {
    const sel = document.getElementById('musicSelect');
    currentMusicType = sel.value;

    if (currentMusicType === 'off') {
        musicEnabled = false;
        stopBackgroundMusic();
    } else {
        musicEnabled = true;
        if (isMusicPlaying) {
            stopBackgroundMusic();
            setTimeout(() => playBackgroundMusic(), 100);
        }
    }
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
window.previewMusic = previewMusic;
window.changeMusic = changeMusic;
