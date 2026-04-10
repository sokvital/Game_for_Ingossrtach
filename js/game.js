// ==================== ГОСУДАРСТВО ИГРЫ ====================
let game = {
    players: [],
    currentPlayer: 0,
    active: false,
    animating: false,
    gameStarted: false
};

// ==================== СОЗДАНИЕ ИГРОКА ====================
function createPlayer(name, isBot, botType) {
    return {
        name,
        money: START_BALANCE,
        position: 0,
        avatar: isBot ? BOT_CONFIG[botType]?.avatar : "👨‍🎓",
        isBot,
        botType,
        hasScooter: false,
        hasPhone: false,
        hasScooterInsurance: false,
        hasPhoneInsurance: false,
        hasHealthInsurance: false,
        hasShipInsurance: false,
        scooterType: null,
        phoneType: null,
        scooterPrice: 0,
        phonePrice: 0,
        isBankrupt: false,
        finished: false,
        stats: { steps: 0, moneySpent: 0, insuranceClaims: 0 }
    };
}

// ==================== ЛОГИКА ИГРЫ ====================
function nextPlayer() {
    if (!game.active) return;

    let next = (game.currentPlayer + 1) % game.players.length;
    let loop = 0;

    while ((game.players[next].isBankrupt || game.players[next].finished) && loop < game.players.length) {
        next = (next + 1) % game.players.length;
        loop++;
    }

    game.currentPlayer = next;
    let p = game.players[game.currentPlayer];
    updateUI();
    addLog(`🎲 ХОД: ${p.avatar} ${p.name}`, 'turn');
    document.getElementById('eventsRollButton').disabled = !game.active || !game.gameStarted || isSpeaking;
}

function rollDice() {
    if (game.animating || isSpeaking) return;

    let p = game.players[game.currentPlayer];
    if (!p || p.isBankrupt || p.finished) {
        nextPlayer();
        return;
    }

    if (!p.hasScooter || !p.hasPhone) {
        addLog(`❌ Сначала купите электросамокат и телефон в магазине!`, 'error');
        showShop();
        return;
    }

    game.animating = true;
    document.getElementById('eventsRollButton').disabled = true;
    playDiceSound();

    let dice = Math.floor(Math.random() * 6) + 1;
    let eventsDice = document.getElementById('eventsDiceDisplay');
    let count = 0;

    let interval = setInterval(() => {
        let animVal = Math.floor(Math.random() * 6) + 1;
        eventsDice.innerText = animVal;
        count++;

        if (count > 8) {
            clearInterval(interval);
            eventsDice.innerText = dice;
            addLog(`🎲${p.avatar} ${p.name} выбросил ${dice}`);
            setTimeout(() => movePlayer(dice), 400);
        }
    }, 60);
}

function movePlayer(steps) {
    let p = game.players[game.currentPlayer];
    let newPos = Math.min(p.position + steps, 47);
    p.position = newPos;
    p.stats.steps += steps;
    updateUI();

    let cell = BOARD_CELLS[p.position];
    let eventMsg = `${p.name} ➡ клетку ${p.position}: ${cell.name}`;

    if (cell.type === 'teleport') {
        let old = p.position;
        p.position = cell.teleport_to;
        eventMsg = `${p.name} ➡ клетку ${old} (ТЕЛЕПОРТ) и ➡ клетку ${p.position} : ${BOARD_CELLS[p.position].name} `;
        updateUI();
    }

    setTimeout(() => handleEvent(eventMsg, p), 500);
}

