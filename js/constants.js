// ==================== ГЛОБАЛЬНЫЕ КОНСТАНТЫ ====================
const START_BALANCE = 100000;

const SCOOTERS = {
    "1": { name: "Kugoo", price: 20000 },
    "2": { name: "Xiaomi", price: 30000 },
    "3": { name: "Segway", price: 50000 }
};

const PHONES = {
    "1": { name: "Xiaomi", price: 15000 },
    "2": { name: "Samsung", price: 30000 },
    "3": { name: "Apple", price: 45000 }
};

const HEALTH_INSURANCE = {
    price: 10000,
    name: "Страховка здоровья",
    coverage: 100
};

const SHIP_INSURANCE = {
    price: 500,
    name: "Страховка билета",
    refund: 10000
};

const BOT_CONFIG = {
    "luxury": {
        name: "Люксер",
        scooter_choice: "3",
        buy_scooter_insurance: false,
        phone_choice: "3",
        buy_phone_insurance: false,
        health_insurance: false,
        ship_insurance: false,
        avatar: "👑"
    },
    "noname": {
        name: "Ноунейм",
        scooter_choice: "1",
        buy_scooter_insurance: false,
        phone_choice: "1",
        buy_phone_insurance: false,
        health_insurance: false,
        ship_insurance: false,
        avatar: "🫥"
    },
    "ingostrik": {
        name: "Ингострик",
        scooter_choice: "2",
        buy_scooter_insurance: true,
        phone_choice: "2",
        buy_phone_insurance: true,
        health_insurance: true,
        ship_insurance: true,
        avatar: "🛡️"
    }
};

const BOARD_CELLS = {
    0: { name: "СТАРТ", type: "start", emoji: "🏁" },
    1: { name: "Зарядка электросамоката.", type: "scooter_charge", cost: 300, emoji: "⚡" },
    2: { name: "У вас сломался электросамокат.", type: "scooter_break", cost: 5000, emoji: "🔧" },
    3: { name: "Вы поели в кафе.", type: "cafe_food", cost: 500, emoji: "🍔" },
    4: { name: "Вас укусила собака.", type: "dog_bite", cost: 10000, emoji: "🐕" },
    5: { name: "Вы получили травму.", type: "injury", cost: 5000, emoji: "🤕" },
    6: { name: "Вы купили Кока-колу.", type: "buy_water", cost: 100, emoji: "🥤" },
    7: { name: "Вы разбили экран телефона.", type: "phone_screen_break", cost: 5000, emoji: "📱" },
    8: { name: "Вы отравились.", type: "food_poisoning", cost: 5000, emoji: "🤢" },
    9: { name: "ТЕЛЕПОРТ НА 4.", type: "teleport", teleport_to: 4, emoji: "⬆️" },
    10: { name: "Зарядка телефона.", type: "phone_charge", cost: 200, emoji: "🔋" },
    11: { name: "У вас солнечный удар.", type: "heat_stroke", cost: 3000, emoji: "🥵" },
    12: { name: "У вас угнали электросамокат.", type: "scooter_theft", cost: 0, emoji: "🚨" },
    13: { name: "Вы врезались в машину.", type: "car_hit", cost: 0, emoji: "🚗" },
    14: { name: "У вас заболела голова.", type: "headache", cost: 1000, emoji: "💊" },
    15: { name: "Вы поели в кафе.", type: "cafe_food", cost: 500, emoji: "🍔" },
    16: { name: "Вы потеряли телефон.", type: "phone_loss", cost: 0, emoji: "📵" },
    17: { name: "Зарядка электросамоката.", type: "scooter_charge", cost: 300, emoji: "⚡" },
    18: { name: "ТЕЛЕПОРТ НА 23.", type: "teleport", teleport_to: 23, emoji: "⬇️" },
    19: { name: "У вас сломался электросамокат.", type: "scooter_break", cost: 5000, emoji: "🔧" },
    20: { name: "Вы купили Кока-колу.", type: "buy_water", cost: 100, emoji: "🥤" },
    21: { name: "Вы получили травму.", type: "injury", cost: 5000, emoji: "🤕" },
    22: { name: "Вы разбили экран телефона.", type: "phone_screen_break", cost: 5000, emoji: "📱" },
    23: { name: "У вас угнали электросамокат.", type: "scooter_theft", cost: 0, emoji: "🚨" },
    24: { name: "Вы отравились.", type: "food_poisoning", cost: 5000, emoji: "🤢" },
    25: { name: "Вы врезались в машину.", type: "car_hit", cost: 0, emoji: "🚗" },
    26: { name: "У вас солнечный удар.", type: "heat_stroke", cost: 3000, emoji: "🥵" },
    27: { name: "Зарядка телефона.", type: "phone_charge", cost: 200, emoji: "🔋" },
    28: { name: "Вы потеряли телефон.", type: "phone_loss", cost: 0, emoji: "📵" },
    29: { name: "Вас укусила собака.", type: "dog_bite", cost: 10000, emoji: "🐕" },
    30: { name: "ТЕЛЕПОРТ НА 25.", type: "teleport", teleport_to: 25, emoji: "⬆️" },
    31: { name: "Вы поели в кафе.", type: "cafe_food", cost: 500, emoji: "🍔" },
    32: { name: "У вас сломался электросамокат.", type: "scooter_break", cost: 5000, emoji: "🔧" },
    33: { name: "Зарядка электросамоката.", type: "scooter_charge", cost: 300, emoji: "⚡" },   
    34: { name: "У вас заболела голова.", type: "headache", cost: 1000, emoji: "💊" },
    35: { name: "Вы получили травму.", type: "injury", cost: 5000, emoji: "🤕" },
    36: { name: "Вы купили Кока-колу.", type: "buy_water", cost: 100, emoji: "🥤" },
    37: { name: "Вы разбили экран телефона.", type: "phone_screen_break", cost: 5000, emoji: "📱" },
    38: { name: "Вы отравились.", type: "food_poisoning", cost: 5000, emoji: "🤢" },
    39: { name: "ТЕЛЕПОРТ НА 44.", type: "teleport", teleport_to: 44, emoji: "⬇️" },
    40: { name: "У вас угнали электросамокат.", type: "scooter_theft", cost: 0, emoji: "🚨" },
    41: { name: "Вы врезались в машину.", type: "car_hit", cost: 0, emoji: "🚗" },
    42: { name: "Зарядка телефона.", type: "phone_charge", cost: 200, emoji: "🔋" },
    43: { name: "Вы потеряли телефон.", type: "phone_loss", cost: 0, emoji: "📵" },
    44: { name: "Вас укусила собака.", type: "dog_bite", cost: 10000, emoji: "🐕" },
    45: { name: "Вы поели в кафе.", type: "cafe_food", cost: 500, emoji: "🍔" },
    46: { name: "У вас солнечный удар.", type: "heat_stroke", cost: 3000, emoji: "🥵" },
    47: { name: "ПОРТ (КОРАБЛЬ)", type: "ship_boarding", cost: 0, emoji: "🚢" },
    48: { name: "ОСТРОВ", type: "finish", emoji: "🏝️" }
};
