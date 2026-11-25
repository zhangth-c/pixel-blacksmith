/* =====================================================
   星炉铁匠铺 v2.0 — Massive Fantasy Lore Data,
   5 Elements + Light/Dark/Time/Space/Luck, 52 Recipes,
   Skill Tree & 4 Gacha Banners
   ===================================================== */

(function (global) {
  const RARITIES = {
    N:   { code: 'N',   name: '普通', order: 1, statMult: 1.0,  valMult: 1.0,  baseSlots: 1, css: 'n' },
    R:   { code: 'R',   name: '精良', order: 2, statMult: 1.32, valMult: 1.55, baseSlots: 2, css: 'r' },
    SR:  { code: 'SR',  name: '史诗', order: 3, statMult: 1.80, valMult: 2.7,  baseSlots: 3, css: 'sr' },
    SSR: { code: 'SSR', name: '传说', order: 4, statMult: 2.50, valMult: 5.0,  baseSlots: 4, css: 'ssr' },
    UR:  { code: 'UR',  name: '神话', order: 5, statMult: 3.55, valMult: 9.5,  baseSlots: 5, css: 'ur' },
  };

  const RARITY_ORDER = ['N', 'R', 'SR', 'SSR', 'UR'];

  const AFFIX_TIERS = {
    C:  { code: 'C',  mult: 1.0,  valBonus: 0.10, weight: 38 },
    B:  { code: 'B',  mult: 1.35, valBonus: 0.18, weight: 32 },
    A:  { code: 'A',  mult: 1.78, valBonus: 0.30, weight: 18 },
    S:  { code: 'S',  mult: 2.35, valBonus: 0.48, weight: 9 },
    SS: { code: 'SS', mult: 3.15, valBonus: 0.80, weight: 3 },
  };

  // Element metadata (Five Elements + Light/Dark/Time/Space/Luck + Classic RPG)
  const ELEMENTS = {
    '金': { color: '#ffe066', bg: '#473a15', group: 'wuxing', desc: '庚金破甲 · 锋锐高攻' },
    '木': { color: '#6ee878', bg: '#193d20', group: 'wuxing', desc: '青木复苏 · 生机长存' },
    '水': { color: '#56c2ff', bg: '#14334d', group: 'wuxing', desc: '玄水寒霜 · 护甲凝冰' },
    '火': { color: '#ff6f42', bg: '#4a1b12', group: 'wuxing', desc: '离火焚天 · 炽焰爆发' },
    '土': { color: '#e0a96d', bg: '#422c18', group: 'wuxing', desc: '厚土镇岳 · 磐石厚血' },
    '光': { color: '#fff6b8', bg: '#4d441e', group: 'origin', desc: '圣光裁决 · 攻防兼备' },
    '暗': { color: '#c47aff', bg: '#2e1547', group: 'origin', desc: '永夜暗蚀 · 嗜血高暴' },
    '时': { color: '#70f5e8', bg: '#143d3d', group: 'origin', desc: '时之沙漏 · 迅捷暴击' },
    '空': { color: '#9c8cff', bg: '#211c4f', group: 'origin', desc: '虚空裂隙 · 破界神力' },
    '运': { color: '#ff96dc', bg: '#471a38', group: 'origin', desc: '天命鸿运 · 溢价爆星钻' },
    '雷': { color: '#fff275', bg: '#423c14', group: 'extra',  desc: '九霄雷霆 · 极速雷暴' },
    '风': { color: '#9effd5', bg: '#153d2e', group: 'extra',  desc: '裂空疾风 · 身法轻灵' },
    '毒': { color: '#a2ff52', bg: '#274212', group: 'extra',  desc: '蚀骨剧毒 · 淬毒伤敌' },
    '血': { color: '#ff5e73', bg: '#4a141f', group: 'extra',  desc: '猩红嗜血 · 战意汲取' },
    '魂': { color: '#b5d6ff', bg: '#1d2d4a', group: 'extra',  desc: '英灵共鸣 · 传说传承' },
    '龙': { color: '#ff8a47', bg: '#4a2110', group: 'extra',  desc: '古龙威压 · 霸道全能' },
    '商': { color: '#ffcf40', bg: '#4a350f', group: 'extra',  desc: '迈达斯点金 · 巨额溢价' },
    '星': { color: '#ff8ef0', bg: '#3b194d', group: 'extra',  desc: '星界神话 · 宇宙全能' },
  };

  // Materials (14 primary, 9 secondary, 7 catalysts, 2 consumables, 14 runes, 10 gems = 56!)
  const MATERIALS = {
    // --- Primary Metals (14) ---
    copper_ore: {
      id: 'copper_ore', name: '粗铜矿', prefix: '赤铜', role: 'primary', marketCat: 'metal',
      rarity: 'N', basePrice: 18, shopBuyable: true, sprite: 'ore',
      palette: ['#f5b076', '#c96f38', '#753917'],
      powerMult: 1.0, valueBase: 46, qualityBonus: 0,
      desc: '常见锻造金属，色泽温暖，适合新手练手。'
    },
    iron_ore: {
      id: 'iron_ore', name: '黑铁矿', prefix: '黑铁', role: 'primary', marketCat: 'metal',
      rarity: 'N', basePrice: 32, shopBuyable: true, sprite: 'ore',
      palette: ['#dde5f0', '#94a2b8', '#4f5a6e'],
      powerMult: 1.24, valueBase: 74, qualityBonus: 6,
      desc: '结实耐用的铁矿，王国铁骑标准材料。'
    },
    silver_ore: {
      id: 'silver_ore', name: '猎魔纯银锭', prefix: '猎魔银', role: 'primary', marketCat: 'metal',
      rarity: 'R', basePrice: 64, shopBuyable: true, sprite: 'ore',
      palette: ['#ffffff', '#cfdbe8', '#778599'],
      powerMult: 1.52, valueBase: 128, qualityBonus: 13,
      desc: '【典故·猎魔人】专斩魔物与诅咒生物的纯净圣银，散发冷冽银辉。'
    },
    steel_ingot: {
      id: 'steel_ingot', name: '精钢锭', prefix: '精钢', role: 'primary', marketCat: 'metal',
      rarity: 'R', basePrice: 78, shopBuyable: true, sprite: 'ore',
      palette: ['#c9ebff', '#6aa3d6', '#335b8a'],
      powerMult: 1.68, valueBase: 150, qualityBonus: 17,
      desc: '千锤百炼的寒光精钢，锋利度与韧性大幅跃升。'
    },
    mithril_ore: {
      id: 'mithril_ore', name: '摩瑞亚秘银', prefix: '秘银', role: 'primary', marketCat: 'metal',
      rarity: 'SR', basePrice: 205, shopBuyable: true, sprite: 'ore',
      palette: ['#e8ffff', '#79e3e8', '#2a8599'],
      powerMult: 2.25, valueBase: 315, qualityBonus: 30,
      desc: '【典故·指环王】轻若鸿毛、坚逾龙鳞的秘银，价值胜过十倍黄金。'
    },
    valyrian_steel: {
      id: 'valyrian_steel', name: '瓦雷利亚钢', prefix: '瓦钢', role: 'primary', marketCat: 'metal',
      rarity: 'SR', basePrice: 245, shopBuyable: true, sprite: 'ore',
      palette: ['#c4ccd9', '#5a6375', '#252936'],
      powerMult: 2.45, valueBase: 365, qualityBonus: 34,
      desc: '【典故·冰与火之歌】龙焰与秘法折叠锻成的波纹钢，永不卷刃！'
    },
    dragonglass: {
      id: 'dragonglass', name: '龙晶黑曜石', prefix: '龙晶', role: 'primary', marketCat: 'metal',
      rarity: 'SR', basePrice: 265, shopBuyable: false, sprite: 'ore',
      palette: ['#d09eff', '#6f429c', '#29173d'],
      powerMult: 2.58, valueBase: 390, qualityBonus: 37,
      desc: '【典故·冰与火之歌】凝固之火形成的黑曜龙晶，克制永夜寒霜。'
    },
    adamantium: {
      id: 'adamantium', name: '艾德曼精金', prefix: '精金', role: 'primary', marketCat: 'metal',
      rarity: 'SR', basePrice: 295, shopBuyable: false, sprite: 'ore',
      palette: ['#edf5ff', '#8ea8c7', '#3a4b63'],
      powerMult: 2.78, valueBase: 430, qualityBonus: 40,
      desc: '【典故·奇幻精金】凝固后近乎不可摧毁的银蓝合金，攻防两开花。'
    },
    orichalcum: {
      id: 'orichalcum', name: '亚特兰蒂斯山铜', prefix: '山铜', role: 'primary', marketCat: 'metal',
      rarity: 'SSR', basePrice: 490, shopBuyable: false, sprite: 'ore',
      palette: ['#fff099', '#e89538', '#8a3e12'],
      powerMult: 3.15, valueBase: 640, qualityBonus: 48,
      desc: '【典故·亚特兰蒂斯】柏拉图记载的失落神铜，泛着火红金光。'
    },
    beskar_ingot: {
      id: 'beskar_ingot', name: '曼达洛贝斯卡钢', prefix: '贝斯卡', role: 'primary', marketCat: 'metal',
      rarity: 'SSR', basePrice: 540, shopBuyable: false, sprite: 'ore',
      palette: ['#f5f8fc', '#9aa4b5', '#424857'],
      powerMult: 3.35, valueBase: 700, qualityBonus: 52,
      desc: '【典故·星球大战】连光剑都能格挡的传奇陨铁，防具锻造圣品。'
    },
    vibranium: {
      id: 'vibranium', name: '瓦坎达振金', prefix: '振金', role: 'primary', marketCat: 'metal',
      rarity: 'SSR', basePrice: 590, shopBuyable: false, sprite: 'ore',
      palette: ['#d1c2ff', '#7f57f0', '#311a78'],
      powerMult: 3.55, valueBase: 760, qualityBonus: 55,
      desc: '【典故·漫威宇宙】可吸收一切动能并反震的天外紫辉神金。'
    },
    smaug_scale: {
      id: 'smaug_scale', name: '史矛革逆鳞', prefix: '龙炎', role: 'primary', marketCat: 'metal',
      rarity: 'SSR', basePrice: 610, shopBuyable: false, sprite: 'scale',
      palette: ['#ffe07d', '#eb4b3b', '#7d131a'],
      powerMult: 3.65, valueBase: 790, qualityBonus: 57,
      desc: '【典故·霍比特人】孤山巨龙最炽热坚硬的逆鳞，天然蕴含龙焰！'
    },
    uru_metal: {
      id: 'uru_metal', name: '阿斯加德乌鲁铁', prefix: '乌鲁', role: 'primary', marketCat: 'metal',
      rarity: 'SSR', basePrice: 660, shopBuyable: false, sprite: 'ore',
      palette: ['#ffdfa6', '#b8844f', '#543822'],
      powerMult: 3.85, valueBase: 860, qualityBonus: 60,
      desc: '【典故·北欧/阿斯加德】矮人以濒死恒星熔炼的神铁，雷神锤同源！'
    },
    star_iron: {
      id: 'star_iron', name: '原初星陨神金', prefix: '星陨', role: 'primary', marketCat: 'metal',
      rarity: 'UR', basePrice: 1300, shopBuyable: false, sprite: 'ore',
      palette: ['#ffffff', '#7df9ff', '#6c42db'],
      powerMult: 4.8, valueBase: 1480, qualityBonus: 76,
      desc: '【神话神材】天外太初星核坠落的禁忌神金，极易锻出神话(UR)绝世神兵！'
    },

    // --- Secondary Wood, Leather & Threads (9) ---
    oak_wood: {
      id: 'oak_wood', name: '硬橡木', role: 'secondary', marketCat: 'sub',
      rarity: 'N', basePrice: 14, shopBuyable: true, sprite: 'wood',
      palette: ['#b57b4a', '#7c4c26', '#4a2a12'],
      powerMult: 1.0, valueAdd: 22, qualityBonus: 0,
      desc: '扎实耐用的基础刀柄、杖身与盾骨木材。'
    },
    beast_hide: {
      id: 'beast_hide', name: '魔兽皮革', role: 'secondary', marketCat: 'sub',
      rarity: 'N', basePrice: 24, shopBuyable: true, sprite: 'leather',
      palette: ['#e0aa72', '#a86b39', '#613819'],
      powerMult: 1.12, valueAdd: 36, qualityBonus: 5,
      desc: '柔韧耐磨的魔兽皮革，防具内衬与绑柄必备。'
    },
    iron_wood: {
      id: 'iron_wood', name: '铁心古木', role: 'secondary', marketCat: 'sub',
      rarity: 'R', basePrice: 65, shopBuyable: true, sprite: 'wood',
      palette: ['#a2c99d', '#4f8252', '#26472c'],
      powerMult: 1.32, valueAdd: 88, qualityBonus: 14,
      desc: '坚硬如铁的千年古树树心，自带青木魔力亲和。'
    },
    moon_silk: {
      id: 'moon_silk', name: '精灵月影丝', role: 'secondary', marketCat: 'sub',
      rarity: 'R', basePrice: 82, shopBuyable: true, sprite: 'leather',
      palette: ['#e6f0ff', '#8ea8e6', '#3d4c82'],
      powerMult: 1.42, valueAdd: 112, qualityBonus: 18,
      desc: '【典故·精灵织物】沐浴月光纺织而成的丝绸，轻盈且隐匿魔力。'
    },
    wyvern_hide: {
      id: 'wyvern_hide', name: '飞龙翼膜', role: 'secondary', marketCat: 'sub',
      rarity: 'SR', basePrice: 175, shopBuyable: true, sprite: 'leather',
      palette: ['#ff9c8a', '#c94949', '#691b24'],
      powerMult: 1.68, valueAdd: 215, qualityBonus: 26,
      desc: '耐高温抗撕裂的双足飞龙翼膜，高阶防具首选。'
    },
    unicorn_hair: {
      id: 'unicorn_hair', name: '独角兽尾毛', role: 'secondary', marketCat: 'sub',
      rarity: 'SR', basePrice: 220, shopBuyable: false, sprite: 'dust',
      palette: ['#ffffff', '#e8d9ff', '#9c82cc'],
      powerMult: 1.85, valueAdd: 275, qualityBonus: 32,
      desc: '【典故·哈利波特】圣洁稳定的顶级魔杖杖芯与弓弦素材。'
    },
    phoenix_feather: {
      id: 'phoenix_feather', name: '凤凰福克斯尾羽', role: 'secondary', marketCat: 'sub',
      rarity: 'SSR', basePrice: 440, shopBuyable: false, sprite: 'scale',
      palette: ['#fff394', '#ff7033', '#a3171e'],
      powerMult: 2.15, valueAdd: 460, qualityBonus: 42,
      desc: '【典故·哈利波特】蕴含不死鸟烈焰的稀世尾羽，极易激发史诗潜能！'
    },
    world_branch: {
      id: 'world_branch', name: '世界树嫩枝', role: 'secondary', marketCat: 'sub',
      rarity: 'SSR', basePrice: 490, shopBuyable: false, sprite: 'wood',
      palette: ['#d4ff9e', '#5ce67a', '#1b7a4b'],
      powerMult: 2.30, valueAdd: 520, qualityBonus: 46,
      desc: '【典故·北欧神话】九界神树尤克特拉希尔的枝条，流淌无尽生机。'
    },
    norn_thread: {
      id: 'norn_thread', name: '命运三女神丝', role: 'secondary', marketCat: 'sub',
      rarity: 'UR', basePrice: 980, shopBuyable: false, sprite: 'dust',
      palette: ['#ffffff', '#ffb0eb', '#6a42db'],
      powerMult: 2.85, valueAdd: 980, qualityBonus: 62,
      desc: '【典故·北欧神话】诺伦三女神编织命运的丝线，赋予装备时空与气运奇迹！'
    },

    // --- Catalysts (7) ---
    ember_coal: {
      id: 'ember_coal', name: '炽焰焦炭', role: 'catalyst', marketCat: 'enchant',
      rarity: 'R', basePrice: 52, shopBuyable: true, sprite: 'ore',
      palette: ['#ffdf6b', '#ff6b35', '#781d0e'],
      qualityBonus: 14, bonusAffix: 0,
      desc: '锻造催化剂：提高炉温，品质分 +14。'
    },
    moon_water: {
      id: 'moon_water', name: '月华淬火液', role: 'catalyst', marketCat: 'enchant',
      rarity: 'SR', basePrice: 155, shopBuyable: true, sprite: 'dust',
      palette: ['#d9fbff', '#5cb6ff', '#215499'],
      qualityBonus: 28, bonusAffix: 1,
      desc: '锻造催化剂：品质分 +28，锻造时额外附带 +1 条初始属性！'
    },
    dragon_blood: {
      id: 'dragon_blood', name: '法夫纳恶龙血', role: 'catalyst', marketCat: 'enchant',
      rarity: 'SR', basePrice: 210, shopBuyable: false, sprite: 'gem',
      palette: ['#ff9ca8', '#e62e46', '#6b0a17'],
      qualityBonus: 36, bonusAffix: 1,
      desc: '【典故·尼伯龙根】屠龙浴血淬火，品质分 +36，额外 +1 条词条！'
    },
    phoenix_ash: {
      id: 'phoenix_ash', name: '不死鸟余烬', role: 'catalyst', marketCat: 'enchant',
      rarity: 'SSR', basePrice: 430, shopBuyable: false, sprite: 'dust',
      palette: ['#fff394', '#ff7733', '#b31d2c'],
      qualityBonus: 50, bonusAffix: 1,
      desc: '传说催化剂：品质分 +50，大幅跃升 SSR/UR 出货率！'
    },
    philosopher_stone: {
      id: 'philosopher_stone', name: '贤者之石碎片', role: 'catalyst', marketCat: 'enchant',
      rarity: 'SSR', basePrice: 520, shopBuyable: false, sprite: 'gem',
      palette: ['#ffdbdb', '#ff2e55', '#870b28'],
      qualityBonus: 60, bonusAffix: 2,
      desc: '【典故·炼金术/钢炼】等价交换的终极红石！品质分 +60，初始词条 +2！'
    },
    pandora_spark: {
      id: 'pandora_spark', name: '潘多拉希望余晖', role: 'catalyst', marketCat: 'enchant',
      rarity: 'SSR', basePrice: 480, shopBuyable: false, sprite: 'charm',
      palette: ['#fff8bd', '#ff96dc', '#7a35b8'],
      qualityBonus: 54, bonusAffix: 2,
      desc: '【典故·希腊神话】魔匣底部的希望之光，品质分 +54 且初始词条 +2！'
    },
    star_core: {
      id: 'star_core', name: '宇宙魔方炉心', role: 'catalyst', marketCat: 'enchant',
      rarity: 'UR', basePrice: 1050, shopBuyable: false, sprite: 'gem',
      palette: ['#ffffff', '#6beeff', '#3a42e6'],
      qualityBonus: 82, bonusAffix: 2,
      desc: '【典故·无限宝石】蕴含无尽空间能量的神炉核心，品质分 +82，极易锻出 UR 神话！'
    },

    // --- Consumables ---
    enchant_dust_pack: {
      id: 'enchant_dust_pack', name: '附魔粉尘 ×3', role: 'consumable', marketCat: 'enchant',
      rarity: 'R', basePrice: 95, shopBuyable: true, sprite: 'dust',
      palette: ['#f0c4ff', '#c278ff', '#6b27a8'],
      givesDust: 3,
      desc: '购买立刻获得 3 份附魔尘，用于铭刻属性、强化与洗练。'
    },
    bless_charm: {
      id: 'bless_charm', name: '铁匠祝福护符', role: 'consumable', marketCat: 'enchant',
      rarity: 'R', basePrice: 90, shopBuyable: true, sprite: 'charm',
      palette: ['#fff3a6', '#ffcf40', '#a66d11'],
      desc: '强化装备时勾选使用，成功率直接 +25%！'
    },

    // --- 14 Directional Elemental & Origin Runes ---
    rune_metal: {
      id: 'rune_metal', name: '庚金符文', role: 'rune', marketCat: 'enchant',
      rarity: 'SR', basePrice: 175, shopBuyable: false, sprite: 'rune',
      palette: ['#fff6b8', '#ffd24d', '#8c6614'],
      affixId: 'elem_metal', minTier: 'B',
      desc: '五行·金：定向铭刻【庚金破甲】属性 (B级起)。'
    },
    rune_wood: {
      id: 'rune_wood', name: '青木符文', role: 'rune', marketCat: 'enchant',
      rarity: 'SR', basePrice: 175, shopBuyable: false, sprite: 'rune',
      palette: ['#d4ffbd', '#52db66', '#166e2c'],
      affixId: 'elem_wood', minTier: 'B',
      desc: '五行·木：定向铭刻【青木复苏】属性 (B级起)。'
    },
    rune_water: {
      id: 'rune_water', name: '玄水符文', role: 'rune', marketCat: 'enchant',
      rarity: 'SR', basePrice: 175, shopBuyable: false, sprite: 'rune',
      palette: ['#d1f5ff', '#4fa8ff', '#16468f'],
      affixId: 'elem_water', minTier: 'B',
      desc: '五行·水：定向铭刻【玄水霜盾】属性 (B级起)。'
    },
    rune_fire: {
      id: 'rune_fire', name: '离火符文', role: 'rune', marketCat: 'enchant',
      rarity: 'SR', basePrice: 180, shopBuyable: false, sprite: 'rune',
      palette: ['#ffdf7a', '#ff5b36', '#8f1b10'],
      affixId: 'elem_fire', minTier: 'B',
      desc: '五行·火：定向铭刻【离火焚天】属性 (B级起)。'
    },
    rune_earth: {
      id: 'rune_earth', name: '厚土符文', role: 'rune', marketCat: 'enchant',
      rarity: 'SR', basePrice: 175, shopBuyable: false, sprite: 'rune',
      palette: ['#ffe0b5', '#c98842', '#663c14'],
      affixId: 'elem_earth', minTier: 'B',
      desc: '五行·土：定向铭刻【厚土镇岳】属性 (B级起)。'
    },
    rune_light: {
      id: 'rune_light', name: '圣光符文', role: 'rune', marketCat: 'enchant',
      rarity: 'SR', basePrice: 230, shopBuyable: false, sprite: 'rune',
      palette: ['#ffffff', '#fff099', '#b88c1a'],
      affixId: 'elem_light', minTier: 'B',
      desc: '本源·光：定向铭刻【圣光裁决】，攻防双增！'
    },
    rune_dark: {
      id: 'rune_dark', name: '永夜暗影符文', role: 'rune', marketCat: 'enchant',
      rarity: 'SR', basePrice: 230, shopBuyable: false, sprite: 'rune',
      palette: ['#e2b8ff', '#8e3dff', '#310d5e'],
      affixId: 'elem_dark', minTier: 'B',
      desc: '本源·暗：定向铭刻【永夜暗蚀】，可与光触发混沌交响共鸣！'
    },
    rune_time: {
      id: 'rune_time', name: '时之沙漏符文', role: 'rune', marketCat: 'enchant',
      rarity: 'SSR', basePrice: 460, shopBuyable: false, sprite: 'rune',
      palette: ['#dbffff', '#52f0d9', '#127873'],
      affixId: 'elem_time', minTier: 'A',
      desc: '本源·时：定向铭刻【时之沙漏】高阶词条，可与空触发时空主宰！'
    },
    rune_space: {
      id: 'rune_space', name: '虚空裂隙符文', role: 'rune', marketCat: 'enchant',
      rarity: 'SSR', basePrice: 480, shopBuyable: false, sprite: 'rune',
      palette: ['#e0dcff', '#7d66ff', '#281a85'],
      affixId: 'elem_space', minTier: 'A',
      desc: '本源·空：定向铭刻【虚空裂隙】高阶词条，全攻防暴涨！'
    },
    rune_luck: {
      id: 'rune_luck', name: '天命鸿运符文', role: 'rune', marketCat: 'enchant',
      rarity: 'SSR', basePrice: 510, shopBuyable: false, sprite: 'rune',
      palette: ['#ffe6f8', '#ff7ad9', '#992173'],
      affixId: 'elem_luck', minTier: 'A',
      desc: '本源·运：定向铭刻【天命鸿运】，装备售价暴涨且售出概率爆星钻！'
    },
    rune_thunder: {
      id: 'rune_thunder', name: '九霄雷霆符文', role: 'rune', marketCat: 'enchant',
      rarity: 'SR', basePrice: 195, shopBuyable: false, sprite: 'rune',
      palette: ['#fff8a6', '#ffd23f', '#9c6c11'],
      affixId: 'elem_thunder', minTier: 'B',
      desc: '天雷之力：定向铭刻【九霄雷霆】雷暴属性。'
    },
    rune_vamp: {
      id: 'rune_vamp', name: '猩红嗜血符文', role: 'rune', marketCat: 'enchant',
      rarity: 'SSR', basePrice: 410, shopBuyable: false, sprite: 'rune',
      palette: ['#ff9ca8', '#d9264d', '#5e0a1d'],
      affixId: 'vampiric', minTier: 'A',
      desc: '传说血符：定向铭刻【猩红嗜血】吸血攻防属性。'
    },
    rune_greed: {
      id: 'rune_greed', name: '迈达斯点金符文', role: 'rune', marketCat: 'enchant',
      rarity: 'SSR', basePrice: 460, shopBuyable: false, sprite: 'rune',
      palette: ['#fff7b8', '#ffcf40', '#9e6208'],
      affixId: 'gilded', minTier: 'A',
      desc: '【典故·点金之王】定向铭刻【迈达斯点金】，售价暴涨 +45%~95%！'
    },
    rune_star: {
      id: 'rune_star', name: '星界神话符文', role: 'rune', marketCat: 'enchant',
      rarity: 'UR', basePrice: 1050, shopBuyable: false, sprite: 'rune',
      palette: ['#ffffff', '#ff7cf0', '#5a2bd6'],
      affixId: 'astral_bless', minTier: 'S',
      desc: '神话圣符：定向铭刻【星界神话】顶级全能属性 (S~SS级)！'
    },

    // --- 10 Awakening Gems (5 Elements + Light/Dark/Time/Space/Luck) ---
    gem_gold: {
      id: 'gem_gold', name: '锐金琥珀', role: 'gem', marketCat: 'enchant',
      rarity: 'SR', basePrice: 220, shopBuyable: false, sprite: 'gem',
      palette: ['#fff5bd', '#f5bf38', '#8a5d0d'],
      aura: 'lightning', auraName: '庚金觉醒', statBonus: { atkPct: 0.17 }, valBonus: 0.30,
      desc: '五行·金宝石：金色光环，攻击 +17%，售价 +30%。'
    },
    gem_emerald: {
      id: 'gem_emerald', name: '翠木生命翡翠', role: 'gem', marketCat: 'enchant',
      rarity: 'SR', basePrice: 220, shopBuyable: false, sprite: 'gem',
      palette: ['#c9ffd4', '#4ce075', '#17753b'],
      aura: 'poison', auraName: '青木觉醒', statBonus: { hpPct: 0.24, defPct: 0.08 }, valBonus: 0.30,
      desc: '五行·木宝石：翠绿光环，生命 +24% 防御 +8%，售价 +30%。'
    },
    gem_sapphire: {
      id: 'gem_sapphire', name: '沧溟海蓝宝', role: 'gem', marketCat: 'enchant',
      rarity: 'SR', basePrice: 220, shopBuyable: false, sprite: 'gem',
      palette: ['#d1f2ff', '#4fa8ff', '#1a4999'],
      aura: 'ice', auraName: '玄水觉醒', statBonus: { defPct: 0.20 }, valBonus: 0.30,
      desc: '五行·水宝石：冰蓝光环，防御 +20%，售价 +30%。'
    },
    gem_ruby: {
      id: 'gem_ruby', name: '炽炎红宝石', role: 'gem', marketCat: 'enchant',
      rarity: 'SR', basePrice: 225, shopBuyable: false, sprite: 'gem',
      palette: ['#ffc2c7', '#ff4757', '#8c1424'],
      aura: 'fire', auraName: '离火觉醒', statBonus: { atkPct: 0.16, critAdd: 5 }, valBonus: 0.32,
      desc: '五行·火宝石：烈焰光环，攻击 +16% 暴击 +5%，售价 +32%。'
    },
    gem_topaz: {
      id: 'gem_topaz', name: '镇岳大地黄玉', role: 'gem', marketCat: 'enchant',
      rarity: 'SR', basePrice: 225, shopBuyable: false, sprite: 'gem',
      palette: ['#ffe7b8', '#d9913b', '#754210'],
      aura: 'holy', auraName: '厚土觉醒', statBonus: { defPct: 0.15, hpPct: 0.18 }, valBonus: 0.32,
      desc: '五行·土宝石：琥珀光环，防御 +15% 生命 +18%，售价 +32%。'
    },
    gem_sun: {
      id: 'gem_sun', name: '圣光太阳钻', role: 'gem', marketCat: 'enchant',
      rarity: 'SSR', basePrice: 520, shopBuyable: false, sprite: 'gem',
      palette: ['#ffffff', '#ffe066', '#cc8400'],
      aura: 'holy', auraName: '圣光觉醒', statBonus: { atkPct: 0.22, defPct: 0.22, hpPct: 0.20 }, valBonus: 0.58,
      desc: '本源·光宝石：神圣光环，全属性 +22%，售价 +58%！'
    },
    gem_abyss: {
      id: 'gem_abyss', name: '深渊永夜魔钻', role: 'gem', marketCat: 'enchant',
      rarity: 'SSR', basePrice: 540, shopBuyable: false, sprite: 'gem',
      palette: ['#f2c2ff', '#9c3dff', '#2c0852'],
      aura: 'void', auraName: '暗影觉醒', statBonus: { atkPct: 0.28, critAdd: 12 }, valBonus: 0.60,
      desc: '本源·暗宝石：深渊光环，攻击 +28% 暴击 +12%，售价 +60%！'
    },
    gem_time: {
      id: 'gem_time', name: '阿戈摩托时间宝石', role: 'gem', marketCat: 'enchant',
      rarity: 'UR', basePrice: 1080, shopBuyable: false, sprite: 'gem',
      palette: ['#e3fff8', '#3cf5a5', '#0d7559'],
      aura: 'poison', auraName: '时间主宰', statBonus: { atkPct: 0.26, critAdd: 18 }, valBonus: 0.88,
      desc: '【典故·奇异博士】本源·时宝石：操控时间流速，暴击 +18% 售价 +88%！'
    },
    gem_space: {
      id: 'gem_space', name: '空间宝石·魔方晶', role: 'gem', marketCat: 'enchant',
      rarity: 'UR', basePrice: 1120, shopBuyable: false, sprite: 'gem',
      palette: ['#ffffff', '#5cc8ff', '#2a38d9'],
      aura: 'ice', auraName: '空间主宰', statBonus: { atkPct: 0.34, defPct: 0.34 }, valBonus: 0.92,
      desc: '【典故·无限宝石】本源·空宝石：裂空光环，攻防 +34%，售价 +92%！'
    },
    gem_luck: {
      id: 'gem_luck', name: '福灵四叶星钻', role: 'gem', marketCat: 'enchant',
      rarity: 'UR', basePrice: 1150, shopBuyable: false, sprite: 'gem',
      palette: ['#ffffff', '#ff8ce3', '#a6268c'],
      aura: 'void', auraName: '天命眷顾', statBonus: { atkPct: 0.20, defPct: 0.20, critAdd: 15 }, valBonus: 1.15,
      desc: '【典故·福灵剂】本源·运宝石：气运光环，售价暴涨 +115% 且成交额外掉星钻！'
    },
  };

  // Sub-category labels for clean filtering
  const RECIPE_SUBCATS = [
    { id: 'all',      label: '全部(52)' },
    { id: 'mage',     label: '法器(4)' },
    { id: 'bow',      label: '弓弩(4)' },
    { id: 'sword',    label: '长剑(4)' },
    { id: 'stab',     label: '枪刺(4)' },
    { id: 'knife',    label: '匕刀(4)' },
    { id: 'heavy',    label: '重武(2)' },
    { id: 'helmet',   label: '头盔(5)' },
    { id: 'chest',    label: '胸甲(5)' },
    { id: 'shield',   label: '盾牌(5)' },
    { id: 'gauntlet', label: '护手(5)' },
    { id: 'boots',    label: '战靴(5)' },
    { id: 'cloak',    label: '披风(5)' },
  ];

  // 52 Iconic Recipes (22 Weapons + 30 Armors across 6 slots!)
  const RECIPES = [
    // ---- MAGE (4) ----
    {
      id: 'staff_oak', name: '学徒橡木法杖', category: 'weapon', subCat: 'mage', sprite: 'staff',
      starter: true, rarity: 'N', primaryNeed: 1, secondaryNeed: 2, forgeGold: 22,
      baseStats: { atk: 18, def: 2, hp: 12, crit: 8 }, valMult: 1.0,
      desc: '魔法学院新生标配法杖，魔力传导平顺。'
    },
    {
      id: 'book_necro', name: '死灵魔导典籍', category: 'weapon', subCat: 'mage', sprite: 'staff',
      starter: true, rarity: 'R', primaryNeed: 2, secondaryNeed: 2, forgeGold: 42,
      baseStats: { atk: 27, def: 4, hp: 18, crit: 12 }, valMult: 1.38,
      desc: '【典故·克苏鲁神话】禁忌羊皮装订的秘术典籍，暗影魔攻惊人。'
    },
    {
      id: 'staff_gandalf', name: '白袍苍穹圣杖', category: 'weapon', subCat: 'mage', sprite: 'staff',
      starter: false, rarity: 'SR', primaryNeed: 3, secondaryNeed: 2, forgeGold: 68,
      baseStats: { atk: 38, def: 10, hp: 30, crit: 13 }, valMult: 1.85,
      desc: '【典故·指环王】白袍迈雅巫师所持圣杖，“炎魔休想通过！”'
    },
    {
      id: 'wand_elder', name: '接骨木老魔杖', category: 'weapon', subCat: 'mage', sprite: 'staff',
      starter: false, rarity: 'SSR', primaryNeed: 3, secondaryNeed: 3, forgeGold: 115,
      baseStats: { atk: 56, def: 12, hp: 40, crit: 20 }, valMult: 2.65,
      desc: '【典故·哈利波特】三大死亡圣器之首，号称世间不可战胜的命运魔杖！'
    },

    // ---- BOW (4) ----
    {
      id: 'bow_elf', name: '幽暗密林长弓', category: 'weapon', subCat: 'bow', sprite: 'bow',
      starter: true, rarity: 'N', primaryNeed: 1, secondaryNeed: 2, forgeGold: 24,
      baseStats: { atk: 19, def: 0, hp: 10, crit: 13 }, valMult: 1.08,
      desc: '【典故·中土精灵】轻巧优雅的森林精灵长弓，射速精准。'
    },
    {
      id: 'crossbow_zhuge', name: '诸葛连发重弩', category: 'weapon', subCat: 'bow', sprite: 'bow',
      starter: true, rarity: 'R', primaryNeed: 2, secondaryNeed: 2, forgeGold: 40,
      baseStats: { atk: 26, def: 3, hp: 16, crit: 15 }, valMult: 1.36,
      desc: '【典故·三国奇械】一次装填十箭齐发的机关神弩，爆发极高。'
    },
    {
      id: 'bow_apollo', name: '阿波罗日轮金弓', category: 'weapon', subCat: 'bow', sprite: 'bow',
      starter: false, rarity: 'SR', primaryNeed: 3, secondaryNeed: 2, forgeGold: 70,
      baseStats: { atk: 37, def: 6, hp: 26, crit: 18 }, valMult: 1.88,
      desc: '【典故·希腊神话】太阳神阿波罗的黄金长弓，光矢划破长空！'
    },
    {
      id: 'bow_houyi', name: '后羿落日神弓', category: 'weapon', subCat: 'bow', sprite: 'bow',
      starter: false, rarity: 'SSR', primaryNeed: 4, secondaryNeed: 2, forgeGold: 118,
      baseStats: { atk: 54, def: 8, hp: 38, crit: 22 }, valMult: 2.62,
      desc: '【典故·山海经】连射九日的上古彤弓，一箭可裂苍穹！'
    },

    // ---- SWORD (4) ----
    {
      id: 'sword_knight', name: '骑士制式长剑', category: 'weapon', subCat: 'sword', sprite: 'sword',
      starter: true, rarity: 'N', primaryNeed: 2, secondaryNeed: 1, forgeGold: 24,
      baseStats: { atk: 19, def: 3, hp: 12, crit: 6 }, valMult: 1.0,
      desc: '攻守平衡的经典王国长剑，冒险者最常下单的兵器。'
    },
    {
      id: 'sword_muramasa', name: '妖刀村正太刀', category: 'weapon', subCat: 'sword', sprite: 'sword',
      starter: true, rarity: 'R', primaryNeed: 2, secondaryNeed: 2, forgeGold: 44,
      baseStats: { atk: 29, def: 2, hp: 14, crit: 16 }, valMult: 1.42,
      desc: '【典故·名刀传说】削铁如泥的绯红妖刀，嗜血锋锐令人胆寒。'
    },
    {
      id: 'sword_frostmourne', name: '霜之哀伤魔剑', category: 'weapon', subCat: 'sword', sprite: 'greatsword',
      starter: false, rarity: 'SSR', primaryNeed: 4, secondaryNeed: 2, forgeGold: 112,
      baseStats: { atk: 54, def: 12, hp: 48, crit: 15 }, valMult: 2.55,
      desc: '【典故·魔兽争霸】巫妖王的符文魔剑，冰寒剑气吞噬灵魂！'
    },
    {
      id: 'sword_excalibur', name: '誓约胜利之剑', category: 'weapon', subCat: 'sword', sprite: 'greatsword',
      starter: false, rarity: 'SSR', primaryNeed: 4, secondaryNeed: 2, forgeGold: 130,
      baseStats: { atk: 60, def: 16, hp: 55, crit: 18 }, valMult: 2.85,
      desc: '【典故·亚瑟王传说】湖中仙女赐予的王者圣剑 Excalibur，光耀千古！'
    },

    // ---- STAB / POLEARM (4) ----
    {
      id: 'rapier_duel', name: '贵族决斗细刺剑', category: 'weapon', subCat: 'stab', sprite: 'spear',
      starter: true, rarity: 'N', primaryNeed: 2, secondaryNeed: 1, forgeGold: 24,
      baseStats: { atk: 17, def: 2, hp: 10, crit: 14 }, valMult: 1.05,
      desc: '华丽护手与修长剑身，专攻破绽的优雅西洋刺剑。'
    },
    {
      id: 'lance_dragon', name: '龙骑穿云重枪', category: 'weapon', subCat: 'stab', sprite: 'spear',
      starter: true, rarity: 'R', primaryNeed: 3, secondaryNeed: 1, forgeGold: 45,
      baseStats: { atk: 30, def: 6, hp: 22, crit: 11 }, valMult: 1.44,
      desc: '骑兵冲锋破阵的螺旋重枪，贯穿力极强。'
    },
    {
      id: 'spear_gaebolg', name: '穿刺死棘之枪', category: 'weapon', subCat: 'stab', sprite: 'spear',
      starter: false, rarity: 'SR', primaryNeed: 3, secondaryNeed: 2, forgeGold: 74,
      baseStats: { atk: 42, def: 6, hp: 28, crit: 19 }, valMult: 1.92,
      desc: '【典故·凯尔特神话】库丘林的猩红魔枪 Gáe Bolg，逆转因果必中心脏！'
    },
    {
      id: 'spear_gungnir', name: '永恒之枪·冈格尼尔', category: 'weapon', subCat: 'stab', sprite: 'spear',
      starter: false, rarity: 'SSR', primaryNeed: 4, secondaryNeed: 2, forgeGold: 125,
      baseStats: { atk: 58, def: 12, hp: 46, crit: 20 }, valMult: 2.75,
      desc: '【典故·北欧神话】众神之父奥丁的神枪，一掷必中且洞穿一切！'
    },

    // ---- KNIFE / DAGGER (4) ----
    {
      id: 'dagger_shadow', name: '盗贼暗影匕首', category: 'weapon', subCat: 'knife', sprite: 'dagger',
      starter: true, rarity: 'N', primaryNeed: 1, secondaryNeed: 1, forgeGold: 18,
      baseStats: { atk: 14, def: 0, hp: 8, crit: 16 }, valMult: 0.96,
      desc: '轻巧隐蔽的夜行短刃，性价比极高。'
    },
    {
      id: 'knife_kukri', name: '沙海库克里弯刀', category: 'weapon', subCat: 'knife', sprite: 'dagger',
      starter: true, rarity: 'R', primaryNeed: 2, secondaryNeed: 1, forgeGold: 36,
      baseStats: { atk: 24, def: 1, hp: 14, crit: 18 }, valMult: 1.32,
      desc: '反曲刃口带来惊人劈砍与割裂威力的传奇弯刀。'
    },
    {
      id: 'blade_hidden', name: '兄弟会影牙袖剑', category: 'weapon', subCat: 'knife', sprite: 'dagger',
      starter: false, rarity: 'SR', primaryNeed: 2, secondaryNeed: 2, forgeGold: 66,
      baseStats: { atk: 35, def: 4, hp: 20, crit: 24 }, valMult: 1.82,
      desc: '【典故·刺客信条】藏于腕间的精密弹簧袖剑，无声一击毙命！'
    },
    {
      id: 'dagger_catspaw', name: '瓦雷利亚龙骨刃', category: 'weapon', subCat: 'knife', sprite: 'dagger',
      starter: false, rarity: 'SSR', primaryNeed: 3, secondaryNeed: 2, forgeGold: 108,
      baseStats: { atk: 48, def: 6, hp: 30, crit: 28 }, valMult: 2.48,
      desc: '【典故·冰与火之歌】龙骨柄嵌红宝的瓦雷利亚钢匕首，曾终结夜王！'
    },

    // ---- HEAVY BONUS (2) ----
    {
      id: 'axe_gorehowl', name: '血吼狂战巨斧', category: 'weapon', subCat: 'heavy', sprite: 'axe',
      starter: false, rarity: 'SR', primaryNeed: 4, secondaryNeed: 1, forgeGold: 72,
      baseStats: { atk: 46, def: 4, hp: 36, crit: 11 }, valMult: 1.90,
      desc: '【典故·魔兽争霸】挥舞时发出摄魂怒吼的兽人传奇战斧！'
    },
    {
      id: 'hammer_mjolnir', name: '雷神之锤·妙尔尼尔', category: 'weapon', subCat: 'heavy', sprite: 'hammer_wpn',
      starter: false, rarity: 'SSR', primaryNeed: 4, secondaryNeed: 2, forgeGold: 122,
      baseStats: { atk: 58, def: 15, hp: 58, crit: 14 }, valMult: 2.72,
      desc: '【典故·北欧神话】唯有配得上雷神之力者方能举起的九界神锤！'
    },

    // =====================================================
    // ARMOR (6 Slots × 5 Pieces = 30 Legendary Armors!)
    // =====================================================

    // ---- HELMET (5) ----
    {
      id: 'helm_iron', name: '铁卫圆顶头盔', category: 'armor', subCat: 'helmet', sprite: 'helmet',
      starter: true, rarity: 'N', primaryNeed: 2, secondaryNeed: 1, forgeGold: 22,
      baseStats: { atk: 0, def: 14, hp: 36, crit: 0 }, valMult: 1.0,
      desc: '结实可靠的王国步兵圆顶铁盔。'
    },
    {
      id: 'helm_viking', name: '维京双角战盔', category: 'armor', subCat: 'helmet', sprite: 'helmet',
      starter: true, rarity: 'R', primaryNeed: 2, secondaryNeed: 2, forgeGold: 38,
      baseStats: { atk: 6, def: 20, hp: 52, crit: 4 }, valMult: 1.34,
      desc: '【典故·北欧海盗】镶嵌兽角的狂战士战盔，兼具威慑与攻击加成。'
    },
    {
      id: 'helm_hades', name: '哈迪斯冥王隐盔', category: 'armor', subCat: 'helmet', sprite: 'helmet',
      starter: false, rarity: 'SR', primaryNeed: 3, secondaryNeed: 2, forgeGold: 68,
      baseStats: { atk: 10, def: 28, hp: 72, crit: 12 }, valMult: 1.86,
      desc: '【典故·希腊神话】独眼巨人锻造的冥王头盔，戴上即可隐入暗影！'
    },
    {
      id: 'helm_dominion', name: '冰封统御魔盔', category: 'armor', subCat: 'helmet', sprite: 'helmet',
      starter: false, rarity: 'SSR', primaryNeed: 3, secondaryNeed: 2, forgeGold: 105,
      baseStats: { atk: 18, def: 38, hp: 105, crit: 10 }, valMult: 2.45,
      desc: '【典故·魔兽争霸】蕴含寒冰王座之力的尖刺魔冠，统御亡灵大军！'
    },
    {
      id: 'helm_helios', name: '赫利俄斯日冕王冠', category: 'armor', subCat: 'helmet', sprite: 'helmet',
      starter: false, rarity: 'SSR', primaryNeed: 4, secondaryNeed: 2, forgeGold: 120,
      baseStats: { atk: 16, def: 42, hp: 125, crit: 14 }, valMult: 2.68,
      desc: '【典故·希腊神话】闪耀太阳神焰的黄金王冠，王室收藏家愿倾家荡产！'
    },

    // ---- CHESTPLATE (5) ----
    {
      id: 'chest_leather', name: '游侠硬皮轻甲', category: 'armor', subCat: 'chest', sprite: 'armor',
      starter: true, rarity: 'N', primaryNeed: 1, secondaryNeed: 2, forgeGold: 24,
      baseStats: { atk: 2, def: 15, hp: 44, crit: 5 }, valMult: 1.02,
      desc: '灵活轻便的荒野游侠胸甲。'
    },
    {
      id: 'chest_paladin', name: '圣殿骑士板甲', category: 'armor', subCat: 'chest', sprite: 'armor',
      starter: true, rarity: 'R', primaryNeed: 3, secondaryNeed: 2, forgeGold: 46,
      baseStats: { atk: 0, def: 30, hp: 82, crit: 0 }, valMult: 1.48,
      desc: '厚重庄严的全身胸铠，前排圣骑士的可靠依靠。'
    },
    {
      id: 'chest_mithril', name: '霍比特秘银锁甲', category: 'armor', subCat: 'chest', sprite: 'armor',
      starter: false, rarity: 'SR', primaryNeed: 3, secondaryNeed: 2, forgeGold: 74,
      baseStats: { atk: 6, def: 40, hp: 112, crit: 8 }, valMult: 1.98,
      desc: '【典故·指环王】比尔博传给弗罗多的秘银衫，连巨魔长矛都无法刺穿！'
    },
    {
      id: 'chest_fafnir', name: '法夫纳龙血战铠', category: 'armor', subCat: 'chest', sprite: 'armor',
      starter: false, rarity: 'SSR', primaryNeed: 4, secondaryNeed: 2, forgeGold: 114,
      baseStats: { atk: 16, def: 52, hp: 155, crit: 8 }, valMult: 2.58,
      desc: '【典故·北欧神话】以恶龙法夫纳逆鳞与龙血淬炼的不灭魔铠！'
    },
    {
      id: 'chest_celestial', name: '黄金天体圣衣', category: 'armor', subCat: 'chest', sprite: 'armor',
      starter: false, rarity: 'SSR', primaryNeed: 4, secondaryNeed: 3, forgeGold: 132,
      baseStats: { atk: 22, def: 58, hp: 175, crit: 14 }, valMult: 2.90,
      desc: '【典故·圣斗士/星界神话】燃烧小宇宙的十二宫黄金神圣衣，拍卖场镇馆之宝！'
    },

    // ---- SHIELD (5) ----
    {
      id: 'shield_oak', name: '橡木包铁圆盾', category: 'armor', subCat: 'shield', sprite: 'shield',
      starter: true, rarity: 'N', primaryNeed: 1, secondaryNeed: 2, forgeGold: 20,
      baseStats: { atk: 1, def: 18, hp: 38, crit: 0 }, valMult: 1.0,
      desc: '厚木镶铁边的经典冒险者圆盾。'
    },
    {
      id: 'shield_tower', name: '铁壁重型塔盾', category: 'armor', subCat: 'shield', sprite: 'shield',
      starter: true, rarity: 'R', primaryNeed: 3, secondaryNeed: 2, forgeGold: 42,
      baseStats: { atk: 2, def: 32, hp: 68, crit: 0 }, valMult: 1.42,
      desc: '如城墙般厚重的巨型塔盾，可抵挡箭雨与重击。'
    },
    {
      id: 'shield_hylian', name: '海拉鲁勇者圣盾', category: 'armor', subCat: 'shield', sprite: 'shield',
      starter: false, rarity: 'SR', primaryNeed: 3, secondaryNeed: 2, forgeGold: 70,
      baseStats: { atk: 8, def: 42, hp: 92, crit: 5 }, valMult: 1.92,
      desc: '【典故·塞尔达传说】绘有黄金三角徽记的海利亚圣盾，能反弹激光与龙息！'
    },
    {
      id: 'shield_vibranium', name: '振金星纹圆盾', category: 'armor', subCat: 'shield', sprite: 'shield',
      starter: false, rarity: 'SSR', primaryNeed: 4, secondaryNeed: 1, forgeGold: 110,
      baseStats: { atk: 20, def: 54, hp: 120, crit: 10 }, valMult: 2.52,
      desc: '【典故·漫威英雄】完全吸收冲击波并可投掷回旋的星纹圆盾！'
    },
    {
      id: 'shield_aegis', name: '埃癸斯众神之盾', category: 'armor', subCat: 'shield', sprite: 'shield',
      starter: false, rarity: 'SSR', primaryNeed: 4, secondaryNeed: 2, forgeGold: 128,
      baseStats: { atk: 18, def: 64, hp: 150, crit: 10 }, valMult: 2.82,
      desc: '【典故·希腊神话】宙斯与雅典娜所持神盾 Aegis，令万魔震慑退散！'
    },

    // ---- GAUNTLETS (5) ----
    {
      id: 'gloves_hunter', name: '猎手鹿皮护腕', category: 'armor', subCat: 'gauntlet', sprite: 'gauntlets',
      starter: true, rarity: 'N', primaryNeed: 1, secondaryNeed: 1, forgeGold: 18,
      baseStats: { atk: 6, def: 10, hp: 24, crit: 6 }, valMult: 0.98,
      desc: '贴合手腕的轻巧护手，拉弓挥剑皆顺手。'
    },
    {
      id: 'gloves_steel', name: '破军精钢护手', category: 'armor', subCat: 'gauntlet', sprite: 'gauntlets',
      starter: true, rarity: 'R', primaryNeed: 2, secondaryNeed: 2, forgeGold: 38,
      baseStats: { atk: 13, def: 18, hp: 44, crit: 8 }, valMult: 1.36,
      desc: '重甲骑士标配的关节钢护手，攻防兼备。'
    },
    {
      id: 'gloves_dwarf', name: '摩瑞亚锻火铁拳', category: 'armor', subCat: 'gauntlet', sprite: 'gauntlets',
      starter: false, rarity: 'SR', primaryNeed: 3, secondaryNeed: 2, forgeGold: 68,
      baseStats: { atk: 24, def: 26, hp: 68, crit: 10 }, valMult: 1.88,
      desc: '【典故·指环王矮人】耐受岩浆炙烤的重型符文拳铠，一拳碎石！'
    },
    {
      id: 'gloves_thor', name: '雅恩格利佩尔铁手', category: 'armor', subCat: 'gauntlet', sprite: 'gauntlets',
      starter: false, rarity: 'SSR', primaryNeed: 3, secondaryNeed: 2, forgeGold: 108,
      baseStats: { atk: 36, def: 34, hp: 96, crit: 12 }, valMult: 2.50,
      desc: '【典故·北欧神话】雷神托尔握持神锤必备的铁手套，赐予神力翻倍！'
    },
    {
      id: 'gloves_infinity', name: '无限星辰手套', category: 'armor', subCat: 'gauntlet', sprite: 'gauntlets',
      starter: false, rarity: 'SSR', primaryNeed: 4, secondaryNeed: 2, forgeGold: 135,
      baseStats: { atk: 44, def: 42, hp: 125, crit: 20 }, valMult: 2.95,
      desc: '【典故·漫威宇宙】矮人王为承载六颗无限原石锻造的黄金手套，响指改写现实！'
    },

    // ---- BOOTS (5) ----
    {
      id: 'boots_traveler', name: '旅者软皮轻靴', category: 'armor', subCat: 'boots', sprite: 'boots',
      starter: true, rarity: 'N', primaryNeed: 1, secondaryNeed: 2, forgeGold: 20,
      baseStats: { atk: 2, def: 11, hp: 28, crit: 7 }, valMult: 1.0,
      desc: '久行不累的柔软皮靴，新手冒险必备。'
    },
    {
      id: 'boots_knight', name: '铁蹄骑士重靴', category: 'armor', subCat: 'boots', sprite: 'boots',
      starter: true, rarity: 'R', primaryNeed: 2, secondaryNeed: 2, forgeGold: 38,
      baseStats: { atk: 5, def: 21, hp: 52, crit: 6 }, valMult: 1.35,
      desc: '钢铁护胫与加厚战靴，冲阵践踏如雷。'
    },
    {
      id: 'boots_sevenleague', name: '七里神行长靴', category: 'armor', subCat: 'boots', sprite: 'boots',
      starter: false, rarity: 'SR', primaryNeed: 2, secondaryNeed: 3, forgeGold: 66,
      baseStats: { atk: 10, def: 28, hp: 70, crit: 16 }, valMult: 1.85,
      desc: '【典故·欧洲童话】一步跨越七里山河的魔法皮靴，游侠与斥候梦寐以求！'
    },
    {
      id: 'boots_hermes', name: '赫尔墨斯飞翼靴', category: 'armor', subCat: 'boots', sprite: 'boots',
      starter: false, rarity: 'SSR', primaryNeed: 3, secondaryNeed: 3, forgeGold: 110,
      baseStats: { atk: 18, def: 36, hp: 96, crit: 22 }, valMult: 2.55,
      desc: '【典故·希腊神话】生有黄金羽翼的神使飞鞋 Talaria，疾如闪电！'
    },
    {
      id: 'boots_cloud', name: '藕丝步云履', category: 'armor', subCat: 'boots', sprite: 'boots',
      starter: false, rarity: 'SSR', primaryNeed: 3, secondaryNeed: 3, forgeGold: 124,
      baseStats: { atk: 22, def: 42, hp: 118, crit: 24 }, valMult: 2.78,
      desc: '【典故·西游记】东海龙宫珍藏仙履，踏云乘风、十万八千里瞬息即至！'
    },

    // ---- CLOAK (5) ----
    {
      id: 'cloak_traveler', name: '荒野防风斗篷', category: 'armor', subCat: 'cloak', sprite: 'cloak',
      starter: true, rarity: 'N', primaryNeed: 1, secondaryNeed: 2, forgeGold: 20,
      baseStats: { atk: 2, def: 10, hp: 34, crit: 5 }, valMult: 1.02,
      desc: '抵御风雪的实用旅行披风。'
    },
    {
      id: 'cloak_lorien', name: '罗斯洛立安精灵披风', category: 'armor', subCat: 'cloak', sprite: 'cloak',
      starter: true, rarity: 'R', primaryNeed: 1, secondaryNeed: 3, forgeGold: 42,
      baseStats: { atk: 6, def: 19, hp: 58, crit: 12 }, valMult: 1.44,
      desc: '【典故·指环王】缀有绿叶胸针的精灵斗篷，能完美融入山林岩石！'
    },
    {
      id: 'cloak_vampire', name: '德古拉猩红魔披风', category: 'armor', subCat: 'cloak', sprite: 'cloak',
      starter: false, rarity: 'SR', primaryNeed: 2, secondaryNeed: 3, forgeGold: 72,
      baseStats: { atk: 16, def: 26, hp: 88, crit: 14 }, valMult: 1.94,
      desc: '【典故·吸血鬼传说】夜幕中翻卷血浪的贵族披风，自带暗影与嗜血威仪。'
    },
    {
      id: 'cloak_levitation', name: '圣殿魔浮斗篷', category: 'armor', subCat: 'cloak', sprite: 'cloak',
      starter: false, rarity: 'SSR', primaryNeed: 3, secondaryNeed: 3, forgeGold: 114,
      baseStats: { atk: 20, def: 38, hp: 122, crit: 16 }, valMult: 2.60,
      desc: '【典故·奇异博士】拥有自主意识的至尊法师红斗篷，可凌空悬浮护主！'
    },
    {
      id: 'cloak_invisibility', name: '死神隐形斗篷', category: 'armor', subCat: 'cloak', sprite: 'cloak',
      starter: false, rarity: 'SSR', primaryNeed: 3, secondaryNeed: 3, forgeGold: 130,
      baseStats: { atk: 22, def: 44, hp: 135, crit: 24 }, valMult: 2.88,
      desc: '【典故·哈利波特】三大死亡圣器之一，连死神之眼也无法窥破其踪迹！'
    },
  ];

  // 18 Rich Attributes: 5 Elements (金木水火土) + Light/Dark/Time/Space/Luck + Extras
  const AFFIXES = [
    // Five Elements
    {
      id: 'elem_metal', name: '庚金破甲', tag: '金', appliesTo: 'all',
      stat: 'atk', baseMin: 7, baseMax: 12,
      desc: (v) => `庚金破甲攻击 +${v}`
    },
    {
      id: 'elem_wood', name: '青木复苏', tag: '木', appliesTo: 'all',
      stat: 'hp', baseMin: 26, baseMax: 45,
      desc: (v) => `青木生机生命 +${v}`
    },
    {
      id: 'elem_water', name: '玄水霜盾', tag: '水', appliesTo: 'all',
      stat: 'def', baseMin: 7, baseMax: 12,
      desc: (v) => `玄水寒冰防御 +${v}`
    },
    {
      id: 'elem_fire', name: '离火焚天', tag: '火', appliesTo: 'all',
      stat: 'atk', baseMin: 8, baseMax: 14,
      desc: (v) => `离火灼烧伤害 +${v}`
    },
    {
      id: 'elem_earth', name: '厚土镇岳', tag: '土', appliesTo: 'all',
      stat: 'defHp', baseMin: 6, baseMax: 10,
      desc: (v) => `厚土防御 +${v} / 生命 +${v * 3}`
    },

    // Five High Origins: Light, Dark, Time, Space, Luck
    {
      id: 'elem_light', name: '圣光裁决', tag: '光', appliesTo: 'all',
      stat: 'atkDef', baseMin: 6, baseMax: 11,
      desc: (v) => `圣光攻防各 +${v}`
    },
    {
      id: 'elem_dark', name: '永夜暗蚀', tag: '暗', appliesTo: 'all',
      stat: 'atkCrit', baseMin: 6, baseMax: 11,
      desc: (v) => `暗蚀攻击 +${v} / 暴击 +${Math.max(2, Math.round(v * 0.45))}%`
    },
    {
      id: 'elem_time', name: '时之沙漏', tag: '时', appliesTo: 'all',
      stat: 'timeStat', baseMin: 4, baseMax: 8,
      desc: (v) => `时空暴击 +${v}% / 估值 +${v * 3}%`
    },
    {
      id: 'elem_space', name: '虚空裂隙', tag: '空', appliesTo: 'all',
      stat: 'spaceStat', baseMin: 8, baseMax: 14,
      desc: (v) => `破界攻防 +${v} / 估值 +${v * 2}%`
    },
    {
      id: 'elem_luck', name: '天命鸿运', tag: '运', appliesTo: 'all',
      stat: 'luckStat', baseMin: 14, baseMax: 24,
      desc: (v) => `暴击 +${Math.max(2, Math.round(v * 0.25))}% / 售价 +${v}% (成交爆星钻!)`
    },

    // Extra Fantasy Attributes
    {
      id: 'elem_thunder', name: '九霄雷霆', tag: '雷', appliesTo: 'all',
      stat: 'atkCrit', baseMin: 5, baseMax: 9,
      desc: (v) => `雷伤 +${v} / 暴击 +${Math.max(2, Math.round(v * 0.5))}%`
    },
    {
      id: 'elem_wind', name: '裂空疾风', tag: '风', appliesTo: 'all',
      stat: 'crit', baseMin: 4, baseMax: 7,
      desc: (v) => `疾风迅捷暴击 +${v}%`
    },
    {
      id: 'elem_poison', name: '蚀骨剧毒', tag: '毒', appliesTo: 'weapon',
      stat: 'atk', baseMin: 7, baseMax: 13,
      desc: (v) => `剧毒侵蚀攻击 +${v}`
    },
    {
      id: 'vampiric', name: '猩红嗜血', tag: '血', appliesTo: 'all',
      stat: 'atkHp', baseMin: 5, baseMax: 10,
      desc: (v) => `嗜血攻击 +${v} / 生命 +${v * 3}`
    },
    {
      id: 'soul_echo', name: '英灵共鸣', tag: '魂', appliesTo: 'all',
      stat: 'all', baseMin: 7, baseMax: 12,
      desc: (v) => `英灵全攻防 +${v} / 生命 +${v * 3}`
    },
    {
      id: 'dragon_might', name: '古龙威压', tag: '龙', appliesTo: 'all',
      stat: 'atkHp', baseMin: 8, baseMax: 14,
      desc: (v) => `龙威攻击 +${v} / 生命 +${v * 3}`
    },
    {
      id: 'gilded', name: '迈达斯点金', tag: '商', appliesTo: 'all',
      stat: 'valPct', baseMin: 20, baseMax: 30,
      desc: (v) => `装备售价直接 +${v}%`
    },
    {
      id: 'astral_bless', name: '星界神话', tag: '星', appliesTo: 'all',
      stat: 'all', baseMin: 10, baseMax: 16,
      desc: (v) => `神话攻防 +${v} / 生命 +${v * 4} / 高溢价`
    },
  ];

  // Blacksmith Leveling & Skill Tree (3 Branches × 4 Skills = 12 Skills!)
  const SKILL_TREE = [
    // Branch 1: Forging Mastery (火锤宗师)
    {
      id: 'forge_heat', branch: 'forge', branchName: '火锤宗师',
      name: '炉火纯青', maxLv: 5, reqLevel: 1, sprite: 'hammer',
      desc: (lv) => `锻造基础品质分 +${lv * 7}（下级 +${(lv + 1) * 7}），持续拉高 SR/SSR/UR 出货率。`
    },
    {
      id: 'golden_zone', branch: 'forge', branchName: '火锤宗师',
      name: '神匠之眼', maxLv: 5, reqLevel: 2, sprite: 'ore_iron',
      desc: (lv) => `火候条金色暴击区扩大 +${lv * 2}%，且 PERFECT 敲击额外 +${lv * 4} 品质分。`
    },
    {
      id: 'mat_saver', branch: 'forge', branchName: '火锤宗师',
      name: '巧夺天工', maxLv: 5, reqLevel: 3, sprite: 'chest',
      desc: (lv) => `锻造时有 ${lv * 8}% 概率触发【神匠省料】，返还本次消耗的主材料！`
    },
    {
      id: 'twin_forge', branch: 'forge', branchName: '火锤宗师',
      name: '双生神兵', maxLv: 3, reqLevel: 5, sprite: 'anvil_logo',
      desc: (lv) => `锻造完成时有 ${lv * 7}% 概率触发【一炉双器】，免费再获一件同款神装！`
    },

    // Branch 2: Arcane Enchanting (秘法附魔)
    {
      id: 'affix_luck', branch: 'enchant', branchName: '秘法附魔',
      name: '真理铭刻', maxLv: 5, reqLevel: 1, sprite: 'rune_fire',
      desc: (lv) => `附魔与洗练出现 A/S/SS 级高阶词条的权重提高 +${lv * 22}%。`
    },
    {
      id: 'steady_hand', branch: 'enchant', branchName: '秘法附魔',
      name: '稳固锤印', maxLv: 5, reqLevel: 2, sprite: 'enchant_dust',
      desc: (lv) => `装备强化成功率 +${lv * 4}%，失败时额外多积累 +${lv * 5}% 祝福值。`
    },
    {
      id: 'dust_alchemy', branch: 'enchant', branchName: '秘法附魔',
      name: '粉尘炼金', maxLv: 5, reqLevel: 3, sprite: 'star_gem',
      desc: (lv) => `附魔/洗练有 ${lv * 12}% 概率免消耗附魔尘，且 Lv.3 起基础尘耗 -1。`
    },
    {
      id: 'extra_slot', branch: 'enchant', branchName: '秘法附魔',
      name: '星纹扩槽', maxLv: 2, reqLevel: 6, sprite: 'rune_fire',
      desc: (lv) => `所有装备的最大属性词条上限永久额外 +${lv} 格（最高 7 词条神装）！`
    },

    // Branch 3: Merchant & Gacha Fortune (商道星运)
    {
      id: 'royal_appraise', branch: 'trade', branchName: '商道星运',
      name: '皇家鉴宝', maxLv: 5, reqLevel: 1, sprite: 'coin',
      desc: (lv) => `所有装备基础估价与成交价格永久提升 +${lv * 8}%。`
    },
    {
      id: 'silver_tongue', branch: 'trade', branchName: '商道星运',
      name: '三寸不烂之舌', maxLv: 5, reqLevel: 2, sprite: 'coin',
      desc: (lv) => `讨价还价成功率 +${lv * 6}%，且每次成功抬价倍率额外 +${(lv * 0.04).toFixed(2)}x。`
    },
    {
      id: 'gacha_fortune', branch: 'trade', branchName: '商道星运',
      name: '鸿运星祈', maxLv: 5, reqLevel: 3, sprite: 'star_gem',
      desc: (lv) => `抽卡 SSR/UR 概率额外提升 +${(lv * 1.2).toFixed(1)}%，且每进新一天获赠 ${lv} 星钻！`
    },
    {
      id: 'auction_king', branch: 'trade', branchName: '商道星运',
      name: '拍卖大亨', maxLv: 3, reqLevel: 5, sprite: 'chest',
      desc: (lv) => `皇家拍卖行竞价额外增加 +${lv} 轮，每次贵族加价幅度提升 +${lv * 15}%！`
    },
  ];

  // 4 Gacha Banners (Including new Mythic Blueprint & Origin Pool!)
  const GACHA_BANNERS = [
    {
      id: 'mine_banner',
      name: '边境矿脉寻宝池',
      tag: '基础金币池',
      tagCss: 'pill-r',
      currency: 'gold',
      cost1: 100,
      cost10: 900,
      bannerImg: 'assets/banners/banner_mine.png',
      sprite: 'ore',
      palette: ['#c9ebff', '#6aa3d6', '#335b8a'],
      desc: '适合前期大量补货！涵盖基础矿石、五行符文、摩瑞亚秘银、瓦雷利亚钢与多款 SR 典故图纸！',
      rates: { N: 42, R: 35, SR: 18, SSR: 4.4, UR: 0.6 },
      pools: {
        N: [
          { type: 'mat', id: 'copper_ore', qty: 3 },
          { type: 'mat', id: 'iron_ore', qty: 2 },
          { type: 'mat', id: 'oak_wood', qty: 3 },
          { type: 'mat', id: 'beast_hide', qty: 2 },
          { type: 'dust', qty: 3 },
        ],
        R: [
          { type: 'mat', id: 'silver_ore', qty: 2 },
          { type: 'mat', id: 'steel_ingot', qty: 2 },
          { type: 'mat', id: 'iron_wood', qty: 2 },
          { type: 'mat', id: 'moon_silk', qty: 2 },
          { type: 'mat', id: 'ember_coal', qty: 2 },
          { type: 'mat', id: 'bless_charm', qty: 1 },
          { type: 'dust', qty: 5 },
        ],
        SR: [
          { type: 'mat', id: 'mithril_ore', qty: 2 },
          { type: 'mat', id: 'valyrian_steel', qty: 2 },
          { type: 'mat', id: 'wyvern_hide', qty: 2 },
          { type: 'mat', id: 'unicorn_hair', qty: 2 },
          { type: 'mat', id: 'moon_water', qty: 1 },
          { type: 'mat', id: 'rune_metal', qty: 1 },
          { type: 'mat', id: 'rune_wood', qty: 1 },
          { type: 'mat', id: 'rune_water', qty: 1 },
          { type: 'mat', id: 'rune_fire', qty: 1 },
          { type: 'mat', id: 'rune_earth', qty: 1 },
          { type: 'recipe', id: 'staff_gandalf' },
          { type: 'recipe', id: 'bow_apollo' },
          { type: 'recipe', id: 'spear_gaebolg' },
          { type: 'recipe', id: 'blade_hidden' },
          { type: 'recipe', id: 'shield_hylian' },
          { type: 'recipe', id: 'chest_mithril' },
        ],
        SSR: [
          { type: 'mat', id: 'orichalcum', qty: 2 },
          { type: 'mat', id: 'smaug_scale', qty: 2 },
          { type: 'mat', id: 'phoenix_ash', qty: 1 },
          { type: 'mat', id: 'rune_greed', qty: 1 },
          { type: 'mat', id: 'gem_sun', qty: 1 },
          { type: 'recipe', id: 'sword_frostmourne' },
          { type: 'recipe', id: 'boots_hermes' },
        ],
        UR: [
          { type: 'mat', id: 'star_iron', qty: 2 },
          { type: 'mat', id: 'star_core', qty: 1 },
        ]
      }
    },
    {
      id: 'ruin_banner',
      name: '龙焰秘境遗迹池',
      tag: '高阶金币池',
      tagCss: 'pill-sr',
      currency: 'gold',
      cost1: 280,
      cost10: 2500,
      bannerImg: 'assets/banners/banner_ruin.png',
      sprite: 'scale',
      palette: ['#ffe07d', '#eb4b3b', '#7d131a'],
      desc: '无 N 卡！盛产精金、贝斯卡钢、振金、乌鲁神铁、五行宝石、光暗符文与全部位经典传说防具图纸！',
      rates: { N: 0, R: 48, SR: 37, SSR: 12.5, UR: 2.5 },
      pools: {
        R: [
          { type: 'mat', id: 'steel_ingot', qty: 3 },
          { type: 'mat', id: 'silver_ore', qty: 3 },
          { type: 'mat', id: 'moon_silk', qty: 3 },
          { type: 'mat', id: 'ember_coal', qty: 3 },
          { type: 'mat', id: 'bless_charm', qty: 2 },
          { type: 'dust', qty: 7 },
        ],
        SR: [
          { type: 'mat', id: 'valyrian_steel', qty: 3 },
          { type: 'mat', id: 'dragonglass', qty: 2 },
          { type: 'mat', id: 'adamantium', qty: 2 },
          { type: 'mat', id: 'dragon_blood', qty: 2 },
          { type: 'mat', id: 'unicorn_hair', qty: 2 },
          { type: 'mat', id: 'rune_light', qty: 1 },
          { type: 'mat', id: 'rune_dark', qty: 1 },
          { type: 'mat', id: 'rune_thunder', qty: 1 },
          { type: 'mat', id: 'gem_gold', qty: 1 },
          { type: 'mat', id: 'gem_emerald', qty: 1 },
          { type: 'mat', id: 'gem_sapphire', qty: 1 },
          { type: 'mat', id: 'gem_ruby', qty: 1 },
          { type: 'mat', id: 'gem_topaz', qty: 1 },
          { type: 'recipe', id: 'axe_gorehowl' },
          { type: 'recipe', id: 'helm_hades' },
          { type: 'recipe', id: 'gloves_dwarf' },
          { type: 'recipe', id: 'boots_sevenleague' },
          { type: 'recipe', id: 'cloak_vampire' },
        ],
        SSR: [
          { type: 'mat', id: 'orichalcum', qty: 3 },
          { type: 'mat', id: 'beskar_ingot', qty: 3 },
          { type: 'mat', id: 'vibranium', qty: 2 },
          { type: 'mat', id: 'uru_metal', qty: 2 },
          { type: 'mat', id: 'phoenix_feather', qty: 2 },
          { type: 'mat', id: 'world_branch', qty: 2 },
          { type: 'mat', id: 'philosopher_stone', qty: 1 },
          { type: 'mat', id: 'rune_vamp', qty: 1 },
          { type: 'mat', id: 'rune_time', qty: 1 },
          { type: 'mat', id: 'rune_space', qty: 1 },
          { type: 'mat', id: 'gem_sun', qty: 1 },
          { type: 'mat', id: 'gem_abyss', qty: 1 },
          { type: 'recipe', id: 'dagger_catspaw' },
          { type: 'recipe', id: 'helm_dominion' },
          { type: 'recipe', id: 'chest_fafnir' },
          { type: 'recipe', id: 'shield_vibranium' },
          { type: 'recipe', id: 'gloves_thor' },
          { type: 'recipe', id: 'cloak_levitation' },
        ],
        UR: [
          { type: 'mat', id: 'star_iron', qty: 2 },
          { type: 'mat', id: 'norn_thread', qty: 2 },
          { type: 'mat', id: 'star_core', qty: 1 },
          { type: 'mat', id: 'gem_time', qty: 1 },
        ]
      }
    },
    {
      id: 'astral_banner',
      name: '时空星界神炉池',
      tag: '星钻特供',
      tagCss: 'pill-ur',
      currency: 'gems',
      cost1: 2,
      cost10: 18,
      bannerImg: 'assets/banners/banner_astral.png',
      sprite: 'gem',
      palette: ['#ffffff', '#ff7cf0', '#5a2bd6'],
      desc: '保底全 SR+！专精【光·暗·时·空·运】顶级本源符文、时间/空间/福灵宝石、原初星陨神金与至高神器图纸！',
      rates: { N: 0, R: 0, SR: 58, SSR: 31, UR: 11 },
      pools: {
        SR: [
          { type: 'mat', id: 'adamantium', qty: 3 },
          { type: 'mat', id: 'dragonglass', qty: 3 },
          { type: 'mat', id: 'dragon_blood', qty: 2 },
          { type: 'mat', id: 'rune_light', qty: 2 },
          { type: 'mat', id: 'rune_dark', qty: 2 },
          { type: 'mat', id: 'gem_gold', qty: 1 },
          { type: 'mat', id: 'gem_ruby', qty: 1 },
          { type: 'mat', id: 'gem_sapphire', qty: 1 },
          { type: 'dust', qty: 14 },
          { type: 'recipe', id: 'staff_gandalf' },
          { type: 'recipe', id: 'bow_apollo' },
          { type: 'recipe', id: 'spear_gaebolg' },
          { type: 'recipe', id: 'shield_hylian' },
        ],
        SSR: [
          { type: 'mat', id: 'vibranium', qty: 3 },
          { type: 'mat', id: 'uru_metal', qty: 3 },
          { type: 'mat', id: 'smaug_scale', qty: 3 },
          { type: 'mat', id: 'world_branch', qty: 3 },
          { type: 'mat', id: 'philosopher_stone', qty: 2 },
          { type: 'mat', id: 'pandora_spark', qty: 2 },
          { type: 'mat', id: 'rune_time', qty: 1 },
          { type: 'mat', id: 'rune_space', qty: 1 },
          { type: 'mat', id: 'rune_luck', qty: 1 },
          { type: 'mat', id: 'gem_sun', qty: 1 },
          { type: 'mat', id: 'gem_abyss', qty: 1 },
          { type: 'recipe', id: 'wand_elder' },
          { type: 'recipe', id: 'bow_houyi' },
          { type: 'recipe', id: 'sword_excalibur' },
          { type: 'recipe', id: 'spear_gungnir' },
          { type: 'recipe', id: 'hammer_mjolnir' },
          { type: 'recipe', id: 'helm_helios' },
          { type: 'recipe', id: 'chest_celestial' },
          { type: 'recipe', id: 'shield_aegis' },
          { type: 'recipe', id: 'gloves_infinity' },
          { type: 'recipe', id: 'boots_cloud' },
          { type: 'recipe', id: 'cloak_invisibility' },
        ],
        UR: [
          { type: 'mat', id: 'star_iron', qty: 3 },
          { type: 'mat', id: 'norn_thread', qty: 2 },
          { type: 'mat', id: 'star_core', qty: 1 },
          { type: 'mat', id: 'rune_star', qty: 1 },
          { type: 'mat', id: 'gem_time', qty: 1 },
          { type: 'mat', id: 'gem_space', qty: 1 },
          { type: 'mat', id: 'gem_luck', qty: 1 },
        ]
      }
    }
  ];

  // Adventurer Customers (Expanded preferences for all new elements!)
  const CUSTOMER_ARCHETYPES = [
    {
      id: 'hero', name: '勇者阿伦', role: '王城讨伐队', sprite: 'cust_hero',
      img: 'assets/chars/cust_hero.png',
      prefCat: 'weapon', prefTags: ['火', '光', '金', '龙'],
      quotes: [
        '讨伐魔王迫在眉睫！给我锻把带【火/光/金】词条的神剑或长枪吧！',
        '听说这里能打造誓约胜利之剑，预算完全不是问题！'
      ]
    },
    {
      id: 'mage', name: '大法师薇拉', role: '星塔秘术师', sprite: 'cust_mage',
      img: 'assets/chars/cust_mage.png',
      prefCat: 'weapon', prefTags: ['时', '空', '水', '雷', '星'],
      quotes: [
        '能引动【时·空·星·水】之力的法器与附魔兵器，星塔愿出双倍高价！',
        '若能附带元素共鸣，老身再额外赠送你星钻哦~'
      ]
    },
    {
      id: 'ranger', name: '游侠林恩', role: '幽暗密林哨兵', sprite: 'cust_ranger',
      img: 'assets/chars/cust_ranger.png',
      prefCat: 'all', prefTags: ['木', '风', '毒', '运'],
      quotes: [
        '精灵林地偏爱【木·风·毒·运】属性的弓箭、披风或轻靴！',
        '轻盈致命的精品装备，开个实在价吧老板！'
      ]
    },
    {
      id: 'paladin', name: '圣骑士罗兰', role: '曙光盾卫团', sprite: 'cust_paladin',
      img: 'assets/chars/cust_paladin.png',
      prefCat: 'armor', prefTags: ['土', '光', '水', '金'],
      quotes: [
        '前线急需高防圣铠与神盾！带【土·光·水】词条我直接高价秒收！',
        '愿圣光庇佑你的星炉，让我看看你最硬的防具！'
      ]
    },
    {
      id: 'assassin', name: '影刃卡洛', role: '夜鸦兄弟会', sprite: 'cust_assassin',
      img: 'assets/chars/cust_assassin.png',
      prefCat: 'weapon', prefTags: ['暗', '血', '毒', '空'],
      quotes: [
        '嘘……给我一把带【暗·血·毒】词条的匕首、刺剑或妖刀，金币立付。',
        '淬过暗影与空间之力的利刃，在黑市可是一金难求。'
      ]
    },
    {
      id: 'noble', name: '公爵收藏家', role: '王室珍宝阁', sprite: 'cust_noble',
      img: 'assets/chars/cust_noble.png',
      prefCat: 'all', prefTags: ['商', '运', '魂', '星', '龙'],
      quotes: [
        '本公爵专收蕴含【运·商·魂·星】或镶嵌无限宝石的典故藏品！',
        '只要够华丽、够稀有，金币不过是一串数字罢了！'
      ]
    }
  ];

  // Workshop Upgrades
  const UPGRADES = [
    {
      id: 'furnace', name: '星焰神炉', maxLevel: 6, baseCost: 220, costMult: 2.1,
      effectText: (lv) => `基础锻造品质分 +${lv * 8}，熔炉星焰升级，显著提高 SSR/UR 概率`
    },
    {
      id: 'anvil', name: '乌鲁秘银铁砧', maxLevel: 5, baseCost: 280, costMult: 2.25,
      effectText: (lv) => `强化成功率 +${lv * 4}%，Lv.2 / Lv.4 各解锁 +1 基础词条上限`
    },
    {
      id: 'counter', name: '黄金珍宝柜台', maxLevel: 6, baseCost: 200, costMult: 2.0,
      effectText: (lv) => `所有装备售卖基础价格 +${lv * 10}%，吸引更豪爽的收藏家`
    },
    {
      id: 'storage', name: '次元装备仓库', maxLevel: 6, baseCost: 150, costMult: 1.85,
      effectText: (lv) => `仓库容量扩展至 ${24 + lv * 12} 格，囤积更多神兵`
    },
    {
      id: 'apprentice', name: '矮人大师帮工', maxLevel: 5, baseCost: 300, costMult: 2.15,
      effectText: (lv) => `每天开始自动赠送 ${lv * 2} 附魔尘 + 高阶矿石 ×2`
    }
  ];

  // Blacksmith Levels (XP -> Level -> Skill Points!)
  const LEVEL_TITLES = [
    '学徒铁匠', '熟手铁匠', '精工匠人', '附魔巧匠', '秘银铸师',
    '龙焰大师', '星炉宗师', '王城御用匠', '神话锻造师', '创世神匠'
  ];

  function xpForLevel(lv) {
    // Cumulative XP needed to reach level `lv` (lv starts at 1)
    if (lv <= 1) return 0;
    return Math.round(60 * Math.pow(lv - 1, 1.55) + 40 * (lv - 1));
  }

  function getTitleForLevel(lv) {
    const idx = Math.min(LEVEL_TITLES.length - 1, Math.floor((lv - 1) / 2));
    return LEVEL_TITLES[idx];
  }

  global.GameData = {
    RARITIES,
    RARITY_ORDER,
    AFFIX_TIERS,
    ELEMENTS,
    MATERIALS,
    RECIPE_SUBCATS,
    RECIPES,
    AFFIXES,
    SKILL_TREE,
    GACHA_BANNERS,
    CUSTOMER_ARCHETYPES,
    UPGRADES,
    xpForLevel,
    getTitleForLevel,
  };
})(window);