// ==================== СОБЫТИЯ ====================
function applyMoneyLoss(p, amount, reason, baseMsg, eventName, insuranceName, insuranceEmoji) {
    let realLoss = amount;
    let insured = false;

    if (p.hasHealthInsurance && (reason === 'injury' || reason === 'food_poisoning' || reason === 'heat_stroke' || reason === 'headache' || reason === 'dog_bite')) {
        realLoss = 0;
        insured = true;
        p.stats.insuranceClaims++;
        addLog(`${baseMsg}\n\n${eventName}\nУ вас есть ${insuranceName} и страховая компания полностью возместила лечение в размере ${amount}💰.\n${insuranceEmoji} Хорошо что у вас есть страховка!`, 'insurance-success');
    } else if (p.hasScooterInsurance && reason === 'scooter_break') {
        realLoss = 0;
        insured = true;
        p.stats.insuranceClaims++;
        addLog(`${baseMsg}\n\n${eventName}\nУ вас есть ${insuranceName} и страховая компания полностью возместила ремонт в размере ${amount}💰.\n${insuranceEmoji} Хорошо что у вас есть страховка!`, 'insurance-success');
    } else if (p.hasPhoneInsurance && reason === 'phone_screen_break') {
        realLoss = 0;
        insured = true;
        p.stats.insuranceClaims++;
        addLog(`${baseMsg}\n\n${eventName}\nУ вас есть ${insuranceName} и страховая компания полностью возместила ремонт в размере ${amount}💰.\n${insuranceEmoji} Хорошо что у вас есть страховка!`, 'insurance-success');
    } else {
        p.money -= amount;
        p.stats.moneySpent += amount;
        addLog(`${baseMsg}\n\n${eventName}\nУ вас нет страховки и поэтому с вас ${amount}💰.\n Эх, надо было купить страховку!`, 'insurance-error');
    }

    p.money = Math.max(0, p.money);
    if (p.money <= 0 && !p.isBankrupt) {
        p.isBankrupt = true;
        addLog(`💀 ${p.name} ПРОИГРАЛ!`, 'bankrupt');
    }
}

function handleShipBoarding(p, baseMsg) {
    addLog(`${baseMsg}\n\nКорабль до острова уже уплыл... Вы опоздали!\nБилет сгорел. Нужно покупать новый за 10000💰.`);

    if (p.hasShipInsurance) {
        p.money += 10000;
        p.stats.insuranceClaims++;
        addLog(`🛡️ СТРАХОВКА БИЛЕТА СРАБОТАЛА!\nСтраховая компания ВЕРНУЛА 10000💰 за сгоревший билет!\n✅ Преимущество страховки Ингосстрах: вы не потеряли деньги на билет!}💰`, 'insurance-success');
    } else {
        addLog(`❌ У вас НЕТ страховки билета!\n Недостаток отсутствия страховки: деньги за билет не вернулись.\nПридётся покупать новый билет за 10000💰!`, 'insurance-error');
    }

    p.hasShipInsurance = false;

    if (p.money >= 10000) {
        p.money -= 10000;
        p.stats.moneySpent += 10000;
        addLog(`✅ ${p.name} купил новый билет за 10000💰`);

        if (!p.isBot && p.money >= SHIP_INSURANCE.price) {
            if (confirm(`Купить страховку нового билета за ${SHIP_INSURANCE.price}💰?`)) {
                p.money -= SHIP_INSURANCE.price;
                p.hasShipInsurance = true;
                p.stats.moneySpent += SHIP_INSURANCE.price;
            }
        } else if (p.isBot) {
            let cfg = BOT_CONFIG[p.botType];
            if (cfg.ship_insurance && p.money >= SHIP_INSURANCE.price) {
                p.money -= SHIP_INSURANCE.price;
                p.hasShipInsurance = true;
                p.stats.moneySpent += SHIP_INSURANCE.price;
            }
        }

        addLog(`🚢 ${p.name} сел на корабль и отправился к острову!`);
        p.position = 48;
        p.finished = true;
        addLog(`🏝️ ${p.name} ДОБРАЛСЯ ДО ОСТРОВА!\nОсталось ${p.money}💰 на развлечения!`, 'success');
    } else {
        addLog(`💀 У ${p.name} нет 10000💰 на новый билет!\n Из-за отсутствия страховки и нехватки денег вы НЕ ПОПАЛИ НА ОСТРОВ!`, 'bankrupt');
        p.isBankrupt = true;
    }

    updateUI();
}

