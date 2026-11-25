/* =====================================================
   星炉铁匠铺 v2.0 — Core Game Engine
   52 Fantasy Recipes | 56 Lore Materials | 18 Elements & Synergies
   Blacksmith Leveling + 12-Skill Tree | High-Res Pixel Art
   ===================================================== */

(function () {
  const {
    RARITIES, RARITY_ORDER, AFFIX_TIERS, ELEMENTS, MATERIALS,
    RECIPE_SUBCATS, RECIPES, AFFIXES, SKILL_TREE,
    GACHA_BANNERS, CUSTOMER_ARCHETYPES, UPGRADES,
    xpForLevel, getTitleForLevel
  } = window.GameData;

  const SAVE_KEY = 'pixel_forge_gacha_save_v2';

  // ---- Runtime UI / Transient State ----
  let state = null;
  let activeTab = 'forge';
  let selectedItemId = null;
  let selectedRecipeId = 'sword_knight';
  let recipeSubCatFilter = 'all';
  let selectedPrimaryMat = 'copper_ore';
  let selectedSecondaryMat = 'oak_wood';
  let selectedCatalystMat = 'none';
  let activeBannerId = 'mine_banner';
  let marketCatFilter = 'all';
  let lastGachaAction = null;
  let currentGachaCards = [];
  let forgeSession = null;
  let auctionSession = null;

  // ---- Helper Utilities ----
  const $ = (id) => document.getElementById(id);
  const rand = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const uid = () => 'eq_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);

  function getRecipe(id) {
    return RECIPES.find((r) => r.id === id) || RECIPES[0];
  }
  function getAffixDef(id) {
    return AFFIXES.find((a) => a.id === id);
  }
  function getBanner(id) {
    return GACHA_BANNERS.find((b) => b.id === id) || GACHA_BANNERS[0];
  }
  function getSkillLv(skillId) {
    return (state && state.skills && state.skills[skillId]) || 0;
  }

  function getMaxInventory() {
    return 24 + ((state.upgrades.storage || 1) - 1) * 12;
  }

  function getMaxAffixSlots(rarityCode) {
    const base = RARITIES[rarityCode].baseSlots;
    const anvilLv = state.upgrades.anvil || 1;
    const anvilBonus = (anvilLv >= 2 ? 1 : 0) + (anvilLv >= 4 ? 1 : 0);
    const skillBonus = getSkillLv('extra_slot');
    return Math.min(7, base + anvilBonus + skillBonus);
  }

  function logActivity(msg) {
    const el = $('activity-log');
    if (el) {
      el.textContent = msg;
      el.title = msg;
    }
  }

  function showToast(msg, type = '') {
    const container = $('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast' + (type ? ` toast-${type}` : '');
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 220);
    }, 2600);
  }

  // Safe image tag with pixel-matrix fallback
  function getItemArtUrl(item) {
    return Sprites.getRecipeImgUrl(item.recipeId);
  }
  function getItemFallbackUrl(item) {
    const recipe = getRecipe(item.recipeId);
    return Sprites.renderMatrix(recipe.sprite, item.palette, item.aura, 3);
  }
  function getMatArtUrl(matId) {
    return Sprites.getMatImgUrl(matId);
  }
  function getMatFallbackUrl(matId) {
    const m = MATERIALS[matId];
    if (!m) return Sprites.getNamedIcon('ore_iron', 3);
    return Sprites.renderMatrix(m.sprite, m.palette, null, 3);
  }

  function elemBadgeHtml(tag) {
    const meta = ELEMENTS[tag] || { color: '#d6c8e8', bg: '#2c2333' };
    return `<span class="elem-badge" style="color:${meta.color};background:${meta.bg};">${tag}</span>`;
  }

  // ---- Initial Fresh State ----
  function createFreshState() {
    const unlockedRecipes = {};
    RECIPES.forEach((r) => {
      if (r.starter) unlockedRecipes[r.id] = true;
    });

    return {
      gold: 600,
      gems: 15,
      dust: 20,
      day: 1,
      level: 1,
      xp: 0,
      skillPoints: 1, // Start with 1 SP so players can try the skill tree immediately!
      skills: {},
      soundOn: true,
      materials: {
        copper_ore: 6,
        iron_ore: 4,
        silver_ore: 2,
        steel_ingot: 2,
        mithril_ore: 2,
        oak_wood: 6,
        beast_hide: 4,
        moon_silk: 2,
        ember_coal: 2,
        bless_charm: 2,
        rune_fire: 1,
        rune_time: 1,
        rune_luck: 1,
        gem_ruby: 1,
      },
      unlockedRecipes,
      inventory: [],
      customers: [],
      marketPrices: {},
      pity: {
        mine_banner: { sr: 0, ssr: 0 },
        ruin_banner: { sr: 0, ssr: 0 },
        astral_banner: { sr: 0, ssr: 0 },
      },
      upgrades: {
        furnace: 1,
        anvil: 1,
        counter: 1,
        storage: 1,
        apprentice: 1,
      },
      codex: {},
      stats: {
        forged: 0,
        sold: 0,
        earnedGold: 0,
        gachaPulls: 0,
        ssrCount: 0,
        enchants: 0,
      }
    };
  }

  // ---- Save & Load ----
  function saveGame(silent = true) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      if (!silent) {
        SFX.click();
        showToast('游戏存档已保存！', 'success');
      }
    } catch (e) {
      console.error('Save failed:', e);
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const base = createFreshState();
        state = Object.assign(base, parsed);
        state.upgrades = Object.assign(base.upgrades, parsed.upgrades || {});
        state.skills = Object.assign({}, parsed.skills || {});
        state.pity = Object.assign(base.pity, parsed.pity || {});
        state.stats = Object.assign(base.stats, parsed.stats || {});
        state.unlockedRecipes = Object.assign(base.unlockedRecipes, parsed.unlockedRecipes || {});
        if (!state.marketPrices || Object.keys(state.marketPrices).length === 0) rollMarketPrices();
        if (!state.customers || state.customers.length === 0) generateCustomers();
        state.inventory.forEach(recalcItem);
        return;
      }
    } catch (e) {
      console.warn('Load failed, creating fresh state:', e);
    }
    state = createFreshState();
    rollMarketPrices();
    generateCustomers();
  }

  // ---- Elemental Resonance Synergies ----
  function computeSynergies(item) {
    const tags = new Set();
    (item.affixes || []).forEach((af) => {
      const d = getAffixDef(af.id);
      if (d && d.tag) tags.add(d.tag);
    });
    // Gems also contribute their elemental tag!
    if (item.gemId) {
      const gemTagMap = {
        gem_gold: '金', gem_emerald: '木', gem_sapphire: '水', gem_ruby: '火', gem_topaz: '土',
        gem_sun: '光', gem_abyss: '暗', gem_time: '时', gem_space: '空', gem_luck: '运'
      };
      if (gemTagMap[item.gemId]) tags.add(gemTagMap[item.gemId]);
    }

    const active = [];
    if (tags.has('时') && tags.has('空')) {
      active.push({ name: '时空主宰 [时+空]', powerBonus: 0.20, valBonus: 0.40 });
    }
    if (tags.has('光') && tags.has('暗')) {
      active.push({ name: '光暗交响 [光+暗]', powerBonus: 0.18, valBonus: 0.35 });
    }
    const wuxing = ['金', '木', '水', '火', '土'].filter((e) => tags.has(e));
    if (wuxing.length >= 3) {
      active.push({ name: `五行大圆满 (${wuxing.length}行)`, powerBonus: 0.25, valBonus: 0.55 });
    } else {
      const pairs = [['金', '水'], ['水', '木'], ['木', '火'], ['火', '土'], ['土', '金']];
      const hit = pairs.find(([a, b]) => tags.has(a) && tags.has(b));
      if (hit) {
        active.push({ name: `五行相生 [${hit[0]}+${hit[1]}]`, powerBonus: 0.12, valBonus: 0.25 });
      }
    }
    if (tags.has('运') && (tags.has('商') || tags.has('星'))) {
      active.push({ name: '天命所归 [运+商/星]', powerBonus: 0.08, valBonus: 0.45 });
    }
    return active;
  }

  // ---- Equipment Stats & Value Calculator ----
  function recalcItem(item) {
    const recipe = getRecipe(item.recipeId);
    const prim = MATERIALS[item.primaryMatId] || MATERIALS.copper_ore;
    const sec = MATERIALS[item.secondaryMatId] || MATERIALS.oak_wood;
    const rar = RARITIES[item.rarity] || RARITIES.N;

    const enhStatMult = 1 + item.level * 0.14;
    const enhValMult = 1 + item.level * 0.18;

    let atk = Math.round(recipe.baseStats.atk * prim.powerMult * (0.85 + sec.powerMult * 0.15) * rar.statMult * enhStatMult);
    let def = Math.round(recipe.baseStats.def * prim.powerMult * (0.85 + sec.powerMult * 0.15) * rar.statMult * enhStatMult);
    let hp  = Math.round(recipe.baseStats.hp  * prim.powerMult * (0.85 + sec.powerMult * 0.15) * rar.statMult * enhStatMult);
    let crit = Math.round(recipe.baseStats.crit + (rar.order - 1) * 2 + item.level * 0.6);

    let affixValBonus = 0;

    (item.affixes || []).forEach((af) => {
      const d = getAffixDef(af.id);
      const tierObj = AFFIX_TIERS[af.tier] || AFFIX_TIERS.C;
      affixValBonus += tierObj.valBonus;
      if (!d) return;
      switch (d.stat) {
        case 'atk': atk += af.val; break;
        case 'def': def += af.val; break;
        case 'hp': hp += af.val; break;
        case 'crit': crit += af.val; break;
        case 'defHp': def += af.val; hp += af.val * 3; break;
        case 'atkDef': atk += af.val; def += af.val; break;
        case 'atkHp': atk += af.val; hp += af.val * 3; break;
        case 'atkCrit': atk += af.val; crit += Math.max(2, Math.round(af.val * 0.45)); break;
        case 'timeStat': crit += af.val; affixValBonus += (af.val * 3) / 100; break;
        case 'spaceStat': atk += af.val; def += af.val; affixValBonus += (af.val * 2) / 100; break;
        case 'luckStat': crit += Math.max(2, Math.round(af.val * 0.25)); affixValBonus += af.val / 100; break;
        case 'valPct': affixValBonus += af.val / 100; break;
        case 'all': atk += af.val; def += af.val; hp += af.val * 3; affixValBonus += 0.24; break;
      }
    });

    // Gem infusion bonuses
    let gemValBonus = 0;
    if (item.gemId && MATERIALS[item.gemId]) {
      const gem = MATERIALS[item.gemId];
      if (gem.statBonus) {
        if (gem.statBonus.atkPct) atk = Math.round(atk * (1 + gem.statBonus.atkPct));
        if (gem.statBonus.defPct) def = Math.round(def * (1 + gem.statBonus.defPct));
        if (gem.statBonus.hpPct)  hp  = Math.round(hp  * (1 + gem.statBonus.hpPct));
        if (gem.statBonus.critAdd) crit += gem.statBonus.critAdd;
      }
      gemValBonus = gem.valBonus || 0;
    }

    // Elemental Resonance Synergies
    const synergies = computeSynergies(item);
    let synPowerBonus = 0;
    let synValBonus = 0;
    synergies.forEach((s) => {
      synPowerBonus += s.powerBonus;
      synValBonus += s.valBonus;
    });

    const baseVal = (prim.valueBase * recipe.primaryNeed * 0.68 + (sec.valueAdd || 22) * recipe.secondaryNeed) * recipe.valMult;
    const counterBonus = 1 + ((state ? state.upgrades.counter : 1) - 1) * 0.10;
    const appraiseSkill = 1 + getSkillLv('royal_appraise') * 0.08;
    const rawValue = baseVal * rar.valMult * enhValMult * (1 + affixValBonus + gemValBonus + synValBonus) * counterBonus * appraiseSkill;

    item.stats = { atk, def, hp, crit };
    item.synergies = synergies;
    item.power = Math.round((atk * 2.4 + def * 2.2 + hp * 0.55 + crit * 3.5) * (1 + synPowerBonus));
    item.value = Math.max(25, Math.round(rawValue));
    item.palette = prim.palette;
    item.aura = (item.gemId && MATERIALS[item.gemId]) ? MATERIALS[item.gemId].aura : null;
    return item;
  }

  // ---- Blacksmith XP & Level Up ----
  function addXp(amount) {
    state.xp += amount;
    let leveled = 0;
    while (state.xp >= xpForLevel(state.level + 1)) {
      state.level += 1;
      state.skillPoints += 1;
      state.gems += 2;
      leveled += 1;
    }
    if (leveled > 0) {
      SFX.upgrade();
      const title = getTitleForLevel(state.level);
      showToast(`升级！成为 Lv.${state.level} ${title}！获得 +${leveled} 技能点 & +${leveled * 2} 星钻！`, 'ssr');
      logActivity(`铁匠等级晋升至 Lv.${state.level} ${title}！快去【技能树】加点吧！`);
    }
  }

  function upgradeSkill(skillId) {
    const def = SKILL_TREE.find((s) => s.id === skillId);
    if (!def) return;
    const curLv = getSkillLv(skillId);
    if (curLv >= def.maxLv) return;
    if (state.level < def.reqLevel) {
      SFX.fail();
      showToast(`需要铁匠等级达到 Lv.${def.reqLevel} 才能学习此技能！`, 'error');
      return;
    }
    if (state.skillPoints < 1) {
      SFX.fail();
      showToast('技能点不足！多锻造、附魔、卖装备即可升级获得技能点。', 'error');
      return;
    }

    state.skillPoints -= 1;
    state.skills[skillId] = curLv + 1;
    state.inventory.forEach(recalcItem);

    SFX.upgrade();
    WorkshopCanvas.triggerEnchant('#ffcf40', `${def.name} Lv.${curLv + 1}!`);
    showToast(`学会技能【${def.name} Lv.${curLv + 1}】！`, 'ssr');
    logActivity(`消耗 1 技能点将【${def.name}】提升至 Lv.${curLv + 1}！`);
    saveGame(true);
    renderAll();
  }

  function resetSkills() {
    const spent = Object.values(state.skills || {}).reduce((a, b) => a + b, 0);
    if (spent === 0) {
      showToast('当前尚未分配任何技能点，无需重置。', 'error');
      return;
    }
    if (state.gold < 120) {
      SFX.fail();
      showToast('技能洗点需要 120G！', 'error');
      return;
    }
    state.gold -= 120;
    state.skillPoints += spent;
    state.skills = {};
    state.inventory.forEach(recalcItem);
    SFX.enchant();
    showToast(`技能树已重置！返还全部 ${spent} 点技能点。`, 'success');
    saveGame(true);
    renderAll();
  }

  // ---- Affix Rolling ----
  function rollTier(minTier = 'C', qualityBoost = 0) {
    const tiers = ['C', 'B', 'A', 'S', 'SS'];
    const minIdx = Math.max(0, tiers.indexOf(minTier));
    const skillMult = 1 + getSkillLv('affix_luck') * 0.22;
    const weights = tiers.map((t, idx) => {
      if (idx < minIdx) return 0;
      let w = AFFIX_TIERS[t].weight;
      if (idx >= 2) {
        w = (w + qualityBoost * (idx === 2 ? 0.25 : idx === 3 ? 0.14 : 0.06)) * skillMult;
      }
      return w;
    });
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < tiers.length; i++) {
      r -= weights[i];
      if (r <= 0) return tiers[i];
    }
    return tiers[minIdx];
  }

  function createAffixInstance(affixDef, tierCode) {
    const t = AFFIX_TIERS[tierCode] || AFFIX_TIERS.C;
    const raw = rand(affixDef.baseMin, affixDef.baseMax) * t.mult;
    return {
      id: affixDef.id,
      tier: tierCode,
      val: Math.max(1, Math.round(raw)),
      locked: false,
    };
  }

  function rollRandomAffix(category, existingIds = [], minTier = 'C', qualityBoost = 0) {
    let candidates = AFFIXES.filter(
      (a) => (a.appliesTo === 'all' || a.appliesTo === category) && !existingIds.includes(a.id)
    );
    if (candidates.length === 0) {
      candidates = AFFIXES.filter((a) => a.appliesTo === 'all' || a.appliesTo === category);
    }
    const chosen = pick(candidates);
    const tier = rollTier(minTier, qualityBoost);
    return createAffixInstance(chosen, tier);
  }

  // ---- Quality Score -> Rarity Odds ----
  function computeRarityOdds(qualityScore) {
    const q = Math.max(0, qualityScore);
    let wN   = Math.max(0, 58 - q * 0.56);
    let wR   = Math.max(2, 34 + q * 0.12 - Math.max(0, q - 68) * 0.35);
    let wSR  = Math.max(4, 6.5 + q * 0.30 - Math.max(0, q - 135) * 0.22);
    let wSSR = Math.max(1, 1.4 + Math.max(0, q - 14) * 0.25);
    let wUR  = Math.max(0.2, 0.25 + Math.max(0, q - 52) * 0.15);

    if (q >= 122) wN = 0;
    if (q >= 168) wR = 0;

    const total = wN + wR + wSR + wSSR + wUR;
    return {
      N:   +(wN / total * 100).toFixed(1),
      R:   +(wR / total * 100).toFixed(1),
      SR:  +(wSR / total * 100).toFixed(1),
      SSR: +(wSSR / total * 100).toFixed(1),
      UR:  +(wUR / total * 100).toFixed(1),
    };
  }

  function rollRarityFromOdds(odds) {
    let r = Math.random() * 100;
    for (const code of RARITY_ORDER) {
      r -= odds[code];
      if (r <= 0) return code;
    }
    return 'SR';
  }

  function getBaseForgeQualityScore() {
    const prim = MATERIALS[selectedPrimaryMat] || MATERIALS.copper_ore;
    const sec = MATERIALS[selectedSecondaryMat] || MATERIALS.oak_wood;
    const cat = selectedCatalystMat !== 'none' ? MATERIALS[selectedCatalystMat] : null;
    const furnaceBonus = (state.upgrades.furnace - 1) * 8;
    const skillBonus = getSkillLv('forge_heat') * 7;
    return (prim.qualityBonus || 0) + (sec.qualityBonus || 0) + (cat ? cat.qualityBonus : 0) + furnaceBonus + skillBonus;
  }

  // ---- Market Pricing ----
  function rollMarketPrices() {
    const prices = {};
    Object.values(MATERIALS).forEach((m) => {
      if (!m.shopBuyable) return;
      const roll = Math.random();
      let mult = 1.0;
      let tag = 'normal';
      if (roll < 0.28) {
        mult = rand(0.72, 0.85);
        tag = 'discount';
      } else if (roll > 0.82) {
        mult = rand(1.12, 1.24);
        tag = 'surge';
      } else {
        mult = rand(0.94, 1.06);
      }
      prices[m.id] = {
        price: Math.max(5, Math.round(m.basePrice * mult)),
        tag
      };
    });
    state.marketPrices = prices;
  }

  // ---- Customer Generation ----
  function generateCustomers() {
    const shuffled = [...CUSTOMER_ARCHETYPES].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, 3);
    const counterLv = state.upgrades.counter || 1;

    state.customers = chosen.map((arch, idx) => {
      const wantCat = arch.prefCat === 'all' ? (Math.random() > 0.5 ? 'weapon' : 'armor') : arch.prefCat;
      const wantTag = pick(arch.prefTags);
      let minRarity = 'N';
      if (arch.id === 'noble' || (state.level >= 4 && Math.random() < 0.45)) minRarity = 'R';
      if ((arch.id === 'noble' && state.level >= 3) || (state.level >= 7 && Math.random() < 0.35)) minRarity = 'SR';

      const wantEnhance = Math.random() < 0.3 ? randInt(1, Math.min(3, Math.max(1, Math.floor(state.level / 2)))) : 0;
      const baseBonus = +(1.34 + (counterLv - 1) * 0.06 + (minRarity === 'SR' ? 0.30 : minRarity === 'R' ? 0.14 : 0) + Math.random() * 0.18).toFixed(2);

      return {
        uid: 'cust_' + Date.now() + '_' + idx,
        archetypeId: arch.id,
        name: arch.name,
        role: arch.role,
        sprite: arch.sprite,
        img: arch.img,
        quote: pick(arch.quotes),
        wantCat,
        wantTag,
        minRarity,
        wantEnhance,
        offerMult: baseBonus,
        haggleCount: 0,
        patience: 100,
      };
    });
    WorkshopCanvas.syncState(state);
  }

  function evaluateCustomerOffer(customer, item) {
    if (!item) return { matches: false, price: 0, mult: customer.offerMult, checks: {} };
    const recipe = getRecipe(item.recipeId);
    const catOk = recipe.category === customer.wantCat;
    const rarOk = RARITIES[item.rarity].order >= RARITIES[customer.minRarity].order;
    const tagOk = (item.affixes || []).some((af) => {
      const d = getAffixDef(af.id);
      return d && d.tag === customer.wantTag;
    });
    const enhOk = customer.wantEnhance === 0 || item.level >= customer.wantEnhance;

    const coreMatch = catOk && rarOk;
    let finalMult = customer.offerMult;
    if (tagOk) finalMult += 0.35;
    if (customer.wantEnhance > 0 && enhOk) finalMult += 0.22;
    if (item.gemId) finalMult += 0.16;

    const price = Math.round(item.value * finalMult);
    return {
      matches: coreMatch,
      price,
      mult: +finalMult.toFixed(2),
      checks: { catOk, rarOk, tagOk, enhOk }
    };
  }

  // =====================================================
  // FORGING FLOW (Interactive Minigame + Auto Forge)
  // =====================================================

  function canForgeSelected() {
    const recipe = getRecipe(selectedRecipeId);
    if (!recipe || !state.unlockedRecipes[recipe.id]) return { ok: false, reason: '未解锁图纸' };
    if (state.inventory.length >= getMaxInventory()) return { ok: false, reason: '装备仓库已满！请先售卖或扩建' };
    if (state.gold < recipe.forgeGold) return { ok: false, reason: `金币不足 (需 ${recipe.forgeGold}G)` };

    const pHave = state.materials[selectedPrimaryMat] || 0;
    const sHave = state.materials[selectedSecondaryMat] || 0;
    if (pHave < recipe.primaryNeed) return { ok: false, reason: '主锻造材料不足' };
    if (sHave < recipe.secondaryNeed) return { ok: false, reason: '辅材不足' };
    if (selectedCatalystMat !== 'none' && (state.materials[selectedCatalystMat] || 0) < 1) {
      return { ok: false, reason: '催化剂不足' };
    }
    return { ok: true };
  }

  function startForge() {
    if (forgeSession) return;
    const check = canForgeSelected();
    if (!check.ok) {
      SFX.fail();
      showToast(check.reason, 'error');
      return;
    }

    const recipe = getRecipe(selectedRecipeId);
    state.gold -= recipe.forgeGold;

    // Skill: mat_saver (巧夺天工 — chance to save primary material!)
    const saveChance = getSkillLv('mat_saver') * 0.08;
    const savedPrimary = saveChance > 0 && Math.random() < saveChance;
    if (!savedPrimary) {
      state.materials[selectedPrimaryMat] -= recipe.primaryNeed;
    } else {
      showToast(`触发技能【巧夺天工】！本次免消耗 ${MATERIALS[selectedPrimaryMat].name} ×${recipe.primaryNeed}！`, 'ssr');
    }

    state.materials[selectedSecondaryMat] -= recipe.secondaryNeed;
    const usedCatalyst = selectedCatalystMat !== 'none' ? selectedCatalystMat : null;
    if (usedCatalyst) {
      state.materials[usedCatalyst] -= 1;
      if (state.materials[usedCatalyst] <= 0) selectedCatalystMat = 'none';
    }

    const baseScore = getBaseForgeQualityScore();
    const autoForge = $('chk-auto-forge').checked;

    if (autoForge) {
      const eyeBonus = getSkillLv('golden_zone') * 4;
      let strikeScore = 0;
      const grades = [];
      for (let i = 0; i < 3; i++) {
        const r = Math.random();
        if (r < 0.25 + getSkillLv('golden_zone') * 0.05) { strikeScore += 28 + eyeBonus; grades.push('perfect'); }
        else if (r < 0.72) { strikeScore += 18; grades.push('great'); }
        else { strikeScore += 10; grades.push('good'); }
      }
      const bestGrade = grades.includes('perfect') ? 'perfect' : 'great';
      SFX.hammer(bestGrade);
      WorkshopCanvas.triggerHammer(bestGrade, '快速锻造!');
      finalizeForge(recipe, selectedPrimaryMat, selectedSecondaryMat, usedCatalyst, baseScore + strikeScore, strikeScore);
      return;
    }

    // Update golden zone bar width based on golden_zone skill!
    const eyeLv = getSkillLv('golden_zone');
    const perfectHalf = 4 + eyeLv * 1.4; // default 8% width -> up to 22% width!
    const zp = $('zone-perfect');
    if (zp) {
      zp.style.left = `${50 - perfectHalf}%`;
      zp.style.width = `${perfectHalf * 2}%`;
    }

    SFX.click();
    forgeSession = {
      recipe,
      primaryMat: selectedPrimaryMat,
      secondaryMat: selectedSecondaryMat,
      catalystMat: usedCatalyst,
      baseScore,
      strikeScore: 0,
      strikeCount: 0,
      cursorPos: 0,
      cursorDir: 1,
      speed: 1.55,
      perfectHalf,
      rafId: null,
    };

    $('forge-minigame-overlay').classList.remove('hidden');
    if (window.innerWidth <= 1080) {
      $('workshop-canvas').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    $('mini-strike-num').textContent = '1';
    $('mini-quality-score').textContent = `品质分: ${baseScore}`;
    $('mini-feedback').textContent = '瞄准金色中心按下空格或按钮!';
    renderHUD();
    renderForgeTab();
    runMinigameLoop();
  }

  function runMinigameLoop() {
    if (!forgeSession) return;
    forgeSession.cursorPos += forgeSession.cursorDir * forgeSession.speed;
    if (forgeSession.cursorPos >= 100) {
      forgeSession.cursorPos = 100;
      forgeSession.cursorDir = -1;
    } else if (forgeSession.cursorPos <= 0) {
      forgeSession.cursorPos = 0;
      forgeSession.cursorDir = 1;
    }
    const cursorEl = $('timing-cursor');
    if (cursorEl) cursorEl.style.left = `${forgeSession.cursorPos}%`;
    forgeSession.rafId = requestAnimationFrame(runMinigameLoop);
  }

  function handleHammerStrike() {
    if (!forgeSession) return;
    const dist = Math.abs(forgeSession.cursorPos - 50);
    const eyeBonus = getSkillLv('golden_zone') * 4;
    let add = 4;
    let grade = 'miss';
    let label = '偏斜 +4';
    let fb = '力道偏了 (+4)';

    if (dist <= forgeSession.perfectHalf + 1) {
      add = 28 + eyeBonus; grade = 'perfect'; label = `PERFECT! +${add}`; fb = `神匠暴击!! 品质分 +${add}`;
    } else if (dist <= 15) {
      add = 18; grade = 'great'; label = 'GREAT! +18'; fb = '极佳火候! 品质分 +18';
    } else if (dist <= 28) {
      add = 10; grade = 'good'; label = 'GOOD +10'; fb = '稳定敲击 (+10)';
    }

    forgeSession.strikeScore += add;
    forgeSession.strikeCount += 1;
    forgeSession.speed += 0.30;

    SFX.hammer(grade);
    WorkshopCanvas.triggerHammer(grade, label);
    $('mini-feedback').textContent = fb;
    $('mini-quality-score').textContent = `品质分: ${forgeSession.baseScore + forgeSession.strikeScore}`;

    if (forgeSession.strikeCount >= 3) {
      cancelAnimationFrame(forgeSession.rafId);
      const finished = forgeSession;
      forgeSession = null;
      setTimeout(() => {
        $('forge-minigame-overlay').classList.add('hidden');
        finalizeForge(
          finished.recipe,
          finished.primaryMat,
          finished.secondaryMat,
          finished.catalystMat,
          finished.baseScore + finished.strikeScore,
          finished.strikeScore
        );
      }, 280);
    } else {
      $('mini-strike-num').textContent = String(forgeSession.strikeCount + 1);
    }
  }

  function createForgedEquipment(recipe, primId, secId, catId, totalScore) {
    const odds = computeRarityOdds(totalScore);
    const rarity = rollRarityFromOdds(odds);
    const prim = MATERIALS[primId];
    const cat = catId ? MATERIALS[catId] : null;

    const maxSlots = getMaxAffixSlots(rarity);
    let initAffixCount = rarity === 'N' ? (Math.random() < 0.5 ? 1 : 0)
      : rarity === 'R' ? 1
      : rarity === 'SR' ? 2
      : rarity === 'SSR' ? 3 : 4;
    if (cat && cat.bonusAffix) initAffixCount += cat.bonusAffix;
    initAffixCount = Math.min(maxSlots, initAffixCount);

    const affixes = [];
    const minTier = rarity === 'UR' ? 'A' : rarity === 'SSR' ? 'B' : 'C';
    for (let i = 0; i < initAffixCount; i++) {
      const existing = affixes.map((a) => a.id);
      affixes.push(rollRandomAffix(recipe.category, existing, minTier, totalScore * 0.4));
    }

    const item = {
      id: uid(),
      recipeId: recipe.id,
      name: `${prim.prefix}${recipe.name}`,
      primaryMatId: primId,
      secondaryMatId: secId,
      rarity,
      level: 0,
      blessing: 0,
      affixes,
      gemId: null,
      locked: rarity === 'SSR' || rarity === 'UR',
      createdAt: Date.now(),
    };
    return recalcItem(item);
  }

  function finalizeForge(recipe, primId, secId, catId, totalScore, strikeScore) {
    const item = createForgedEquipment(recipe, primId, secId, catId, totalScore);
    state.inventory.unshift(item);
    selectedItemId = item.id;

    // Skill: twin_forge (双生神兵 — chance for bonus twin copy!)
    const twinChance = getSkillLv('twin_forge') * 0.07;
    let twinCrafted = false;
    if (twinChance > 0 && state.inventory.length < getMaxInventory() && Math.random() < twinChance) {
      const twin = createForgedEquipment(recipe, primId, secId, catId, totalScore);
      state.inventory.unshift(twin);
      state.stats.forged += 1;
      twinCrafted = true;
      showToast(`触发神技【双生神兵】！一炉双器额外产出 [${twin.rarity}] ${twin.name}！`, 'ssr');
    }

    state.stats.forged += 1;
    if (item.rarity === 'SSR' || item.rarity === 'UR') state.stats.ssrCount += 1;
    const prevCodex = state.codex[recipe.id];
    const isFirstCodex = !prevCodex;
    if (!prevCodex || RARITIES[item.rarity].order > RARITIES[prevCodex.highestRarity].order) {
      state.codex[recipe.id] = {
        highestRarity: item.rarity,
        count: (prevCodex ? prevCodex.count : 0) + 1
      };
    } else {
      prevCodex.count += 1;
    }

    const xpGain = (item.rarity === 'UR' ? 65 : item.rarity === 'SSR' ? 40 : item.rarity === 'SR' ? 24 : item.rarity === 'R' ? 14 : 9) + (isFirstCodex ? 20 : 0);
    addXp(xpGain);

    SFX.forgeComplete(item.rarity);
    WorkshopCanvas.syncState(state);
    if (item.rarity === 'SSR' || item.rarity === 'UR') {
      WorkshopCanvas.triggerEnchant('#ffcf40', `${item.rarity} 神装出世!`);
    }
    logActivity(`锻造出【${RARITIES[item.rarity].name} ${item.rarity}】${item.name}（估价 ${item.value}G，经验 +${xpGain}${twinCrafted ? '，触发双生神兵!' : ''}）！`);

    showForgeResultModal(item, strikeScore);
    saveGame(true);
    renderAll();
  }

  function showForgeResultModal(item, strikeScore) {
    const rar = RARITIES[item.rarity];
    $('forge-result-banner').textContent =
      item.rarity === 'UR' ? '★ 神话降临！传世神兵 ★'
      : item.rarity === 'SSR' ? '✦ 传说神装锻成！ ✦'
      : item.rarity === 'SR' ? '◆ 史诗精品出炉！ ◆'
      : '锻造完成！';

    const recipe = getRecipe(item.recipeId);
    Sprites.drawArtToCanvas($('result-item-canvas'), getItemArtUrl(item), recipe.sprite, item.palette, item.aura);

    const badge = $('result-rarity-badge');
    badge.className = `rarity-pill pill-${rar.css}`;
    badge.textContent = `${rar.code} ${rar.name}`;

    const nameEl = $('result-item-name');
    nameEl.className = `txt-${rar.css}`;
    nameEl.textContent = item.name;

    const gradeText = strikeScore >= 72 ? '火候评价: 神匠天工 (极高加成!)'
      : strikeScore >= 50 ? '火候评价: 炉火纯青 (大成功!)'
      : strikeScore >= 30 ? '火候评价: 稳健锻打'
      : '火候评价: 略显生疏';
    $('result-strike-grade').textContent = gradeText;

    $('result-stats').innerHTML = renderStatChipsHtml(item.stats);

    const synEl = $('result-synergy');
    if (item.synergies && item.synergies.length > 0) {
      synEl.classList.remove('hidden');
      synEl.innerHTML = item.synergies.map((s) => `<span class="synergy-pill">✦ 共鸣: ${s.name}</span>`).join('');
    } else {
      synEl.classList.add('hidden');
    }

    if (item.affixes.length === 0) {
      $('result-affixes').innerHTML = '<div class="affix-empty-slot">暂无初始词条 — 点击下方【立刻去附魔】铭刻五行与光暗时空运属性！</div>';
    } else {
      $('result-affixes').innerHTML = item.affixes.map((af) => {
        const d = getAffixDef(af.id);
        return `<div class="affix-row">
          <div class="affix-row-left">
            <span class="tier-badge tier-${af.tier}">${af.tier}</span>
            ${elemBadgeHtml(d.tag)}
            <span class="affix-name">${d.name}</span>
            <span class="affix-desc">${d.desc(af.val)}</span>
          </div>
        </div>`;
      }).join('');
    }

    $('result-item-val').textContent = `${item.value}G`;
    $('modal-forge-result').classList.remove('hidden');
  }

  // =====================================================
  // ENCHANTING, STRENGTHENING, REFORGING & GEM INFUSION
  // =====================================================

  function getSelectedItem() {
    if (!selectedItemId) return null;
    return state.inventory.find((i) => i.id === selectedItemId) || null;
  }

  function getEnchantDustCost(baseDust) {
    const alch = getSkillLv('dust_alchemy');
    return Math.max(1, baseDust - (alch >= 3 ? 1 : 0));
  }

  function trySpendDust(cost) {
    const freeChance = getSkillLv('dust_alchemy') * 0.12;
    if (freeChance > 0 && Math.random() < freeChance) {
      showToast('触发技能【粉尘炼金】！本次附魔免消耗附魔尘！', 'success');
      return;
    }
    state.dust -= cost;
  }

  function handleAddAffix() {
    const item = getSelectedItem();
    if (!item) return;
    const maxSlots = getMaxAffixSlots(item.rarity);
    if (item.affixes.length >= maxSlots) {
      SFX.fail();
      showToast('属性槽位已满！可洗练词条，或升级铁砧与技能【星纹扩槽】解锁新槽位！', 'error');
      return;
    }

    const runeChoice = $('enchant-rune-select').value;
    const dustCost = getEnchantDustCost(2 + item.affixes.length);
    const goldCost = 25 + item.affixes.length * 20;

    if (state.dust < dustCost) {
      SFX.fail();
      showToast(`附魔尘不足！需要 ${dustCost} 份附魔尘。`, 'error');
      return;
    }
    if (state.gold < goldCost) {
      SFX.fail();
      showToast(`金币不足！需要 ${goldCost}G。`, 'error');
      return;
    }

    let newAffix = null;
    const recipe = getRecipe(item.recipeId);
    const existingIds = item.affixes.map((a) => a.id);

    if (runeChoice !== 'random') {
      const runeMat = MATERIALS[runeChoice];
      if (!runeMat || (state.materials[runeChoice] || 0) < 1) {
        SFX.fail();
        showToast('所选定向符文数量不足！', 'error');
        return;
      }
      if (existingIds.includes(runeMat.affixId)) {
        SFX.fail();
        showToast('该装备已拥有此元素词条，无需重复铭刻！', 'error');
        return;
      }
      state.materials[runeChoice] -= 1;
      const afDef = getAffixDef(runeMat.affixId);
      const tier = rollTier(runeMat.minTier || 'B', 22);
      newAffix = createAffixInstance(afDef, tier);
    } else {
      newAffix = rollRandomAffix(recipe.category, existingIds, 'C', (state.upgrades.anvil - 1) * 10);
    }

    trySpendDust(dustCost);
    state.gold -= goldCost;
    const prevSynCount = (item.synergies || []).length;
    item.affixes.push(newAffix);
    recalcItem(item);
    state.stats.enchants += 1;
    addXp(8);

    const d = getAffixDef(newAffix.id);
    const newSyn = item.synergies.length > prevSynCount;
    SFX.enchant();
    WorkshopCanvas.triggerEnchant(ELEMENTS[d.tag] ? ELEMENTS[d.tag].color : '#c576ff', newSyn ? '触发元素共鸣!' : `+${d.name}[${newAffix.tier}]`);
    showToast(
      newSyn
        ? `附魔成功并激活元素共鸣【${item.synergies[item.synergies.length - 1].name}】！估值暴涨至 ${item.value}G！`
        : `附魔成功！新增 [${newAffix.tier}·${d.tag}] ${d.name} (${d.desc(newAffix.val)})`,
      newSyn ? 'ssr' : 'success'
    );
    logActivity(`为 ${item.name} 铭刻【${d.tag}·${d.name} ${newAffix.tier}】，估价 ${item.value}G！`);

    saveGame(true);
    renderAll();
  }

  function getStrengthenInfo(item) {
    const lv = item.level;
    const baseRates = [100, 92, 84, 74, 64, 54, 44, 34, 26, 18];
    const anvilBonus = (state.upgrades.anvil - 1) * 4;
    const skillBonus = getSkillLv('steady_hand') * 4;
    const useCharm = $('chk-use-charm') && $('chk-use-charm').checked && (state.materials.bless_charm || 0) > 0;
    let rate = (baseRates[lv] || 15) + anvilBonus + skillBonus + (useCharm ? 25 : 0);
    if (item.blessing >= 100) rate = 100;
    rate = clamp(rate, 5, 100);
    const goldCost = 30 + lv * 35;
    const dustCost = getEnchantDustCost(1 + Math.floor(lv / 2));
    return { rate, goldCost, dustCost, useCharm };
  }

  function handleStrengthen() {
    const item = getSelectedItem();
    if (!item) return;
    if (item.level >= 10) {
      showToast('已达到最高强化等级 +10！', 'success');
      return;
    }
    const info = getStrengthenInfo(item);
    if (state.gold < info.goldCost) {
      SFX.fail();
      showToast(`金币不足！需要 ${info.goldCost}G`, 'error');
      return;
    }
    if (state.dust < info.dustCost) {
      SFX.fail();
      showToast(`附魔尘不足！需要 ${info.dustCost} 份`, 'error');
      return;
    }

    state.gold -= info.goldCost;
    trySpendDust(info.dustCost);
    if (info.useCharm) state.materials.bless_charm -= 1;

    if (Math.random() * 100 < info.rate) {
      item.level += 1;
      item.blessing = 0;
      recalcItem(item);
      state.stats.enchants += 1;
      addXp(10 + item.level * 3);
      SFX.upgrade();
      WorkshopCanvas.triggerHammer('perfect', `强化 +${item.level}!`);
      showToast(`强化成功！${item.name} 提升至 +${item.level}（估价 ${item.value}G）`, 'success');
      logActivity(`${item.name} 强化至 +${item.level}，属性与售价大涨！`);
    } else {
      const blessAdd = 25 + getSkillLv('steady_hand') * 5;
      item.blessing = Math.min(100, (item.blessing || 0) + blessAdd);
      addXp(4);
      SFX.fail();
      WorkshopCanvas.triggerHammer('miss', '强化失败');
      showToast(`强化未成功，装备完好无损！祝福值 +${blessAdd}%（当前 ${item.blessing}%）`, 'error');
      logActivity(`${item.name} 强化失败，积累了 ${item.blessing}% 必成祝福值。`);
    }

    saveGame(true);
    renderAll();
  }

  function handleReforge() {
    const item = getSelectedItem();
    if (!item) return;
    if (item.affixes.length === 0) {
      SFX.fail();
      showToast('装备还没有属性词条，请先使用【铭刻新属性】！', 'error');
      return;
    }
    const unlockedCount = item.affixes.filter((a) => !a.locked).length;
    if (unlockedCount === 0) {
      SFX.fail();
      showToast('所有词条都被锁定了！请至少解锁一条再洗练。', 'error');
      return;
    }
    const lockedCount = item.affixes.length - unlockedCount;
    const dustCost = getEnchantDustCost(2 + lockedCount * 2);
    const goldCost = 40 + lockedCount * 35;

    if (state.dust < dustCost || state.gold < goldCost) {
      SFX.fail();
      showToast(`洗练需要 ${dustCost} 附魔尘 + ${goldCost}G`, 'error');
      return;
    }

    trySpendDust(dustCost);
    state.gold -= goldCost;

    const recipe = getRecipe(item.recipeId);
    const keptIds = item.affixes.filter((a) => a.locked).map((a) => a.id);
    const qualityBoost = (RARITIES[item.rarity].order - 1) * 8 + (state.upgrades.anvil - 1) * 10;

    item.affixes = item.affixes.map((af) => {
      if (af.locked) return af;
      const rolled = rollRandomAffix(recipe.category, keptIds, 'C', qualityBoost);
      keptIds.push(rolled.id);
      return rolled;
    });

    recalcItem(item);
    state.stats.enchants += 1;
    addXp(7);
    SFX.enchant();
    const hasSS = item.affixes.some((a) => a.tier === 'SS' || a.tier === 'S');
    WorkshopCanvas.triggerEnchant(hasSS ? '#ffcf40' : '#4de6d9', hasSS ? '洗出极品词条!' : '词条重铸!');
    showToast(hasSS ? '神手洗练！出现了 S/SS 级极品元素词条！' : '词条洗练完成！', hasSS ? 'ssr' : 'success');
    logActivity(`洗练了 ${item.name} 的属性词条，当前估价 ${item.value}G。`);

    saveGame(true);
    renderAll();
  }

  function handleInfuseGem() {
    const item = getSelectedItem();
    if (!item) return;
    const gemId = $('infuse-gem-select').value;
    if (!gemId || !MATERIALS[gemId] || (state.materials[gemId] || 0) < 1) {
      SFX.fail();
      showToast('没有可镶嵌的宝石！请前往【秘境抽卡】获取元素与无限宝石。', 'error');
      return;
    }

    state.materials[gemId] -= 1;
    item.gemId = gemId;
    recalcItem(item);
    state.stats.enchants += 1;
    addXp(14);

    const gem = MATERIALS[gemId];
    SFX.upgrade();
    WorkshopCanvas.triggerEnchant(gem.palette[1], `${gem.auraName}!`);
    showToast(`镶嵌【${gem.name}】成功！装备获得像素光环，估价升至 ${item.value}G！`, 'ssr');
    logActivity(`将 ${gem.name} 镶嵌到 ${item.name} 上，流光溢彩！`);

    saveGame(true);
    renderAll();
  }

  // =====================================================
  // GACHA SYSTEM
  // =====================================================

  function executeGacha(bannerId, count) {
    const banner = getBanner(bannerId);
    const cost = count === 10 ? banner.cost10 : banner.cost1;

    if (banner.currency === 'gold') {
      if (state.gold < cost) {
        SFX.fail();
        showToast(`金币不足！需要 ${cost}G`, 'error');
        return;
      }
      state.gold -= cost;
    } else {
      if (state.gems < cost) {
        SFX.fail();
        showToast(`星钻不足！需要 ${cost} 星钻（可用金币兑换或靠运词条成交爆星钻）`, 'error');
        return;
      }
      state.gems -= cost;
    }

    const pity = state.pity[banner.id] || (state.pity[banner.id] = { sr: 0, ssr: 0 });
    const luckBoost = getSkillLv('gacha_fortune') * 1.2;
    const results = [];

    for (let i = 0; i < count; i++) {
      pity.sr += 1;
      pity.ssr += 1;
      state.stats.gachaPulls += 1;

      let rarity = 'N';
      if (pity.ssr >= 40) {
        rarity = Math.random() < (banner.id === 'astral_banner' ? 0.36 : 0.20) ? 'UR' : 'SSR';
      } else if (pity.sr >= 10) {
        const r = Math.random() * 100;
        if (r < (banner.rates.UR || 0) + luckBoost * 0.4) rarity = 'UR';
        else if (r < (banner.rates.UR || 0) + (banner.rates.SSR || 0) + luckBoost) rarity = 'SSR';
        else rarity = 'SR';
      } else {
        const adjUR = (banner.rates.UR || 0) + luckBoost * 0.35;
        const adjSSR = (banner.rates.SSR || 0) + luckBoost * 0.65;
        let r = Math.random() * 100;
        if (r < adjUR) rarity = 'UR';
        else if (r < adjUR + adjSSR) rarity = 'SSR';
        else if (r < adjUR + adjSSR + (banner.rates.SR || 0)) rarity = 'SR';
        else if (r < adjUR + adjSSR + (banner.rates.SR || 0) + (banner.rates.R || 0)) rarity = 'R';
        else rarity = 'N';
      }

      if (RARITIES[rarity].order >= RARITIES.SR.order) pity.sr = 0;
      if (RARITIES[rarity].order >= RARITIES.SSR.order) pity.ssr = 0;

      const pool = banner.pools[rarity] || banner.pools.SR;
      const drop = pick(pool);
      results.push(grantGachaDrop(drop, rarity));
    }

    addXp(count * 3);
    lastGachaAction = { bannerId, count };
    currentGachaCards = results;

    SFX.gachaPull();
    const bestOrder = Math.max(...results.map((c) => RARITIES[c.rarity].order));
    if (bestOrder >= 4) {
      WorkshopCanvas.triggerEnchant('#ffcf40', '抽卡出金啦!!');
    }

    openGachaModal(banner, results);
    saveGame(true);
    renderAll();
  }

  function grantGachaDrop(drop, rarity) {
    if (drop.type === 'dust') {
      state.dust += drop.qty;
      return {
        rarity,
        title: `附魔粉尘 ×${drop.qty}`,
        sub: '属性附魔与强化材料',
        img: getMatArtUrl('enchant_dust_pack'),
        fallback: Sprites.getNamedIcon('enchant_dust', 3),
        revealed: false,
      };
    }
    if (drop.type === 'recipe') {
      const rec = getRecipe(drop.id);
      if (state.unlockedRecipes[drop.id]) {
        const gemRefund = rarity === 'SSR' ? 4 : 2;
        const dustRefund = rarity === 'SSR' ? 12 : 6;
        state.gems += gemRefund;
        state.dust += dustRefund;
        return {
          rarity,
          title: `图纸:${rec.name}`,
          sub: `已拥有 → 返还 ${gemRefund}星钻 + ${dustRefund}尘`,
          img: Sprites.getRecipeImgUrl(rec.id),
          fallback: Sprites.renderMatrix('blueprint', null, null, 3),
          revealed: false,
        };
      } else {
        state.unlockedRecipes[drop.id] = true;
        addXp(30);
        return {
          rarity,
          title: `新图纸:${rec.name}!`,
          sub: '已解锁奇幻典故图纸!',
          img: Sprites.getRecipeImgUrl(rec.id),
          fallback: Sprites.renderMatrix('blueprint', null, null, 3),
          revealed: false,
        };
      }
    }
    const mat = MATERIALS[drop.id];
    state.materials[drop.id] = (state.materials[drop.id] || 0) + drop.qty;
    return {
      rarity,
      title: `${mat.name} ×${drop.qty}`,
      sub: roleLabel(mat.role),
      img: getMatArtUrl(drop.id),
      fallback: getMatFallbackUrl(drop.id),
      revealed: false,
    };
  }

  function roleLabel(role) {
    const map = {
      primary: '主锻造神材',
      secondary: '锻造辅材',
      catalyst: '锻造催化剂',
      rune: '定向元素符文',
      gem: '元素觉醒宝石',
      consumable: '实用耗材',
    };
    return map[role] || '材料';
  }

  function openGachaModal(banner, cards) {
    $('gacha-modal-title').textContent = `${banner.name} — 召唤结果 (点击翻牌)`;
    const grid = $('gacha-cards-grid');
    grid.style.gridTemplateColumns = cards.length === 1 ? 'minmax(160px, 210px)' : '';
    grid.style.justifyContent = cards.length === 1 ? 'center' : '';

    renderGachaCards();
    $('modal-gacha').classList.remove('hidden');

    if (cards.length === 1) {
      setTimeout(() => revealCardAt(0), 150);
    }
  }

  function renderGachaCards() {
    const grid = $('gacha-cards-grid');
    const allRevealed = currentGachaCards.every((c) => c.revealed);
    const revBtn = $('btn-reveal-all');
    if (revBtn) revBtn.classList.toggle('hidden', allRevealed);

    grid.innerHTML = currentGachaCards.map((c, idx) => {
      const rar = RARITIES[c.rarity];
      if (!c.revealed) {
        const glowClass = c.rarity === 'UR' ? 'glow-ur' : c.rarity === 'SSR' ? 'glow-ssr' : c.rarity === 'SR' ? 'glow-sr' : '';
        return `<div class="gacha-card unrevealed ${glowClass}" data-card-idx="${idx}">
          <img src="${Sprites.getNamedIcon('chest', 3)}" alt="?" />
          <div class="gacha-card-name">点击开启</div>
          <div class="gacha-card-sub">${c.rarity === 'UR' ? '七彩神光!' : c.rarity === 'SSR' ? '金色传说光!' : c.rarity === 'SR' ? '紫色星光' : '神秘包裹'}</div>
        </div>`;
      }
      return `<div class="gacha-card rarity-${rar.css}" data-card-idx="${idx}">
        <span class="rarity-pill pill-${rar.css}">${rar.code}</span>
        <img src="${c.img}" onerror="this.onerror=null;this.src='${c.fallback}'" alt="${c.title}" />
        <div class="gacha-card-name txt-${rar.css}">${c.title}</div>
        <div class="gacha-card-sub">${c.sub}</div>
      </div>`;
    }).join('');

    grid.querySelectorAll('.gacha-card').forEach((el) => {
      el.addEventListener('click', () => revealCardAt(Number(el.dataset.cardIdx)));
    });
  }

  function revealCardAt(idx) {
    const c = currentGachaCards[idx];
    if (!c || c.revealed) return;
    c.revealed = true;
    SFX.gachaFlip(c.rarity);
    renderGachaCards();
  }

  function revealAllCards() {
    let best = 'N';
    currentGachaCards.forEach((c) => {
      c.revealed = true;
      if (RARITIES[c.rarity].order > RARITIES[best].order) best = c.rarity;
    });
    SFX.gachaFlip(best);
    renderGachaCards();
  }

  // =====================================================
  // MARKET BUYING
  // =====================================================

  function buyMaterial(matId, qty) {
    const mat = MATERIALS[matId];
    const marketInfo = state.marketPrices[matId];
    if (!mat || !marketInfo) return;
    const totalCost = marketInfo.price * qty;
    if (state.gold < totalCost) {
      SFX.fail();
      showToast(`金币不足！需要 ${totalCost}G`, 'error');
      return;
    }

    state.gold -= totalCost;
    if (mat.givesDust) {
      state.dust += mat.givesDust * qty;
      showToast(`购入 ${mat.givesDust * qty} 份附魔粉尘！`, 'success');
    } else {
      state.materials[matId] = (state.materials[matId] || 0) + qty;
      showToast(`购入 ${mat.name} ×${qty} (-${totalCost}G)`, 'success');
    }
    SFX.coin();
    logActivity(`在材料商店采购了 ${mat.name} ×${qty}，花费 ${totalCost}G。`);
    saveGame(true);
    renderAll();
  }

  // =====================================================
  // SELLING, HAGGLING & ROYAL AUCTION
  // =====================================================

  function sellItemToCustomer(customerUid) {
    const item = getSelectedItem();
    if (!item) {
      showToast('请先在左侧【装备仓库】点击选中要卖出的装备！', 'error');
      return;
    }
    if (item.locked) {
      SFX.fail();
      showToast('该装备已【锁定保护】，请先在附魔界面解除锁定再售卖。', 'error');
      return;
    }
    const custIdx = state.customers.findIndex((c) => c.uid === customerUid);
    if (custIdx < 0) return;
    const cust = state.customers[custIdx];
    const evalRes = evaluateCustomerOffer(cust, item);
    if (!evalRes.matches) {
      SFX.fail();
      showToast(`该装备不符合 ${cust.name} 的核心要求（类型或稀有度）。`, 'error');
      return;
    }

    completeSale(item, evalRes.price, `${cust.name} 以 ${evalRes.mult}x 高价买下了 ${item.name}！`);

    state.customers.splice(custIdx, 1);
    if (state.customers.length === 0) {
      advanceDay(true);
    } else {
      WorkshopCanvas.syncState(state);
    }
    saveGame(true);
    renderAll();
  }

  function haggleCustomer(customerUid) {
    const custIdx = state.customers.findIndex((c) => c.uid === customerUid);
    if (custIdx < 0) return;
    const cust = state.customers[custIdx];

    if (cust.haggleCount >= 3) {
      showToast(`${cust.name} 已经开出最高心理价位了！`, 'error');
      return;
    }

    const tongueLv = getSkillLv('silver_tongue');
    const successChance = clamp(0.75 - cust.haggleCount * 0.16 + tongueLv * 0.06, 0.25, 0.96);
    if (Math.random() < successChance) {
      const bump = +(0.18 + tongueLv * 0.04).toFixed(2);
      cust.offerMult = +(cust.offerMult + bump).toFixed(2);
      cust.haggleCount += 1;
      cust.patience = Math.max(15, cust.patience - 20);
      SFX.coin();
      showToast(`讨价还价成功！${cust.name} 报价倍率提升至 ${cust.offerMult}x！`, 'success');
      logActivity(`三寸不烂之舌！${cust.name} 同意把报价提高到 ${cust.offerMult}x！`);
    } else {
      cust.patience -= 42;
      SFX.fail();
      WorkshopCanvas.triggerHaggleFail();
      if (cust.patience <= 0) {
        showToast(`${cust.name} 觉得太贵气冲冲地离开了！`, 'error');
        logActivity(`${cust.name} 失去耐心离开了柜台。`);
        state.customers.splice(custIdx, 1);
        if (state.customers.length === 0) generateCustomers();
      } else {
        showToast(`砍价被拒！${cust.name} 耐心大降（剩余 ${cust.patience}%）`, 'error');
      }
    }
    WorkshopCanvas.syncState(state);
    saveGame(true);
    renderAll();
  }

  function directSellSelected() {
    const item = getSelectedItem();
    if (!item) return;
    if (item.locked) {
      SFX.fail();
      showToast('该装备已锁定保护，无法出售！', 'error');
      return;
    }
    completeSale(item, item.value, `直接向行商售出了 ${item.name}。`);
    saveGame(true);
    renderAll();
  }

  function quickSellJunk() {
    const junk = state.inventory.filter((it) => !it.locked && (it.rarity === 'N' || it.rarity === 'R'));
    if (junk.length === 0) {
      showToast('没有可清仓的未锁定 N/R 级装备。', 'error');
      return;
    }
    let total = 0;
    junk.forEach((it) => {
      total += it.value;
      state.stats.sold += 1;
      state.stats.earnedGold += it.value;
    });
    state.inventory = state.inventory.filter((it) => !junk.includes(it));
    if (selectedItemId && !state.inventory.some((i) => i.id === selectedItemId)) {
      selectedItemId = state.inventory[0] ? state.inventory[0].id : null;
    }
    state.gold += total;
    addXp(junk.length * 6);
    SFX.coin();
    WorkshopCanvas.triggerSale(`+${total}G`);
    WorkshopCanvas.syncState(state);
    showToast(`一键清仓 ${junk.length} 件装备，获得 ${total}G！`, 'success');
    logActivity(`清理仓库卖出 ${junk.length} 件 N/R 装备，入账 ${total}G。`);
    saveGame(true);
    renderAll();
  }

  function completeSale(item, earnedGold, msg) {
    state.inventory = state.inventory.filter((i) => i.id !== item.id);
    if (selectedItemId === item.id) {
      selectedItemId = state.inventory[0] ? state.inventory[0].id : null;
    }
    state.gold += earnedGold;
    state.stats.sold += 1;
    state.stats.earnedGold += earnedGold;

    let gemsEarned = 0;
    if (earnedGold >= 600 || RARITIES[item.rarity].order >= 4) {
      gemsEarned += item.rarity === 'UR' ? 3 : item.rarity === 'SSR' ? 2 : 1;
    }
    // Special 【运】 Luck Affix / Luck Gem bonus Star Gem drop!
    const hasLuck = (item.affixes || []).some((a) => a.id === 'elem_luck') || item.gemId === 'gem_luck';
    if (hasLuck && Math.random() < 0.72) {
      gemsEarned += item.gemId === 'gem_luck' ? 2 : 1;
    }

    let gemBonusMsg = '';
    if (gemsEarned > 0) {
      state.gems += gemsEarned;
      gemBonusMsg = ` 并天降好运获赠 ${gemsEarned} 星钻！`;
    }

    const xpGain = Math.max(8, Math.round(earnedGold / 35));
    addXp(xpGain);

    SFX.coin();
    WorkshopCanvas.triggerSale(`+${earnedGold}G`);
    WorkshopCanvas.syncState(state);
    showToast(`成交！入账 +${earnedGold}G${gemBonusMsg}`, 'success');
    logActivity(`${msg} 入账 +${earnedGold}G${gemBonusMsg}`);
  }

  function advanceDay(silentIntro = false) {
    state.day += 1;
    rollMarketPrices();
    generateCustomers();

    const gifts = [];
    const appLv = state.upgrades.apprentice || 1;
    if (appLv >= 2) {
      const giftDust = (appLv - 1) * 2;
      const giftOre = appLv >= 5 ? 'valyrian_steel' : appLv >= 4 ? 'mithril_ore' : appLv >= 3 ? 'steel_ingot' : 'iron_ore';
      state.dust += giftDust;
      state.materials[giftOre] = (state.materials[giftOre] || 0) + 2;
      gifts.push(`${giftDust} 附魔尘 + ${MATERIALS[giftOre].name}×2`);
    }
    const fortuneLv = getSkillLv('gacha_fortune');
    if (fortuneLv > 0) {
      state.gems += fortuneLv;
      gifts.push(`鸿运星钻 +${fortuneLv}`);
    }

    if (gifts.length > 0) {
      showToast(`第 ${state.day} 天福利：${gifts.join('，')}！`, 'success');
    } else if (!silentIntro) {
      showToast(`第 ${state.day} 天开始！市场行情与柜台冒险者已刷新。`, 'success');
    }

    SFX.click();
    logActivity(`迎来了营业第 ${state.day} 天！新的冒险者与特价矿石已抵达。`);
    saveGame(true);
    renderAll();
  }

  // ---- Royal Auction House ----
  function openAuctionModal(preselectItem = null) {
    const eligible = state.inventory.filter((it) => !it.locked && RARITIES[it.rarity].order >= 3);
    const box = $('auction-content');
    if (eligible.length === 0) {
      box.innerHTML = `<div class="empty-state pixel-inset">
        <div class="empty-title">暂无可拍卖的 SR 及以上未锁定装备</div>
        <div class="empty-sub">皇家拍卖行只收录【史诗 SR / 传说 SSR / 神话 UR】级神兵利器（且需解除锁定保护）。快去打造或解锁一件神装送来竞拍吧！</div>
      </div>`;
      $('modal-auction').classList.remove('hidden');
      return;
    }

    const target = (preselectItem && eligible.includes(preselectItem)) ? preselectItem : eligible[0];
    startAuctionSession(target, eligible);
    $('modal-auction').classList.remove('hidden');
  }

  function startAuctionSession(item, eligibleList) {
    if (auctionSession && auctionSession.timer) clearInterval(auctionSession.timer);
    const kingLv = getSkillLv('auction_king');
    auctionSession = {
      item,
      eligibleList,
      started: false,
      finished: false,
      round: 0,
      maxRounds: randInt(5, 7) + kingLv,
      currentBid: Math.round(item.value * 1.18),
      highestBidder: '皇家底价担保',
      logs: [],
      timer: null,
    };
    renderAuctionModal();
  }

  function renderAuctionModal() {
    const s = auctionSession;
    if (!s) return;
    const rar = RARITIES[s.item.rarity];
    const box = $('auction-content');

    const pickerHtml = !s.started ? `
      <div class="rune-select-row">
        <label>选择拍品:</label>
        <select id="auction-item-select" class="pixel-select">
          ${s.eligibleList.map((it) => `<option value="${it.id}" ${it.id === s.item.id ? 'selected' : ''}>[${it.rarity}] ${it.name} +${it.level} (估价 ${it.value}G)</option>`).join('')}
        </select>
      </div>` : '';

    box.innerHTML = `
      ${pickerHtml}
      <div class="auction-stage pixel-inset">
        <img src="${getItemArtUrl(s.item)}" onerror="this.onerror=null;this.src='${getItemFallbackUrl(s.item)}'" style="width:72px;height:72px;object-fit:contain;" alt="${s.item.name}" />
        <div style="flex:1;">
          <div><span class="rarity-pill pill-${rar.css}">${rar.code}</span> <b class="txt-${rar.css}" style="font-size:15px;">${s.item.name} +${s.item.level}</b></div>
          <div style="font-size:12px;color:var(--text-dim);margin-top:4px;">基础估价: ${s.item.value}G | 词条数: ${s.item.affixes.length} ${s.item.gemId ? '| 宝石觉醒' : ''}</div>
          <div style="font-size:15px;margin-top:6px;">当前最高出价: <b class="gold-text pixel-num">${s.currentBid}G</b> <span style="font-size:11px;color:var(--cyan);">(${s.highestBidder})</span></div>
        </div>
      </div>
      <div class="bid-log" id="auction-bid-log">
        ${s.logs.length === 0 ? '<div style="color:var(--text-muted);">点击下方【开始皇家竞拍】，各国贵族、精灵王与大商人们将轮番抬价！</div>' :
          s.logs.map((l) => `<div class="bid-line"><span>${l.bidder}</span><b class="gold-text pixel-num">${l.amount}G</b></div>`).join('')}
      </div>
      <div class="result-actions">
        ${!s.started ? `<button id="btn-begin-bid" class="pixel-btn btn-gold btn-large">开始皇家竞拍!</button>` : ''}
        ${s.started && !s.finished ? `<button class="pixel-btn" disabled>激烈竞价中... (${s.round}/${s.maxRounds})</button>` : ''}
        ${s.finished ? `<button id="btn-claim-auction" class="pixel-btn btn-green btn-large">落槌成交！领取 ${s.currentBid}G</button>` : ''}
      </div>
    `;

    const sel = $('auction-item-select');
    if (sel) {
      sel.addEventListener('change', () => {
        const picked = s.eligibleList.find((i) => i.id === sel.value);
        if (picked) startAuctionSession(picked, s.eligibleList);
      });
    }

    const beginBtn = $('btn-begin-bid');
    if (beginBtn) {
      beginBtn.addEventListener('click', () => {
        s.started = true;
        SFX.bid();
        renderAuctionModal();
        const kingMult = 1 + getSkillLv('auction_king') * 0.15;
        const bidders = ['王室金库大公', '孤山矮人王索林', '星塔首席大魔导', '罗斯洛立安精灵使者', '铁银行神秘富商', '圆桌骑士团长'];
        s.timer = setInterval(() => {
          s.round += 1;
          const jump = Math.round(s.item.value * rand(0.11, 0.25) * kingMult);
          s.currentBid += Math.max(18, jump);
          s.highestBidder = pick(bidders);
          s.logs.unshift({ bidder: `${s.highestBidder} 举牌加价！`, amount: s.currentBid });
          SFX.bid();
          if (s.round >= s.maxRounds) {
            clearInterval(s.timer);
            s.timer = null;
            s.finished = true;
            s.logs.unshift({ bidder: `★ 拍卖官：${s.currentBid}G 三次！成交！`, amount: s.currentBid });
            SFX.upgrade();
          }
          renderAuctionModal();
        }, 540);
      });
    }

    const claimBtn = $('btn-claim-auction');
    if (claimBtn) {
      claimBtn.addEventListener('click', () => {
        const item = s.item;
        const gold = s.currentBid;
        const winner = s.highestBidder;
        auctionSession = null;
        $('modal-auction').classList.add('hidden');
        completeSale(item, gold, `皇家拍卖行落槌！${winner} 拍走了 ${item.name}！`);
        saveGame(true);
        renderAll();
      });
    }
  }

  // =====================================================
  // WORKSHOP UPGRADES
  // =====================================================

  function getUpgradeCost(upDef, curLv) {
    return Math.round(upDef.baseCost * Math.pow(upDef.costMult, curLv - 1));
  }

  function buyUpgrade(upId) {
    const def = UPGRADES.find((u) => u.id === upId);
    if (!def) return;
    const curLv = state.upgrades[upId] || 1;
    if (curLv >= def.maxLevel) return;
    const cost = getUpgradeCost(def, curLv);
    if (state.gold < cost) {
      SFX.fail();
      showToast(`金币不足！升级需要 ${cost}G`, 'error');
      return;
    }
    state.gold -= cost;
    state.upgrades[upId] = curLv + 1;
    state.inventory.forEach(recalcItem);
    addXp(25);
    SFX.upgrade();
    WorkshopCanvas.syncState(state);
    WorkshopCanvas.triggerEnchant('#ffcf40', `${def.name} Lv.${curLv + 1}!`);
    showToast(`${def.name} 升级至 Lv.${curLv + 1}！`, 'ssr');
    logActivity(`斥资 ${cost}G 将【${def.name}】升级到了 Lv.${curLv + 1}！`);
    saveGame(true);
    renderAll();
  }

  // =====================================================
  // UI RENDERING
  // =====================================================

  function renderStatChipsHtml(stats) {
    const parts = [];
    if (stats.atk > 0)  parts.push(`<span class="stat-chip red-text">攻击 ${stats.atk}</span>`);
    if (stats.def > 0)  parts.push(`<span class="stat-chip cyan-text">防御 ${stats.def}</span>`);
    if (stats.hp > 0)   parts.push(`<span class="stat-chip green-text">生命 ${stats.hp}</span>`);
    if (stats.crit > 0) parts.push(`<span class="stat-chip gold-text">暴击 ${stats.crit}%</span>`);
    return parts.join('');
  }

  function hydrateStaticIcons() {
    Sprites.drawToCanvas($('hud-logo'), 'anvil_logo');
    document.querySelectorAll('[data-sprite]').forEach((el) => {
      const key = el.dataset.sprite;
      const img = document.createElement('img');
      img.src = Sprites.getNamedIcon(key, 2);
      img.alt = key;
      el.innerHTML = '';
      el.appendChild(img);
    });
  }

  function renderHUD() {
    $('hud-gold').textContent = state.gold.toLocaleString();
    $('hud-gems').textContent = state.gems.toLocaleString();
    $('hud-dust').textContent = state.dust.toLocaleString();
    $('hud-day').textContent = state.day;

    const title = getTitleForLevel(state.level);
    $('hud-rank').textContent = `Lv.${state.level} ${title}`;
    const curNeed = xpForLevel(state.level);
    const nextNeed = xpForLevel(state.level + 1);
    const prog = clamp((state.xp - curNeed) / Math.max(1, nextNeed - curNeed) * 100, 0, 100);
    $('hud-rep-text').textContent = `${state.xp - curNeed}/${nextNeed - curNeed}`;
    $('hud-rep-fill').style.width = `${prog}%`;

    const spHud = $('hud-sp-badge');
    const spTab = $('skills-sp-badge');
    if (state.skillPoints > 0) {
      spHud.textContent = `技能点 +${state.skillPoints}`;
      spHud.classList.remove('hidden');
      spTab.textContent = String(state.skillPoints);
      spTab.classList.remove('hidden');
    } else {
      spHud.classList.add('hidden');
      spTab.classList.add('hidden');
    }

    $('stage-furnace-lvl').textContent = `熔炉 Lv.${state.upgrades.furnace}`;
    $('stage-anvil-lvl').textContent = `铁砧 Lv.${state.upgrades.anvil}`;
    const qBonus = (state.upgrades.furnace - 1) * 8 + getSkillLv('forge_heat') * 7;
    $('stage-luck-info').textContent = `品质加成 +${qBonus}`;

    $('counter-badge').textContent = String(state.customers.length);
    const activePity = state.pity[activeBannerId] || { sr: 0, ssr: 0 };
    $('gacha-pity-badge').textContent = `${activePity.ssr}/40`;
    $('btn-sound').textContent = `音效: ${state.soundOn ? '开' : '关'}`;
  }

  function renderInventory() {
    const maxInv = getMaxInventory();
    $('inv-count').textContent = `${state.inventory.length} / ${maxInv}`;

    const filter = $('inv-filter').value;
    const sort = $('inv-sort').value;

    let items = [...state.inventory];
    if (filter === 'weapon') items = items.filter((i) => getRecipe(i.recipeId).category === 'weapon');
    else if (filter === 'armor') items = items.filter((i) => getRecipe(i.recipeId).category === 'armor');
    else if (filter === 'high') items = items.filter((i) => RARITIES[i.rarity].order >= 3);

    if (sort === 'value') items.sort((a, b) => b.value - a.value);
    else if (sort === 'rarity') items.sort((a, b) => RARITIES[b.rarity].order - RARITIES[a.rarity].order || b.value - a.value);
    else if (sort === 'power') items.sort((a, b) => b.power - a.power);
    else items.sort((a, b) => b.createdAt - a.createdAt);

    const grid = $('inventory-grid');
    if (items.length === 0) {
      grid.innerHTML = `<div class="inv-empty">仓库空空如也！快去【锻造台】打造你的第一件传奇武器或防具吧！</div>`;
      return;
    }

    grid.innerHTML = items.map((it) => {
      const rar = RARITIES[it.rarity];
      const isSel = it.id === selectedItemId;
      const affixTags = (it.affixes || []).slice(0, 3).map((a) => {
        const d = getAffixDef(a.id);
        const meta = d && ELEMENTS[d.tag] ? ELEMENTS[d.tag] : { color: '#d6c8e8', bg: 'rgba(0,0,0,0.35)' };
        return `<span class="mini-affix-tag" style="color:${meta.color};background:${meta.bg};">${d ? d.tag : ''}${a.tier}</span>`;
      }).join('');
      const synDot = (it.synergies && it.synergies.length > 0) ? `<span class="mini-affix-tag" style="color:#ffea75;border-color:#ffcf40;">✦共鸣</span>` : '';

      return `<div class="equip-card rarity-${rar.css} ${isSel ? 'selected' : ''}" data-item-id="${it.id}">
        ${it.locked ? '<span class="equip-lock-tag" title="已锁定保护">锁</span>' : ''}
        <div class="equip-card-top">
          <div class="equip-sprite-box ${it.aura ? `aura-${it.aura}` : ''}">
            <img src="${getItemArtUrl(it)}" onerror="this.onerror=null;this.src='${getItemFallbackUrl(it)}'" alt="${it.name}" />
            ${it.level > 0 ? `<span class="equip-plus-tag">+${it.level}</span>` : ''}
          </div>
          <div style="min-width:0;flex:1;">
            <span class="rarity-pill pill-${rar.css}" style="font-size:9px;padding:1px 4px;">${rar.code}</span>
            <div class="equip-name txt-${rar.css}">${it.name}</div>
          </div>
        </div>
        <div class="equip-meta-row">
          <span class="gold-text pixel-num">${it.value}G</span>
          <span class="cyan-text">战力 ${it.power}</span>
        </div>
        <div class="equip-affix-dots">${affixTags}${synDot || (!affixTags ? '<span class="mini-affix-tag" style="opacity:0.5">无词条</span>' : '')}</div>
      </div>`;
    }).join('');

    grid.querySelectorAll('.equip-card').forEach((card) => {
      card.addEventListener('click', () => {
        selectedItemId = card.dataset.itemId;
        SFX.click();
        renderInventory();
        renderEnchantTab();
        renderCounterTab();
      });
    });
  }

  function renderForgeTab() {
    const unlockedTotal = Object.keys(state.unlockedRecipes).filter((k) => state.unlockedRecipes[k]).length;
    $('recipe-unlock-count').textContent = `已解锁 ${unlockedTotal} / ${RECIPES.length}`;

    // Sub-category filter pills
    $('recipe-subcat-pills').innerHTML = RECIPE_SUBCATS.map((sc) =>
      `<button class="mini-pill ${sc.id === recipeSubCatFilter ? 'active' : ''}" data-subcat="${sc.id}">${sc.label}</button>`
    ).join('');
    $('recipe-subcat-pills').querySelectorAll('[data-subcat]').forEach((b) => {
      b.addEventListener('click', () => {
        recipeSubCatFilter = b.dataset.subcat;
        SFX.click();
        renderForgeTab();
      });
    });

    // 1. Recipes Grid
    const list = RECIPES.filter((r) => recipeSubCatFilter === 'all' || r.subCat === recipeSubCatFilter);
    $('recipe-list').innerHTML = list.map((r) => {
      const unlocked = !!state.unlockedRecipes[r.id];
      const sel = r.id === selectedRecipeId;
      const previewMat = MATERIALS[selectedPrimaryMat] || MATERIALS.copper_ore;
      const fbUrl = Sprites.renderMatrix(r.sprite, unlocked ? previewMat.palette : ['#666', '#444', '#222'], null, 2);
      const artUrl = unlocked ? Sprites.getRecipeImgUrl(r.id) : fbUrl;
      const rar = RARITIES[r.rarity || 'N'];
      return `<div class="recipe-card ${sel ? 'selected' : ''} ${!unlocked ? 'locked' : ''}" data-recipe-id="${r.id}" title="${unlocked ? r.desc : '可通过【秘境抽卡】解锁'}">
        <img src="${artUrl}" onerror="this.onerror=null;this.src='${fbUrl}'" alt="${r.name}" />
        <div class="recipe-info">
          <div class="recipe-name ${unlocked ? `txt-${rar.css}` : ''}">${unlocked ? r.name : '?? 秘境图纸'}</div>
          <div class="recipe-sub">${unlocked ? `${r.category === 'weapon' ? '武器' : '防具'} · ${r.forgeGold}G` : `${r.rarity || 'SR'} 抽卡解锁`}</div>
        </div>
      </div>`;
    }).join('');

    $('recipe-list').querySelectorAll('.recipe-card:not(.locked)').forEach((el) => {
      el.addEventListener('click', () => {
        selectedRecipeId = el.dataset.recipeId;
        SFX.click();
        renderForgeTab();
      });
    });

    const recipe = getRecipe(selectedRecipeId);
    $('forge-primary-need').textContent = recipe.primaryNeed;
    $('forge-secondary-need').textContent = recipe.secondaryNeed;

    // 2. Material Pickers
    const primMats = Object.values(MATERIALS).filter((m) => m.role === 'primary');
    const secMats = Object.values(MATERIALS).filter((m) => m.role === 'secondary');
    const catMats = Object.values(MATERIALS).filter((m) => m.role === 'catalyst');

    $('primary-mat-picker').innerHTML = primMats.map((m) => {
      const qty = state.materials[m.id] || 0;
      const sel = m.id === selectedPrimaryMat;
      const rar = RARITIES[m.rarity];
      return `<div class="mat-opt ${sel ? 'selected' : ''} ${qty < recipe.primaryNeed ? 'insufficient' : ''}" data-pick-primary="${m.id}" title="${m.desc}">
        <div class="mat-opt-left">
          <img src="${getMatArtUrl(m.id)}" onerror="this.onerror=null;this.src='${getMatFallbackUrl(m.id)}'" alt="${m.name}" />
          <span class="mat-opt-name txt-${rar.css}">${m.name}</span>
        </div>
        <span class="mat-qty ${qty < recipe.primaryNeed ? 'red-text' : ''}">${qty}</span>
      </div>`;
    }).join('');

    $('secondary-mat-picker').innerHTML = secMats.map((m) => {
      const qty = state.materials[m.id] || 0;
      const sel = m.id === selectedSecondaryMat;
      const rar = RARITIES[m.rarity];
      return `<div class="mat-opt ${sel ? 'selected' : ''} ${qty < recipe.secondaryNeed ? 'insufficient' : ''}" data-pick-secondary="${m.id}" title="${m.desc}">
        <div class="mat-opt-left">
          <img src="${getMatArtUrl(m.id)}" onerror="this.onerror=null;this.src='${getMatFallbackUrl(m.id)}'" alt="${m.name}" />
          <span class="mat-opt-name txt-${rar.css}">${m.name}</span>
        </div>
        <span class="mat-qty ${qty < recipe.secondaryNeed ? 'red-text' : ''}">${qty}</span>
      </div>`;
    }).join('');

    $('catalyst-mat-picker').innerHTML =
      `<div class="mat-opt ${selectedCatalystMat === 'none' ? 'selected' : ''}" data-pick-catalyst="none">
        <div class="mat-opt-left"><span class="mat-opt-name">不使用催化剂</span></div>
        <span class="mat-qty">—</span>
      </div>` +
      catMats.map((m) => {
        const qty = state.materials[m.id] || 0;
        const sel = m.id === selectedCatalystMat;
        const rar = RARITIES[m.rarity];
        return `<div class="mat-opt ${sel ? 'selected' : ''} ${qty < 1 ? 'insufficient' : ''}" data-pick-catalyst="${m.id}" title="${m.desc}">
          <div class="mat-opt-left">
            <img src="${getMatArtUrl(m.id)}" onerror="this.onerror=null;this.src='${getMatFallbackUrl(m.id)}'" alt="${m.name}" />
            <span class="mat-opt-name txt-${rar.css}">${m.name}</span>
          </div>
          <span class="mat-qty">${qty}</span>
        </div>`;
      }).join('');

    $('primary-mat-picker').querySelectorAll('[data-pick-primary]').forEach((el) => {
      el.addEventListener('click', () => { selectedPrimaryMat = el.dataset.pickPrimary; SFX.click(); renderForgeTab(); });
    });
    $('secondary-mat-picker').querySelectorAll('[data-pick-secondary]').forEach((el) => {
      el.addEventListener('click', () => { selectedSecondaryMat = el.dataset.pickSecondary; SFX.click(); renderForgeTab(); });
    });
    $('catalyst-mat-picker').querySelectorAll('[data-pick-catalyst]').forEach((el) => {
      el.addEventListener('click', () => { selectedCatalystMat = el.dataset.pickCatalyst; SFX.click(); renderForgeTab(); });
    });

    // 3. Preview Summary & Odds
    const prim = MATERIALS[selectedPrimaryMat] || MATERIALS.copper_ore;
    Sprites.drawArtToCanvas($('forge-preview-canvas'), Sprites.getRecipeImgUrl(recipe.id), recipe.sprite, prim.palette, null);
    $('forge-preview-name').textContent = `${prim.prefix}${recipe.name}`;
    $('forge-preview-stats').textContent = `${recipe.desc} (基础品质分 ${getBaseForgeQualityScore()} + 敲击火候)`;

    const estOdds = computeRarityOdds(getBaseForgeQualityScore() + 45);
    $('forge-odds-bar').innerHTML = RARITY_ORDER.map((code) => {
      const r = RARITIES[code];
      return `<span class="odds-chip txt-${r.css}">${code} ${estOdds[code]}%</span>`;
    }).join('');

    $('forge-cost-gold').textContent = recipe.forgeGold;
    const forgeCheck = canForgeSelected();
    $('btn-start-forge').disabled = !forgeCheck.ok || !!forgeSession;
  }

  function renderEnchantTab() {
    const item = getSelectedItem();
    if (!item) {
      $('enchant-empty').classList.remove('hidden');
      $('enchant-workspace').classList.add('hidden');
      return;
    }

    $('enchant-empty').classList.add('hidden');
    $('enchant-workspace').classList.remove('hidden');

    const recipe = getRecipe(item.recipeId);
    const rar = RARITIES[item.rarity];
    Sprites.drawArtToCanvas($('ench-item-canvas'), getItemArtUrl(item), recipe.sprite, item.palette, item.aura);

    const rarEl = $('ench-item-rarity');
    rarEl.className = `rarity-pill pill-${rar.css}`;
    rarEl.textContent = `${rar.code} ${rar.name}`;

    const nameEl = $('ench-item-name');
    nameEl.className = `txt-${rar.css}`;
    nameEl.textContent = `${item.name} +${item.level}` + (item.gemId ? ` [${MATERIALS[item.gemId].auraName}]` : '');

    $('btn-lock-item').textContent = item.locked ? '已锁定 (点此解锁)' : '锁定保护';
    $('btn-lock-item').className = `pixel-btn btn-small ${item.locked ? 'btn-gold' : ''}`;

    $('ench-item-base-stats').innerHTML = renderStatChipsHtml(item.stats);

    const synBar = $('ench-synergy-bar');
    if (item.synergies && item.synergies.length > 0) {
      synBar.classList.remove('hidden');
      synBar.innerHTML = item.synergies.map((s) =>
        `<span class="synergy-pill">✦ ${s.name} (+${Math.round(s.valBonus * 100)}%售价)</span>`
      ).join('');
    } else {
      synBar.classList.add('hidden');
    }

    $('ench-item-val').textContent = `${item.value}G`;
    $('ench-item-power').textContent = item.power;

    const maxSlots = getMaxAffixSlots(item.rarity);
    $('ench-slot-count').textContent = `${item.affixes.length} / ${maxSlots}`;

    let affixHtml = item.affixes.map((af, idx) => {
      const d = getAffixDef(af.id);
      return `<div class="affix-row">
        <div class="affix-row-left">
          <span class="tier-badge tier-${af.tier}">${af.tier}</span>
          ${elemBadgeHtml(d.tag)}
          <span class="affix-name">${d.name}</span>
          <span class="affix-desc">${d.desc(af.val)}</span>
        </div>
        <button class="pixel-btn btn-small ${af.locked ? 'btn-gold' : ''}" data-lock-affix="${idx}">
          ${af.locked ? '已锁' : '锁'}
        </button>
      </div>`;
    }).join('');

    for (let s = item.affixes.length; s < maxSlots; s++) {
      affixHtml += `<div class="affix-empty-slot">空属性槽位 #${s + 1} — 点击下方【铭刻新属性】添加五行或光·暗·时·空·运词条</div>`;
    }
    $('ench-affix-list').innerHTML = affixHtml;

    $('ench-affix-list').querySelectorAll('[data-lock-affix]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.lockAffix);
        item.affixes[idx].locked = !item.affixes[idx].locked;
        SFX.click();
        saveGame(true);
        renderEnchantTab();
      });
    });

    // Op 1: Add Affix
    const runeSel = $('enchant-rune-select');
    const prevRune = runeSel.value || 'random';
    const ownedRunes = Object.values(MATERIALS).filter((m) => m.role === 'rune' && (state.materials[m.id] || 0) > 0);
    runeSel.innerHTML = `<option value="random">不使用符文 (随机五行/本源属性)</option>` +
      ownedRunes.map((r) => `<option value="${r.id}">${r.name} (余 ${state.materials[r.id]})</option>`).join('');
    if ([...runeSel.options].some((o) => o.value === prevRune)) runeSel.value = prevRune;

    const addDust = getEnchantDustCost(2 + item.affixes.length);
    const addGold = 25 + item.affixes.length * 20;
    const btnAdd = $('btn-add-affix');
    btnAdd.textContent = item.affixes.length >= maxSlots ? '词条槽位已满' : `铭刻新属性 (${addDust}尘 + ${addGold}G)`;
    btnAdd.disabled = item.affixes.length >= maxSlots;

    // Op 2: Strengthen
    $('charm-count').textContent = state.materials.bless_charm || 0;
    const upInfo = getStrengthenInfo(item);
    $('up-rate').textContent = item.level >= 10 ? 'MAX' : `${upInfo.rate}%`;
    $('up-blessing').textContent = `${item.blessing || 0}%`;
    const btnStr = $('btn-strengthen');
    btnStr.textContent = item.level >= 10 ? '已满级 +10' : `强化至 +${item.level + 1} (${upInfo.dustCost}尘 + ${upInfo.goldCost}G)`;
    btnStr.disabled = item.level >= 10;

    // Op 3: Reforge
    const lockedCount = item.affixes.filter((a) => a.locked).length;
    const refDust = getEnchantDustCost(2 + lockedCount * 2);
    const refGold = 40 + lockedCount * 35;
    $('locked-affix-num').textContent = lockedCount;
    $('reforge-cost-text').textContent = `${refDust} 附魔尘 + ${refGold}G`;
    $('btn-reforge').disabled = item.affixes.length === 0 || lockedCount >= item.affixes.length;

    // Op 4: Infuse Gem
    const gemSel = $('infuse-gem-select');
    const prevGem = gemSel.value;
    const ownedGems = Object.values(MATERIALS).filter((m) => m.role === 'gem' && (state.materials[m.id] || 0) > 0);
    if (ownedGems.length === 0) {
      gemSel.innerHTML = `<option value="">背包暂无宝石 (前往秘境抽卡获取)</option>`;
      $('btn-infuse-gem').disabled = true;
    } else {
      gemSel.innerHTML = ownedGems.map((g) => `<option value="${g.id}">${g.name} [${g.auraName}] (余 ${state.materials[g.id]})</option>`).join('');
      if ([...gemSel.options].some((o) => o.value === prevGem)) gemSel.value = prevGem;
      $('btn-infuse-gem').disabled = false;
    }
  }

  function renderGachaTab() {
    $('gacha-banner-tabs').innerHTML = GACHA_BANNERS.map((b) => `
      <button class="banner-tab-btn ${b.id === activeBannerId ? 'active' : ''}" data-banner-id="${b.id}">
        <span class="banner-tab-title">${b.name}</span>
        <span class="banner-tab-cost">${b.currency === 'gold' ? `${b.cost1}G / 抽` : `${b.cost1} 星钻 / 抽`}</span>
      </button>
    `).join('');

    $('gacha-banner-tabs').querySelectorAll('[data-banner-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeBannerId = btn.dataset.bannerId;
        SFX.click();
        renderGachaTab();
        renderHUD();
      });
    });

    const banner = getBanner(activeBannerId);
    const bImg = $('gacha-banner-img');
    if (bImg) bImg.src = banner.bannerImg;

    $('banner-name').textContent = banner.name;
    const tagEl = $('banner-tag');
    tagEl.className = `rarity-pill ${banner.tagCss}`;
    tagEl.textContent = banner.tag;
    $('banner-desc').textContent = banner.desc;

    const pity = state.pity[banner.id] || { sr: 0, ssr: 0 };
    $('pity-sr-text').textContent = `${pity.sr}/10`;
    $('pity-sr-bar').style.width = `${clamp(pity.sr / 10 * 100, 0, 100)}%`;
    $('pity-ssr-text').textContent = `${pity.ssr}/40`;
    $('pity-ssr-bar').style.width = `${clamp(pity.ssr / 40 * 100, 0, 100)}%`;

    const luckBoost = getSkillLv('gacha_fortune') * 1.2;
    $('banner-rates').innerHTML = ['UR', 'SSR', 'SR', 'R', 'N']
      .filter((c) => banner.rates[c] > 0)
      .map((c) => {
        let rate = banner.rates[c];
        if (c === 'UR') rate = +(rate + luckBoost * 0.35).toFixed(1);
        if (c === 'SSR') rate = +(rate + luckBoost * 0.65).toFixed(1);
        return `<span class="odds-chip txt-${RARITIES[c].css}">${c} ${rate}%</span>`;
      }).join('');

    const unit = banner.currency === 'gold' ? 'G' : ' 星钻';
    $('btn-pull-1').textContent = `单抽 ×1 (${banner.cost1}${unit})`;
    $('btn-pull-10').textContent = `十连抽 ×10 (${banner.cost10}${unit} · 必出SR+)`;

    const highlights = [];
    ['UR', 'SSR', 'SR'].forEach((r) => {
      (banner.pools[r] || []).forEach((d) => highlights.push({ drop: d, rarity: r }));
    });

    $('gacha-pool-preview').innerHTML = highlights.slice(0, 18).map(({ drop, rarity }) => {
      const rar = RARITIES[rarity];
      let name = '', img = '', fb = '';
      if (drop.type === 'dust') {
        name = `附魔粉尘 ×${drop.qty}`;
        img = getMatArtUrl('enchant_dust_pack');
        fb = Sprites.getNamedIcon('enchant_dust', 2);
      } else if (drop.type === 'recipe') {
        const rec = getRecipe(drop.id);
        name = `图纸:${rec.name}`;
        img = Sprites.getRecipeImgUrl(rec.id);
        fb = Sprites.renderMatrix('blueprint', null, null, 2);
      } else {
        const mat = MATERIALS[drop.id];
        name = `${mat.name} ×${drop.qty}`;
        img = getMatArtUrl(drop.id);
        fb = getMatFallbackUrl(drop.id);
      }
      return `<div class="pool-item-chip rarity-${rar.css}">
        <img src="${img}" onerror="this.onerror=null;this.src='${fb}'" alt="${name}" />
        <div>
          <span class="rarity-pill pill-${rar.css}" style="font-size:9px;padding:0 3px;">${rar.code}</span>
          <div class="txt-${rar.css}" style="font-weight:700;">${name}</div>
        </div>
      </div>`;
    }).join('');
  }

  function renderMarketTab() {
    const grid = $('market-grid');

    if (marketCatFilter === 'bag') {
      const owned = Object.values(MATERIALS).filter((m) => !m.givesDust && (state.materials[m.id] || 0) > 0);
      if (owned.length === 0) {
        grid.innerHTML = `<div class="inv-empty">材料袋空空的，快去买材料或秘境抽卡吧！</div>`;
        return;
      }
      grid.innerHTML = owned.map((m) => {
        const rar = RARITIES[m.rarity];
        const qty = state.materials[m.id] || 0;
        return `<div class="market-card rarity-${rar.css}">
          <div class="market-card-head">
            <img src="${getMatArtUrl(m.id)}" onerror="this.onerror=null;this.src='${getMatFallbackUrl(m.id)}'" alt="${m.name}" />
            <div>
              <div class="market-item-name txt-${rar.css}">${m.name}</div>
              <div class="market-item-owned">${roleLabel(m.role)} · 持有 <b class="gold-text pixel-num">${qty}</b></div>
            </div>
          </div>
          <div class="market-item-desc">${m.desc}</div>
        </div>`;
      }).join('');
      return;
    }

    const items = Object.values(MATERIALS).filter((m) => {
      if (!m.shopBuyable) return false;
      if (marketCatFilter === 'all') return true;
      return m.marketCat === marketCatFilter;
    });

    grid.innerHTML = items.map((m) => {
      const rar = RARITIES[m.rarity];
      const mp = state.marketPrices[m.id] || { price: m.basePrice, tag: 'normal' };
      const owned = m.givesDust ? state.dust : (state.materials[m.id] || 0);
      const ownedLabel = m.givesDust ? `当前附魔尘: ${owned}` : `背包持有: ${owned}`;
      const badge = mp.tag === 'discount' ? '<span class="discount-tag">今日特价</span>'
        : mp.tag === 'surge' ? '<span class="surge-tag">行情偏贵</span>' : '';

      return `<div class="market-card rarity-${rar.css}">
        <div class="market-card-head">
          <img src="${getMatArtUrl(m.id)}" onerror="this.onerror=null;this.src='${getMatFallbackUrl(m.id)}'" alt="${m.name}" />
          <div>
            <div class="market-item-name txt-${rar.css}">${m.name}</div>
            <div class="market-item-owned">${ownedLabel}</div>
          </div>
        </div>
        <div class="market-item-desc">${m.desc}</div>
        <div class="market-price-row">
          <span class="gold-text pixel-num" style="font-size:14px;">${mp.price}G</span>
          ${badge}
        </div>
        <div class="buy-btn-group">
          <button class="pixel-btn btn-small btn-gold" data-buy-id="${m.id}" data-buy-qty="1">买 ×1</button>
          <button class="pixel-btn btn-small btn-cyan" data-buy-id="${m.id}" data-buy-qty="5">买 ×5 (${mp.price * 5}G)</button>
        </div>
      </div>`;
    }).join('');

    grid.querySelectorAll('[data-buy-id]').forEach((btn) => {
      btn.addEventListener('click', () => buyMaterial(btn.dataset.buyId, Number(btn.dataset.buyQty)));
    });
  }

  function renderCounterTab() {
    const selItem = getSelectedItem();
    const listEl = $('customer-list');

    listEl.innerHTML = state.customers.map((c) => {
      const ev = evaluateCustomerOffer(c, selItem);
      const avatarUrl = c.img || Sprites.getCharImgUrl(c.sprite);
      const fbUrl = Sprites.getNamedIcon('coin', 3);
      const catLabel = c.wantCat === 'weapon' ? '武器' : '防具';

      return `<div class="customer-card ${ev.matches ? 'match-ok' : ''}">
        <div class="customer-head">
          <img src="${avatarUrl}" onerror="this.onerror=null;this.src='${fbUrl}'" class="customer-avatar" alt="${c.name}" />
          <div>
            <div class="customer-name">${c.name}</div>
            <div class="customer-role">${c.role} · 基础倍率 <b class="gold-text">${c.offerMult}x</b></div>
          </div>
        </div>
        <div class="customer-quote">“${c.quote}”</div>
        <div class="customer-reqs">
          <span class="req-chip ${ev.checks.catOk ? 'req-met' : ''}">必选: ${catLabel}</span>
          <span class="req-chip ${ev.checks.rarOk ? 'req-met' : ''}">品质 ≥ ${c.minRarity}</span>
          <span class="req-chip ${ev.checks.tagOk ? 'req-met' : ''}">偏好元素: ${elemBadgeHtml(c.wantTag)} +0.35x</span>
          ${c.wantEnhance > 0 ? `<span class="req-chip ${ev.checks.enhOk ? 'req-met' : ''}">强化 ≥ +${c.wantEnhance} (+0.22x)</span>` : ''}
        </div>
        <div class="patience-row">
          <span>耐心值: ${c.patience}%</span>
          <div class="mini-bar"><span style="width:${c.patience}%;background:${c.patience > 40 ? 'var(--green)' : 'var(--red)'}"></span></div>
        </div>
        <div class="customer-offer-line">
          <span>${selItem ? (ev.matches ? `报价 (${ev.mult}x):` : '选中装备不符要求') : '请先在左侧选中装备'}</span>
          <b class="${ev.matches ? 'gold-text' : 'text-dim'} pixel-num">${ev.matches ? `${ev.price}G` : '—'}</b>
        </div>
        <div class="customer-actions">
          <button class="pixel-btn btn-small btn-cyan" data-haggle="${c.uid}">讨价还价</button>
          <button class="pixel-btn btn-small btn-green" data-sell-cust="${c.uid}" ${!ev.matches ? 'disabled' : ''}>交付成交</button>
        </div>
      </div>`;
    }).join('');

    listEl.querySelectorAll('[data-haggle]').forEach((b) => {
      b.addEventListener('click', () => haggleCustomer(b.dataset.haggle));
    });
    listEl.querySelectorAll('[data-sell-cust]').forEach((b) => {
      b.addEventListener('click', () => sellItemToCustomer(b.dataset.sellCust));
    });

    if (selItem) {
      $('direct-sell-preview').innerHTML = `当前选中: <b class="txt-${RARITIES[selItem.rarity].css}">[${selItem.rarity}] ${selItem.name} +${selItem.level}</b>（行商原价收购: <b class="gold-text">${selItem.value}G</b>）`;
      $('btn-direct-sell').disabled = selItem.locked;
      $('btn-direct-sell').textContent = selItem.locked ? '已锁定无法出售' : `直接卖给行商 (+${selItem.value}G)`;
      const canAuc = !selItem.locked && RARITIES[selItem.rarity].order >= 3;
      $('btn-auction-selected').disabled = !canAuc;
    } else {
      $('direct-sell-preview').textContent = '请在左侧仓库选中一件装备，即可卖给上方冒险者、直接售出或送入皇家拍卖行。';
      $('btn-direct-sell').disabled = true;
      $('btn-direct-sell').textContent = '原价直接卖给行商';
      $('btn-auction-selected').disabled = true;
    }
  }

  function renderSkillsTab() {
    $('skill-sp-avail').textContent = String(state.skillPoints);
    $('skill-bs-level').textContent = `Lv.${state.level} ${getTitleForLevel(state.level)}`;

    const branches = [
      { id: 'forge',   title: '火锤宗师系 (锻造强化)', css: 'branch-forge' },
      { id: 'enchant', title: '秘法附魔系 (元素洗练)', css: 'branch-enchant' },
      { id: 'trade',   title: '商道星运系 (售卖抽卡)', css: 'branch-trade' },
    ];

    $('skill-tree-branches').innerHTML = branches.map((br) => {
      const skills = SKILL_TREE.filter((s) => s.branch === br.id);
      const spentInBranch = skills.reduce((acc, s) => acc + getSkillLv(s.id), 0);
      return `<div class="skill-branch-col ${br.css}">
        <div class="branch-title">
          <span>${br.title}</span>
          <span class="tag-chip pixel-num">${spentInBranch} 点</span>
        </div>
        ${skills.map((sk) => {
          const lv = getSkillLv(sk.id);
          const maxed = lv >= sk.maxLv;
          const levelLocked = state.level < sk.reqLevel;
          const canLearn = !maxed && !levelLocked && state.skillPoints > 0;
          const pips = Array.from({ length: sk.maxLv }, (_, idx) =>
            `<span class="skill-pip ${idx < lv ? 'filled' : ''}"></span>`
          ).join('');
          return `<div class="skill-card ${maxed ? 'skill-maxed' : lv > 0 ? 'skill-active' : ''} ${levelLocked ? 'skill-locked' : ''}">
            <div class="skill-card-head">
              <span class="skill-name">${sk.name}</span>
              <span class="tag-chip pixel-num">Lv.${lv}/${sk.maxLv}</span>
            </div>
            <div class="skill-pips">${pips}</div>
            <div class="skill-desc">${sk.desc(lv)}</div>
            <button class="pixel-btn btn-small ${canLearn ? 'btn-gold' : ''}" data-learn-skill="${sk.id}" ${!canLearn ? 'disabled' : ''}>
              ${maxed ? '已满级 MAX' : levelLocked ? `需铁匠 Lv.${sk.reqLevel}` : state.skillPoints > 0 ? '加点升级 (1 SP)' : '技能点不足'}
            </button>
          </div>`;
        }).join('')}
      </div>`;
    }).join('');

    $('skill-tree-branches').querySelectorAll('[data-learn-skill]').forEach((btn) => {
      btn.addEventListener('click', () => upgradeSkill(btn.dataset.learnSkill));
    });
  }

  function renderWorkshopTab() {
    $('upgrades-grid').innerHTML = UPGRADES.map((u) => {
      const lv = state.upgrades[u.id] || 1;
      const maxed = lv >= u.maxLevel;
      const cost = getUpgradeCost(u, lv);
      return `<div class="upgrade-card">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <b style="color:var(--gold);font-size:13px;">${u.name}</b>
            <span class="tag-chip pixel-num">Lv.${lv}/${u.maxLevel}</span>
          </div>
          <div style="font-size:11px;color:var(--text-dim);margin-top:5px;">${u.effectText(lv)}</div>
        </div>
        <button class="pixel-btn btn-small ${maxed ? '' : 'btn-gold'}" data-upgrade="${u.id}" ${maxed || state.gold < cost ? 'disabled' : ''}>
          ${maxed ? '已满级 MAX' : `升级至 Lv.${lv + 1} (${cost}G)`}
        </button>
      </div>`;
    }).join('');

    $('upgrades-grid').querySelectorAll('[data-upgrade]').forEach((b) => {
      b.addEventListener('click', () => buyUpgrade(b.dataset.upgrade));
    });

    const discoveredCount = Object.keys(state.codex).length;
    $('codex-progress').textContent = `已锻造收集 ${discoveredCount} / ${RECIPES.length}`;

    $('stats-summary').innerHTML = `
      <span>铁匠等级: <b class="gold-text pixel-num">Lv.${state.level}</b></span>
      <span>累计锻造: <b class="cyan-text pixel-num">${state.stats.forged}</b></span>
      <span>累计售出: <b class="green-text pixel-num">${state.stats.sold}</b></span>
      <span>总营收: <b class="gold-text pixel-num">${state.stats.earnedGold.toLocaleString()}G</b></span>
      <span>抽卡次数: <b class="purple-text pixel-num">${state.stats.gachaPulls}</b></span>
      <span>SSR/UR 神装: <b class="gold-text pixel-num">${state.stats.ssrCount}</b></span>
    `;

    $('codex-grid').innerHTML = RECIPES.map((r) => {
      const entry = state.codex[r.id];
      const rar = entry ? RARITIES[entry.highestRarity] : null;
      const fb = Sprites.renderMatrix(r.sprite, MATERIALS.steel_ingot.palette, null, 3);
      const img = Sprites.getRecipeImgUrl(r.id);
      return `<div class="codex-card ${entry ? `rarity-${rar.css}` : 'undiscovered'}" title="${r.desc}">
        <img src="${img}" onerror="this.onerror=null;this.src='${fb}'" alt="${r.name}" />
        <div style="font-size:11px;font-weight:700;">${state.unlockedRecipes[r.id] || entry ? r.name : '未解锁'}</div>
        <div style="font-size:10px;color:var(--text-dim);">
          ${entry ? `最高 <b class="txt-${rar.css}">${entry.highestRarity}</b> · 共${entry.count}件` : '尚未锻造'}
        </div>
      </div>`;
    }).join('');
  }

  function renderAll() {
    renderHUD();
    renderInventory();
    renderForgeTab();
    renderEnchantTab();
    renderGachaTab();
    renderMarketTab();
    renderCounterTab();
    renderSkillsTab();
    renderWorkshopTab();
  }

  function switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.tab-pane').forEach((p) => p.classList.toggle('active', p.id === `tab-${tabId}`));
    SFX.click();
    renderAll();
  }

  // =====================================================
  // EVENT WIRING & BOOTSTRAP
  // =====================================================

  function bindEvents() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    $('hud-sp-badge').addEventListener('click', () => switchTab('skills'));

    $('btn-sound').addEventListener('click', () => {
      state.soundOn = !state.soundOn;
      SFX.setEnabled(state.soundOn);
      if (state.soundOn) SFX.click();
      saveGame(true);
      renderHUD();
    });
    $('btn-save').addEventListener('click', () => saveGame(false));
    $('btn-help').addEventListener('click', () => { SFX.click(); $('modal-help').classList.remove('hidden'); });
    $('btn-close-help').addEventListener('click', () => { SFX.click(); $('modal-help').classList.add('hidden'); });
    $('btn-reset').addEventListener('click', () => {
      if (confirm('确定要清空存档并重新开始星炉铁匠铺吗？')) {
        localStorage.removeItem(SAVE_KEY);
        state = createFreshState();
        rollMarketPrices();
        generateCustomers();
        selectedItemId = null;
        WorkshopCanvas.syncState(state);
        saveGame(true);
        renderAll();
        showToast('已重置为全新 v2.0 铁匠铺存档！', 'success');
      }
    });

    $('inv-filter').addEventListener('change', renderInventory);
    $('inv-sort').addEventListener('change', renderInventory);
    $('btn-quicksell-junk').addEventListener('click', quickSellJunk);

    $('btn-start-forge').addEventListener('click', startForge);
    $('btn-hammer-hit').addEventListener('click', handleHammerStrike);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && forgeSession) {
        e.preventDefault();
        handleHammerStrike();
      }
    });

    $('btn-result-close').addEventListener('click', () => { SFX.click(); $('modal-forge-result').classList.add('hidden'); });
    $('btn-result-enchant').addEventListener('click', () => {
      $('modal-forge-result').classList.add('hidden');
      switchTab('enchant');
    });

    $('btn-lock-item').addEventListener('click', () => {
      const item = getSelectedItem();
      if (!item) return;
      item.locked = !item.locked;
      SFX.click();
      saveGame(true);
      renderAll();
    });
    $('btn-add-affix').addEventListener('click', handleAddAffix);
    $('btn-strengthen').addEventListener('click', handleStrengthen);
    $('chk-use-charm').addEventListener('change', renderEnchantTab);
    $('btn-reforge').addEventListener('click', handleReforge);
    $('btn-infuse-gem').addEventListener('click', handleInfuseGem);

    $('btn-pull-1').addEventListener('click', () => executeGacha(activeBannerId, 1));
    $('btn-pull-10').addEventListener('click', () => executeGacha(activeBannerId, 10));
    $('btn-exchange-gems').addEventListener('click', () => {
      if (state.gold < 250) { SFX.fail(); showToast('金币不足！需要 250G 兑换 1 星钻。', 'error'); return; }
      state.gold -= 250;
      state.gems += 1;
      SFX.coin();
      showToast('成功兑换 1 颗星钻！', 'success');
      saveGame(true);
      renderAll();
    });
    $('btn-reveal-all').addEventListener('click', revealAllCards);
    $('btn-close-gacha').addEventListener('click', () => { SFX.click(); $('modal-gacha').classList.add('hidden'); });
    $('btn-gacha-ok').addEventListener('click', () => { SFX.click(); $('modal-gacha').classList.add('hidden'); });
    $('btn-gacha-again').addEventListener('click', () => {
      if (!lastGachaAction) return;
      executeGacha(lastGachaAction.bannerId, lastGachaAction.count);
    });

    $('btn-refresh-market').addEventListener('click', () => {
      if (state.gold < 40) { SFX.fail(); showToast('刷新市场行情需要 40G！', 'error'); return; }
      state.gold -= 40;
      rollMarketPrices();
      SFX.click();
      showToast('商队带来了全新报价！快看看绿色特价矿石！', 'success');
      saveGame(true);
      renderAll();
    });
    $('btn-open-bag').addEventListener('click', () => {
      marketCatFilter = 'bag';
      document.querySelectorAll('[data-market-cat]').forEach((b) => b.classList.toggle('active', b.dataset.marketCat === 'bag'));
      SFX.click();
      renderMarketTab();
    });
    document.querySelectorAll('[data-market-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        marketCatFilter = btn.dataset.marketCat;
        document.querySelectorAll('[data-market-cat]').forEach((b) => b.classList.toggle('active', b === btn));
        SFX.click();
        renderMarketTab();
      });
    });

    $('btn-next-day').addEventListener('click', () => advanceDay(false));
    $('btn-direct-sell').addEventListener('click', directSellSelected);
    $('btn-open-auction').addEventListener('click', () => { SFX.click(); openAuctionModal(getSelectedItem()); });
    $('btn-auction-selected').addEventListener('click', () => { SFX.click(); openAuctionModal(getSelectedItem()); });
    $('btn-close-auction').addEventListener('click', () => {
      if (auctionSession && auctionSession.timer) clearInterval(auctionSession.timer);
      auctionSession = null;
      SFX.click();
      $('modal-auction').classList.add('hidden');
    });

    $('btn-reset-skills').addEventListener('click', resetSkills);
  }

  function init() {
    loadGame();
    SFX.setEnabled(state.soundOn);
    hydrateStaticIcons();
    WorkshopCanvas.init($('workshop-canvas'));
    WorkshopCanvas.syncState(state);
    bindEvents();
    renderAll();
  }

  window.addEventListener('DOMContentLoaded', init);
})();
