// ==================== МАГАЗИН ====================
function showShop() {
    let p = game.players[game.currentPlayer];
    if (!p || p.isBot || p.isBankrupt) return;

    document.getElementById('shopInfo').innerHTML = `${p.avatar} ${p.name} | Баланс: ${p.money} 💰`;

    // Электросамокаты
    let sGrid = '';
    for (let [k, s] of Object.entries(SCOOTERS)) {
        let ins = Math.round(s.price * 0.05);
        let bought = (p.hasScooter && p.scooterType === s.name);
        sGrid += `<div class="shop-item ${bought ? 'purchased' : ''}">
            <div>🛴 ${s.name}</div>
            <div>${s.price}💰</div>
            <div>страховка ${ins}💰</div>
            ${bought ? '✅' : (p.money >= s.price ? `<button class="btn-menu" style="margin-top:8px;padding:4px 12px;" onclick="window.buyScooter('${k}')">КУПИТЬ</button>` : '<span style="color:red;">❌</span>')}
        </div>`;
    }
    document.getElementById('scootersGrid').innerHTML = sGrid;

    // Телефоны
    let pHtml = '';
    for (let [k, ph] of Object.entries(PHONES)) {
        let ins = Math.round(ph.price * 0.05);
        let bought = (p.hasPhone && p.phoneType === ph.name);
        pHtml += `<div class="shop-item ${bought ? 'purchased' : ''}">
            <div>📱 ${ph.name}</div>
            <div>${ph.price}💰</div>
            <div>страховка ${ins}💰</div>
            ${bought ? '✅' : (p.money >= ph.price ? `<button class="btn-menu" style="margin-top:8px;padding:4px 12px;" onclick="window.buyPhone('${k}')">КУПИТЬ</button>` : '<span style="color:red;">❌</span>')}
        </div>`;
    }
    document.getElementById('phonesGrid').innerHTML = pHtml;

    // Страховки
    let iHtml = `
        <div class="shop-item">
            <div>🚢 ${SHIP_INSURANCE.name}</div>
            <div>${SHIP_INSURANCE.price}💰</div>
            ${p.hasShipInsurance ? '✅' : (p.money >= SHIP_INSURANCE.price ? `<button class="btn-menu" style="margin-top:8px;padding:4px 12px;" onclick="window.buyShipInsurance()">КУПИТЬ</button>` : '❌')}
        </div>
        <div class="shop-item">
            <div>🏥 ${HEALTH_INSURANCE.name}</div>
            <div>${HEALTH_INSURANCE.price}💰</div>
            ${p.hasHealthInsurance ? '✅' : (p.money >= HEALTH_INSURANCE.price ? `<button class="btn-menu" style="margin-top:8px;padding:4px 12px;" onclick="window.buyHealthInsurance()">КУПИТЬ</button>` : '❌')}
        </div>
    `;
    document.getElementById('insuranceGrid').innerHTML = iHtml;

    showModal('shopModal');
}

function buyScooter(key) {
    let p = game.players[game.currentPlayer];
    let s = SCOOTERS[key];

    if (p.hasScooter || p.money < s.price) return;

    p.money -= s.price;
    p.hasScooter = true;
    p.scooterType = s.name;
    p.scooterPrice = s.price;
    p.stats.moneySpent += s.price;

    addLog(`🛴 Куплен ${s.name} за ${s.price}💰`);

    let ins = Math.round(s.price * 0.05);
    if (p.money >= ins && confirm(`Купить страховку электросамоката за ${ins}💰?`)) {
        p.money -= ins;
        p.hasScooterInsurance = true;
        p.stats.moneySpent += ins;
        addLog(`🛡️ Страховка электросамоката куплена`);
    }

    updateUI();
    showShop();

    if (p.hasScooter && p.hasPhone && !game.gameStarted) {
        game.gameStarted = true;
        addLog(`✅ Теперь можно бросать кубик!`, 'success');
        document.getElementById('eventsRollButton').disabled = false;
    }
}

function buyPhone(key) {
    let p = game.players[game.currentPlayer];
    let ph = PHONES[key];

    if (p.hasPhone || p.money < ph.price) return;

    p.money -= ph.price;
    p.hasPhone = true;
    p.phoneType = ph.name;
    p.phonePrice = ph.price;
    p.stats.moneySpent += ph.price;

    addLog(`📱 Куплен ${ph.name} за ${ph.price}💰`);

    let ins = Math.round(ph.price * 0.05);
    if (p.money >= ins && confirm(`Купить страховку телефона за ${ins}💰?`)) {
        p.money -= ins;
        p.hasPhoneInsurance = true;
        p.stats.moneySpent += ins;
        addLog(`🛡️ Страховка телефона куплена`);
    }

    updateUI();
    showShop();

    if (p.hasScooter && p.hasPhone && !game.gameStarted) {
        game.gameStarted = true;
        addLog(`✅ Теперь можно бросать кубик!`, 'success');
        document.getElementById('eventsRollButton').disabled = false;
    }
}