function handleCarHit(p, baseMsg) {
    addLog(`${baseMsg}\n\n💥 Вы случайно поцарапали чужую машину во дворе.`);

    if (p.hasScooterInsurance) {
        p.stats.insuranceClaims++;
        addLog(`🚗 Ущерб автомобилю: 15000💰.\n\n🛡️ СТРАХОВКА ЭЛЕКТРОСАМОКАТА СРАБОТАЛА!\nСтраховая компания выплатила 15000💰 на ремонт чужой машины!\n Это называется СТРАХОВАНИЕ ГРАЖДАНСКОЙ ОТВЕТСТВЕННОСТИ.\n Твоя страховка покрыла ущерб, который вы причинили другому человеку.\n✅ Преимущество: вы ничего не потеряли из своих денег!`, 'insurance-success');
    } else {
        p.money -= 15000;
        p.stats.moneySpent += 15000;
        addLog(`🚗 Ущерб автомобилю: 15000💰.\n\n❌ У вас НЕТ СТРАХОВКИ ЭЛЕКТРОСАМОКАТА!\n Пришлось отдать 15000💰 из своих денег на ремонт чужой машины.\n Недостаток отсутствия страховки: вы потеряли свои деньги!`, 'insurance-error');
    }

    if (p.hasHealthInsurance) {
        p.stats.insuranceClaims++;
        addLog(`При этом ДТП вы получили травму: лечение 3000💰.\n\n🛡️ СТРАХОВКА ЗДОРОВЬЯ СРАБОТАЛА!\nСтраховая компания ОПЛАТИЛА 3000💰 за лечение!\n✅ Преимущество: лечение обошлось вам бесплатно!`, 'insurance-success');
    } else {
        p.money -= 3000;
        p.stats.moneySpent += 3000;
        addLog(`При этом ДТП вы получили травму: лечение 3000💰.\n\n❌ У вас НЕТ СТРАХОВКИ ЗДОРОВЬЯ!\n Пришлось заплатить 3000💰 за лечение из своего кармана.\n Недостаток отсутствия страховки: вы потеряли свои деньги!`, 'insurance-error');
    }

    p.money = Math.max(0, p.money);
    if (p.money <= 0 && !p.isBankrupt) {
        p.isBankrupt = true;
        addLog(`💀 ${p.name} ОБАНКРОТИЛСЯ! Из-за отсутствия страховок вы потеряли все деньги!`, 'bankrupt');
    }

    updateUI();
}

function handleScooterTheft(p, baseMsg) {
    addLog(`${baseMsg}\n\nОставили электросамокат на улице — его угнали.`);

    if (p.hasScooterInsurance) {
        p.money += p.scooterPrice;
        p.stats.insuranceClaims++;
        addLog(`🛡️ СТРАХОВКА ЭЛЕКТРОСАМОКАТА СРАБОТАЛА!\nСтраховая компания ВЕРНУЛА ${p.scooterPrice}💰 на новый электросамокат!\n✅ Преимущество: вы можете купить точно такой же электросамокат!`, 'insurance-success');
    } else {
        addLog(`❌ У вас НЕТ страховки электросамоката!\n Вы потеряли электросамокат и ${p.scooterPrice}💰, которые за него заплатил.\n Недостаток отсутствия страховки: большие потери!`, 'insurance-error');
    }

    p.hasScooter = false;
    p.hasScooterInsurance = false;
    p.scooterType = null;
    p.scooterPrice = 0;
    p.money = Math.max(0, p.money);

    if (p.isBot && !p.isBankrupt) {
        botAutoBuy(p, 'scooter');
        updateUI();
    }
}

function handlePhoneLoss(p, baseMsg) {
    addLog(`${baseMsg}\n\nКак в реальной жизни: потерял телефон — очень обидно!`);

    if (p.hasPhoneInsurance) {
        p.money += p.phonePrice;
        p.stats.insuranceClaims++;
        addLog(`🛡️ СТРАХОВКА ТЕЛЕФОНА СРАБОТАЛА!\nСтраховая компания ВЫПЛАТИЛА ${p.phonePrice}💰 на новый телефон!\n✅ Преимущество: вы можете купить точно такой же телефон!`, 'insurance-success');
    } else {
        addLog(`❌ У вас НЕТ страховки телефона!\n Вы потеряли телефон и ${p.phonePrice}💰, которые за него заплатили.\n Недостаток отсутствия страховки: большие потери!`, 'insurance-error');
    }

    p.hasPhone = false;
    p.hasPhoneInsurance = false;
    p.phoneType = null;
    p.phonePrice = 0;
    p.money = Math.max(0, p.money);

    if (p.isBot && !p.isBankrupt) {
        botAutoBuy(p, 'phone');
        updateUI();
    }
}

function handleEvent(baseMoveMsg, p) {
    let cell = BOARD_CELLS[p.position];
    let etype = cell.type;

    if (etype === 'ship_boarding') {
        handleShipBoarding(p, baseMoveMsg);
        game.animating = false;
        document.getElementById('eventsRollButton').disabled = true;

        let anyActive = game.players.some(pl => !pl.isBankrupt && !pl.finished);
        if (!anyActive) endGame();
        else nextPlayer();
        return;
    }

    if (etype === 'start' || etype === 'finish' || etype === 'teleport') {
        addLog(baseMoveMsg);
        game.animating = false;
        nextPlayer();
        return;
    }

    if (etype === 'car_hit') {
        handleCarHit(p, baseMoveMsg);
        game.animating = false;
        
        // Проверяем, остались ли еще активные игроки
        let activeCount = game.players.filter(pl => !pl.isBankrupt && !pl.finished).length;
        if (activeCount === 0) {
            endGame();
        } else {
            nextPlayer();
        }
        return;
    }

    let cost = cell.cost || 0;

    if (etype === 'scooter_break') {
        applyMoneyLoss(p, cost, 'scooter_break', baseMoveMsg, 'Ремонт стоил ' + cost + '💰.', 'СТРАХОВКА ЭЛЕКТРОСАМОКАТА', '🛡️');
    } else if (etype === 'scooter_theft') {
        handleScooterTheft(p, baseMoveMsg);
        game.animating = false;
        
        // Проверяем, остались ли еще активные игроки
        let activeCount = game.players.filter(pl => !pl.isBankrupt && !pl.finished).length;
        if (activeCount === 0) {
            endGame();
        } else {
            nextPlayer();
        }
        return;
    } else if (etype === 'phone_screen_break') {
        applyMoneyLoss(p, cost, 'phone_screen_break', baseMoveMsg, 'Замена стекла стоила ' + cost + '💰.', 'СТРАХОВКА ТЕЛЕФОНА', '🛡️');
    } else if (etype === 'phone_loss') {
        handlePhoneLoss(p, baseMoveMsg);
        game.animating = false;
        
        // Проверяем, остались ли еще активные игроки
        let activeCount = game.players.filter(pl => !pl.isBankrupt && !pl.finished).length;
        if (activeCount === 0) {
            endGame();
        } else {
            nextPlayer();
        }
        return;
    } else if (['injury', 'food_poisoning', 'heat_stroke', 'headache', 'dog_bite'].includes(etype)) {
        applyMoneyLoss(p, cost, etype, baseMoveMsg, `Лечение стоило ${cost}💰.`, 'СТРАХОВКА ЗДОРОВЬЯ', '🏥');
    } else if (etype === 'cafe_food' || etype === 'buy_water' || etype === 'scooter_charge' || etype === 'phone_charge') {
        p.money -= cost;
        p.stats.moneySpent += cost;
        addLog(`${baseMoveMsg}\n\nС вас: ${cost}💰`);
    }

    updateUI();
    game.animating = false;
    
    // Проверяем, остались ли еще активные игроки
    let activeCount = game.players.filter(pl => !pl.isBankrupt && !pl.finished).length;
    if (activeCount === 0) {
        endGame();
    } else {
        nextPlayer();
    }
}