function buyShipInsurance() {
    let p = game.players[game.currentPlayer];

    if (!p.hasShipInsurance && p.money >= SHIP_INSURANCE.price) {
        p.money -= SHIP_INSURANCE.price;
        p.hasShipInsurance = true;
        p.stats.moneySpent += SHIP_INSURANCE.price;
        addLog(`🚢 Страховка билета куплена`);
        updateUI();
        showShop();
    }
}

function buyHealthInsurance() {
    let p = game.players[game.currentPlayer];

    if (!p.hasHealthInsurance && p.money >= HEALTH_INSURANCE.price) {
        p.money -= HEALTH_INSURANCE.price;
        p.hasHealthInsurance = true;
        p.stats.moneySpent += HEALTH_INSURANCE.price;
        addLog(`🏥 Страховка здоровья куплена`);
        updateUI();
        showShop();
    }
}

function showInventory() {
    let p = game.players[game.currentPlayer];
    document.getElementById('inventoryContent').innerHTML = `
        <p><strong>${p.name}</strong> 💰${p.money}</p>
        <p>🛴 ${p.scooterType || 'нет'} ${p.hasScooterInsurance ? '🛡️' : ''}</p>
        <p>📱 ${p.phoneType || 'нет'} ${p.hasPhoneInsurance ? '🛡️' : ''}</p>
        <p>🚢 ${p.hasShipInsurance ? 'есть Ингосстрах' : 'нет'}</p>
        <p>🏥 ${p.hasHealthInsurance ? 'есть Ингосстрах' : 'нет'}</p>
    `;
    showModal('inventoryModal');
}

// ==================== БОТ ПОКУПКИ ====================
function botAutoBuy(p, type) {
    if (p.isBankrupt || p.finished) return;

    let cfg = BOT_CONFIG[p.botType];
    if (!cfg) return;

    if (type === 'scooter' && !p.hasScooter) {
        let bought = false;
        let keysToTry = [cfg.scooter_choice];
        ["3", "2", "1"].forEach(k => { if (k !== cfg.scooter_choice) keysToTry.push(k); });

        for (let key of keysToTry) {
            let s = SCOOTERS[key];
            if (p.money >= s.price) {
                p.money -= s.price;
                p.hasScooter = true;
                p.scooterType = s.name;
                p.scooterPrice = s.price;
                p.stats.moneySpent += s.price;

                if (cfg.buy_scooter_insurance && p.money >= Math.round(s.price * 0.05)) {
                    p.money -= Math.round(s.price * 0.05);
                    p.hasScooterInsurance = true;
                    p.stats.moneySpent += Math.round(s.price * 0.05);
                }

                addLog(`🤖 ${p.name} купил ${s.name} за ${s.price}💰`);
                bought = true;
                break;
            }
        }

        if (!bought) {
            p.isBankrupt = true;
            addLog(`💔 ${p.name} — ПРОИГРАЛ (не хватило на электросамокат)`, 'bankrupt');
        }
    }

    if (type === 'phone' && !p.hasPhone) {
        let bought = false;
        let keysToTry = [cfg.phone_choice];
        ["3", "2", "1"].forEach(k => { if (k !== cfg.phone_choice) keysToTry.push(k); });

        for (let key of keysToTry) {
            let ph = PHONES[key];
            if (p.money >= ph.price) {
                p.money -= ph.price;
                p.hasPhone = true;
                p.phoneType = ph.name;
                p.phonePrice = ph.price;
                p.stats.moneySpent += ph.price;

                if (cfg.buy_phone_insurance && p.money >= Math.round(ph.price * 0.05)) {
                    p.money -= Math.round(ph.price * 0.05);
                    p.hasPhoneInsurance = true;
                    p.stats.moneySpent += Math.round(ph.price * 0.05);
                }

                addLog(`🤖 ${p.name} купил ${ph.name} за ${ph.price}💰`);
                bought = true;
                break;
            }
        }

        if (!bought) {
            p.isBankrupt = true;
            addLog(`💔 ${p.name} — ПРОИГРАЛ (не хватило на телефон)`, 'bankrupt');
        }
    }
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
window.showShop = showShop;
window.buyScooter = buyScooter;
window.buyPhone = buyPhone;
window.buyShipInsurance = buyShipInsurance;
window.buyHealthInsurance = buyHealthInsurance;
window.showInventory = showInventory;