// ==================== КОНЕЦ ИГРЫ ====================
function endGame() {
    game.active = false;
    let oldAnalysis = document.getElementById('resultsAnalysis');
    if(oldAnalysis) oldAnalysis.remove();
    let finished = game.players.filter(p => p.finished).sort((a,b) => b.money - a.money);
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('resultsScreen').style.display = 'block';
    let winnerCard = document.getElementById('winnerCard');
    if(finished.length) {
        winnerCard.innerHTML = `<div style="font-size:4rem;">${finished[0].avatar}</div><div class="winner-name">${finished[0].name}</div><div>💰 ${finished[0].money} руб.</div>`;
    } else {
        winnerCard.innerHTML = `<div>💀 НЕТ ПОБЕДИТЕЛЯ</div>`;
    }
    let tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = '';
    [...game.players].sort((a,b) => b.money - a.money).forEach((p,i) => {
        let posText = p.finished ? '48' : p.position.toString();
        let moneyText = p.isBankrupt ? '<span style="color:#dc2626;font-weight:bold">0</span>' : `${p.money}`;
        tbody.innerHTML += `<tr><td style="text-align:center">${i+1}</td><td style="text-align:center">${p.avatar} ${p.name}</td><td style="text-align:center">${posText}</td><td style="text-align:center">${p.stats.insuranceClaims}</td><td style="text-align:center">${moneyText}</td></tr>`;
    });
    let ingostrik = game.players.find(p => p.name === 'Ингострик');
    let luxer = game.players.find(p => p.name === 'Люксер');
    if(ingostrik && luxer) {
        let ingoIns = [ingostrik.hasScooterInsurance ? 'электросамоката Ингосстрах' : '', ingostrik.hasPhoneInsurance ? 'телефона Ингосстрах' : '', ingostrik.hasHealthInsurance ? 'здоровья Ингосстрах' : '', ingostrik.hasShipInsurance ? 'билета Ингосстрах' : ''].filter(Boolean);
        let luxIns = [luxer.hasScooterInsurance ? 'электросамоката' : '', luxer.hasPhoneInsurance ? 'телефона' : '', luxer.hasHealthInsurance ? 'здоровья' : '', luxer.hasShipInsurance ? 'билета' : ''].filter(Boolean);
        let analysisDiv = document.createElement('div');
        analysisDiv.id = 'resultsAnalysis';
        analysisDiv.style.cssText = 'margin-top:30px;padding:20px;background:linear-gradient(135deg,#f5f7fa,#e4e8ec);border-radius:20px;';
        analysisDiv.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;"><div style="background:#d5f5e3;padding:15px;border-radius:15px;"><h4 style="color:#27ae60;margin-bottom:10px;">✅ ${ingostrik.avatar} ${ingostrik.name}</h4><p style="font-size:0.9rem;color:#2c3e66;"><strong>Страховки Ингосстрах:</strong> ${ingoIns.join(', ') || 'нет'}<br><strong>Итог:</strong> ${ingostrik.finished ? 'ДОБРАЛСЯ 🏝️' : 'не добрался'}<br><strong>Деньги:</strong> ${ingostrik.money}💰</p></div><div style="background:#fadbd8;padding:15px;border-radius:15px;"><h4 style="color:#e74c3c;margin-bottom:10px;">❌ ${luxer.avatar} ${luxer.name}</h4><p style="font-size:0.9rem;color:#2c3e66;"><strong>Страховки:</strong> ${luxIns.join(', ') || 'нет'}<br><strong>Итог:</strong> ${luxer.finished ? 'ДОБРАЛСЯ 🏝️' : 'не добрался'}<br><strong>Деньги:</strong> ${luxer.money}💰</p></div></div><div style="margin-top:15px;padding:15px;background:#fff;border-radius:15px;border-left:5px solid #3498db;"><p style="color:#2c3e66;line-height:1.6;"><strong>💡 ПОЧЕМУ ${ingostrik.name} ВЫИГРАЛ, а ${luxer.name} ПРОИГРАЛ:</strong><br>${ingostrik.name} купил страховки Ингосстрах, которые защитили от непредвиденных расходов. При поломках, травмах, потере вещей или опоздании на корабль страховая Ингосстрах возмещала убытки — деньги сохранились, путь продолжился.<br>${luxer.name} отказался от страховок Ингосстрах ради экономии. Но при несчастных случаях пришлось платить из своего кармана. Деньги быстро закончились, и он не смог добраться до острова.<br>🏠 <strong>В ЖИЗНИ СТРАХОВКА Ингосстрах ПРИГОДИТСЯ, КОГДА:</strong><br>• Разбил телефон, ноутбук или консоль — страховка Ингосстрах возместит ремонт!<br>• Отменили концерт или мероприятие — страховка Ингосстрах вернёт деньги!<br>• Потерял багаж или рейс задержали — страховка Ингосстрах поможет!<br>• Травма на тренировке или соревнованиях — страховка здоровья Ингосстрах покроет лечение!<br>• Взломали игровой аккаунт или украли технику — страховка Ингосстрах защитит!<br><strong>💪 Платишь немного сейчас → спокойно спишь всегда!</strong> 🛡️ Ингосстрах<br><br>⭐ <strong>Страховка Ингосстрах. Просто быть уверенным!</strong> ⭐</p></div>`;
        let tableContainer = document.querySelector('.results-screen');
        if(tableContainer) { tableContainer.appendChild(analysisDiv); }
    }
}

// ==================== ЗАПУСК ИГРЫ ====================
function startGame() {
    initAudio();

    let pName = prompt("Введите ваше имя:", "Игрок 1") || "Игрок 1";
    game = {
        players: [
            createPlayer(pName, false, null),
            createPlayer("Люксер", true, "luxury"),
            createPlayer("Ноунейм", true, "noname"),
            createPlayer("Ингострик", true, "ingostrik")
        ],
        currentPlayer: 0,
        active: true,
        animating: false,
        gameStarted: false
    };

    voiceTurnBuffer = '';

    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('resultsScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('eventLog').innerHTML = '';
    document.getElementById('eventsDiceDisplay').innerText = '-';

    addLog("🏝️ ИГРА: ПУТЕШЕСТВИЕ НА ОСТРОВ 🏝️", 'success');
    addLog(`🎮 ИГРА НАЧАЛАСЬ! У вас ${START_BALANCE}💰. \n Купите себе обязательно ЭЛЕКТРОСАМОКАТ и ТЕЛЕФОН. \nРекомендуем купить страховки.`);
    

    // Боты покупают товары
    for (let i = 1; i < game.players.length; i++) {
        let bot = game.players[i];
        let cfg = BOT_CONFIG[bot.botType];

        // Покупка электросамоката
        let sKey = cfg.scooter_choice;
        let s = SCOOTERS[sKey];
        if (bot.money >= s.price) {
            bot.money -= s.price;
            bot.hasScooter = true;
            bot.scooterType = s.name;
            bot.scooterPrice = s.price;
            bot.stats.moneySpent += s.price;
            addLog(`🤖 ${bot.name} купил ${s.name} за ${s.price}💰`);

            if (cfg.buy_scooter_insurance && bot.money >= Math.round(s.price * 0.05)) {
                let insuranceCost = Math.round(s.price * 0.05);
                bot.money -= insuranceCost;
                bot.hasScooterInsurance = true;
                bot.stats.moneySpent += insuranceCost;              
                addLog(`🤖 ${bot.name} купил страховку для электросамоката за ${insuranceCost}💰`);
            }
        }

        // Покупка телефона
        let pKey = cfg.phone_choice;
        let ph = PHONES[pKey];
        if (bot.money >= ph.price) {
            bot.money -= ph.price;
            bot.hasPhone = true;
            bot.phoneType = ph.name;
            bot.phonePrice = ph.price;
            bot.stats.moneySpent += ph.price;
            addLog(`🤖 ${bot.name} купил ${ph.name} за ${ph.price}💰`);

            if (cfg.buy_phone_insurance && bot.money >= Math.round(ph.price * 0.05)) {
                let insuranceCost = Math.round(ph.price * 0.05);
                bot.money -= insuranceCost;
                bot.hasPhoneInsurance = true;
                bot.stats.moneySpent += insuranceCost;               
                addLog(`🤖 ${bot.name} купил страховку для телефона за ${insuranceCost}💰`);
            }
        }

        // Страховки
        if (cfg.ship_insurance && bot.money >= SHIP_INSURANCE.price) {
            bot.money -= SHIP_INSURANCE.price;
            bot.hasShipInsurance = true;
            bot.stats.moneySpent += SHIP_INSURANCE.price;
            addLog(`🤖 ${bot.name} купил страховку билета за ${SHIP_INSURANCE.price}💰`);
        }

        if (cfg.health_insurance && bot.money >= HEALTH_INSURANCE.price) {
            bot.money -= HEALTH_INSURANCE.price;
            bot.hasHealthInsurance = true;
            bot.stats.moneySpent += HEALTH_INSURANCE.price;
            addLog(`🤖 ${bot.name} купил СТРАХОВКУ ЗДОРОВЬЯ за ${HEALTH_INSURANCE.price}💰`);
        }
    }

    updateUI();
    setupCanvasClick();

    setTimeout(() => {
        //addLog("\n🛍️ ДОБРО ПОЖАЛОВАТЬ В МАГАЗИН!");
        showShop();
    }, 500);

    document.getElementById('eventsRollButton').disabled = true;

    if (musicEnabled && currentMusicType !== 'off') {
        playBackgroundMusic();
    }
}

// ==================== НАВИГАЦИЯ ====================
function backToMenu() {
    if (confirm("Вернуться в главное меню?")) location.reload();
}

function backToMainMenu() {
    backToMenu();
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
window.startGame = startGame;
window.rollDice = rollDice;
window.backToMenu = backToMenu;
window.backToMainMenu = backToMainMenu;

// ==================== СОЧЕТАНИЯ КЛАВИШ ====================
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (game.active && !game.animating && !isSpeaking) {
            let btn = document.getElementById('eventsRollButton');
            if (btn && !btn.disabled) rollDice();
        }
    }
});

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initVoices();
        console.log('✅ Игра готова к работе');
    });
} else {
    initVoices();
    console.log('✅ Игра готова к работе');
}
