/* =====================================================
   Pixel Art Sprite Engine v2.0
   Supports high-res gpt-image-2.6-sunburst transparent PNGs
   + crisp 16x16 pixel matrix fallbacks & elemental aura sparkles
   ===================================================== */

(function (global) {
  const cache = new Map();
  const imgCache = new Map();

  const BASE_COLORS = {
    '.': null,
    'k': '#120d16', 'w': '#9b653c', 'W': '#5e3920', 'l': '#d49d6a', 'L': '#804d2c',
    'g': '#ffcf40', 'G': '#b87614', 's': '#f2ede4', 'r': '#ff4f5e', 'R': '#9e1928',
    'b': '#4fa8ff', 'B': '#1d4ea3', 'p': '#c576ff', 'P': '#6b27a8', 'e': '#5ce67a',
    'E': '#1f7a3d', 'c': '#4de6d9', 'C': '#187c82', 'o': '#ff8636', 'O': '#b53a14',
    'f': '#ffd7b5', 'F': '#d49a72', 'h': '#593b2a', 'd': '#3c3347', 'D': '#251e2e',
    'm': '#b8c4d4', 'M': '#6b768a', '1': '#dce6f2', '2': '#8f9eb3', '3': '#4d586b',
  };

  const AURA_COLORS = {
    fire:      ['#ffef7a', '#ff6b35'],
    ice:       ['#d9fbff', '#4fa8ff'],
    lightning: ['#fff8a6', '#ffd23f'],
    poison:    ['#b8ff9e', '#3fd665'],
    holy:      ['#ffffff', '#ffdf6b'],
    void:      ['#f0b3ff', '#9c42f5'],
  };

  // Classic 16x16 UI & fallback pixel templates
  const TEMPLATES = {
    sword: [
      '............kk..','...........k1sk.','..........k121k.','.........k123k..',
      '........k123k...','.......k123k....','......k123k.....','.....k123k......',
      '..kk.k23k.......','.kggk23k........','..kgGgk.........','...kwGk.........',
      '..kwWkggk.......','.kWWk..kk.......','.kggk...........','..kk............',
    ],
    greatsword: [
      '...........kkk..','..........k1ssk.','.........k1121k.','........k1123k..',
      '.......k1123k...','......k1123k....','.....k1123k.....','....k1123k......',
      '.kkk1123k.......','kgggk23k........','.kGGggk.........','..kggGk.........',
      '..kwWkkk........','.kWWk.kGk.......','kggk...k........','.kk.............',
    ],
    dagger: [
      '................','................','..........kk....','.........k1sk...',
      '........k123k...','.......k123k....','......k123k.....','.....k123k......',
      '....kk23k.......','...kggGk........','....kwgk........','...kwWk.........',
      '..kggk..........','...kk...........','................','................',
    ],
    axe: [
      '........kkkk....','......kk112kk...','.....k111223k...','....k1122233k...',
      '....k12233kwk...','....k2233kwWk...','.....k33kwWk....','......kkwWk.....',
      '......kwWk......','.....kwWk.......','....kwWk........','...kwWk.........',
      '..kwWk..........','.kggk...........','..kk............','................',
    ],
    hammer_wpn: [
      '.......kkkkk....','......k11123k...','.....k1122233k..','.....k1222333k..',
      '......k22333k...','.......kwWkk....','......kwWk......','.....kwWk.......',
      '....kwWk........','...kwWk.........','..kwWk..........','.kwWk...........',
      'kggk............','.kk.............','................','................',
    ],
    spear: [
      '............kk..','...........k1sk.','..........k122k.','.........k123k..',
      '.........k23k...','........kggk....','.......kwWk.....','......kwWk......',
      '.....kwWk.......','....kwWk........','...kwWk.........','..kwWk..........',
      '.kwWk...........','kWWk............','.kk.............','................',
    ],
    bow: [
      '.....kkkk.......','....kw11wk......','...kw2kk1wk.....','..kw2k..k1wk....',
      '..kwk....ksWk...','.kw1k....ks.k...','.kw2k....ks.....','.kwgk....ks.....',
      '.kw2k....ks.....','.kw1k....ks.k...','..kwk....ksWk...','..kw2k..k1wk....',
      '...kw2kk1wk.....','....kw11wk......','.....kkkk.......','................',
    ],
    staff: [
      '.........kkkk...','........k1cc1k..','.......k1c1sc1k.','.......k1c22c1k.',
      '........k1221k..','........kgggk...','.......kwWgk....','......kwWk......',
      '.....kwWk.......','....kwWk........','...kwWk.........','..kwWk..........',
      '.kwWk...........','kggk............','.kk.............','................',
    ],
    helmet: [
      '................','.....kkkkkk.....','...kk111122kk...','..k1112222233k..',
      '..k1122gg2233k..','.k11222gg22333k.','.k122222222333k.','.k12kkkkkkkk23k.',
      '.k22k..kk..k33k.','.k22k..kk..k33k.','.k23k..kk..k33k.','..k33k....k33k..',
      '...kk......kk...','................','................','................',
    ],
    armor: [
      '................','..kkk......kkk..','.k112kk..kk223k.','k11122kkkk22333k',
      'k11222111222333k','.k22k11gg22k33k.','..kk.k1gg23k.kk.','.....k12223k....',
      '.....k12223k....','....k1222233k...','....k2gggg23k...','....k2222233k...',
      '....k2333333k...','.....k33kk33k...','......kk..kk....','................',
    ],
    shield: [
      '................','...kkkkkkkkkk...','..kgg111122ggk..','..kg11122223gk..',
      '..k1112gg2233k..','..k112gggg233k..','..k1122gg2233k..','..k1222gg2233k..',
      '...k12222233k...','...k22222333k...','....k222333k....','.....k2333k.....',
      '......k33k......','.......kk.......','................','................',
    ],
    boots: [
      '................','................','....kkkk.kkkk...','....k12k.k12k...',
      '....k12k.k12k...','....k12k.k12k...','....k23k.k23k...','....k23k.k23k...',
      '...k123k.k123k..','..k1123k.k1123k.','.k12233k.k12233k','.k23333k.k23333k',
      '.kkkkkkk.kkkkkkk','................','................','................',
    ],
    gauntlets: [
      '................','................','...kk.kk.kk.....','..k12k12k12kk...',
      '..k12k12k1212k..','..k1122222233k..','.kk1122222333k..','k121222gg2333k..',
      '.k22222gg233k...','..k222222333k...','...k2233333k....','...kgg333ggk....',
      '...k2333333k....','....kkkkkkk.....','................','................',
    ],
    cloak: [
      '.....kkkkkk.....','....k11gg11k....','...k112gg223k...','...k12222233k...',
      '..k1122222333k..','..k1222222333k..','..k1222223333k..','.k112222233333k.',
      '.k122222233333k.','.k122232233333k.','.k222332233333k.','.k22k33k23k333k.',
      '.k2k.k3k.kk.k3k.','..k...k......k..','................','................',
    ],
    ore: [
      '................','......kkkk......','....kk3322kk....','...k33112223k...',
      '..k321s123333k..','..k3211231123k..','.k3322331s1233k.','.k333333112333k.',
      '..k3112332333k..','..k312233333k...','...k3333333k....','....kkkkkkk.....',
      '................','................','................','................',
    ],
    wood: [
      '................','................','......kkkkkkk...','....kkwwwwWWwk..',
      '...kwwWWWWwwWwk.','..kwWWwwwwwWWwk.','..kwwWWWWwwWWk..','.kwwWWwwwWWwk...',
      '.kllkWWWWwwk....','.klLlkWWwwk.....','.klllkwwkk......','..kkk.kk........',
      '................','................','................','................',
    ],
    leather: [
      '................','...kk......kk...','..kllkk..kkllk..','..kl11llll11lk..',
      '...k11122111k...','...k11222211k...','..kll122221llk..','..kL11222211Lk..',
      '...kL122221Lk...','...kLL2222LLk...','..kLLk2222kLLk..','..kkk.kLLk.kkk..',
      '.......kk.......','................','................','................',
    ],
    scale: [
      '................','......kkkk......','....kk1111kk....','...k11s11222k...',
      '..k1111222233k..','..k1122222333k..','..k1222233333k..','...k22233333k...',
      '...k22333333k...','....k233333k....','.....k3333k.....','......k33k......',
      '.......kk.......','................','................','................',
    ],
    dust: [
      '................','.......k........','......k1k..k....','.......k..ksk...',
      '....k......k....','...k1k..kk......','....k..k1sk.....','.....kk1112kk...',
      '....k11s12223k..','...k1112222333k.','..k112222333333k','..kkkkkkkkkkkkkk',
      '................','................','................','................',
    ],
    rune: [
      '................','.....kkkkkk.....','...kk333333kk...','..k3322222233k..',
      '..k3221111223k..','..k321k22k123k..','..k3221111223k..','..k3222112223k..',
      '..k3211221123k..','..k3222112223k..','..k3322222233k..','...kk333333kk...',
      '.....kkkkkk.....','................','................','................',
    ],
    gem: [
      '................','......kkkk......','....kk1111kk....','...k11ss1122k...',
      '..k11s1112223k..','..k1111222233k..','..k1222222333k..','...k22222333k...',
      '....k222333k....','.....k2333k.....','......k33k......','.......kk.......',
      '................','................','................','................',
    ],
    charm: [
      '................','.......kk.......','......kggk......','.....kg..gk.....',
      '....kkkkkkkk....','....kggggggk....','....kg1111gk....','....kg1ss1gk....',
      '....kg1111gk....','....kggggggk....','....kGggggGk....','....kGGggGGk....',
      '.....kkkkkk.....','......krrk......','......krrk......','.......kk.......',
    ],
    blueprint: [
      '................','...kkkkkkkkkk...','..kbbbbbbbbbbk..','..kbssssssssbk..',
      '..kbsbbbsbbsbk..','..kbsbbsbbbsbk..','..kbsbsbbbbsbk..','..kbsbbsssbsbk..',
      '..kbsbbbbbbsbk..','..kbssssssssbk..','..kBBBBBBBBBBk..','...kkkkkkkkkk...',
      '................','................','................','................',
    ],
    coin: [
      '................','.....kkkkkk.....','...kkggggggkk...','..kggssggggGGk..',
      '..kgsggGGggGGk..','.kggsgGggGgGGGk.','.kggggGggGgGGGk.','.kggggGggGgGGGk.',
      '.kggggGggGgGGGk.','..kggggGGggGGk..','..kGGggggggGGk..','...kkGGGGGGkk...',
      '.....kkkkkk.....','................','................','................',
    ],
    hammer: [
      '................','......kkkkkk....','.....kmmmmMMk...','....kmmssmmMMk..',
      '....kmmmmmmMMk..','.....kkkwWkkk...','.......kwWk.....','......kwWk......',
      '.....kwWk.......','....kwWk........','...kwWk.........','..kwWk..........',
      '.kWWk...........','..kk............','................','................',
    ],
    chest: [
      '................','................','..kkkkkkkkkkkk..','.kgwwwwwwwwwwgk.',
      '.kgwWWwwwwWWwgk.','.kggggggggggggk.','.kggggksskggggk.','.kwwwwkggkwwwwk.',
      '.kWWwwkkkkwwWWk.','.kwwwwwwwwwwwwk.','.kWWwwwwwwwwWWk.','.kggggggggggggk.',
      '..kkkkkkkkkkkk..','................','................','................',
    ],
    anvil_logo: [
      '................','......ko........','.....koog.......','......ko........',
      '.kkkkkkkkkkkkkk.','kmmmmmmmmmmmmmMk','kmmssmmmmmmmmMMk','.kkkmmmmmmmmkkk.',
      '....kmmmmmMk....','....kmmmmmMk....','...kmmmmmmmMk...','..kmmmmmmmmmMk..',
      '.kMMMMMMMMMMMMk.','.kkkkkkkkkkkkkk.','................','................',
    ],
    skill_book: [
      '................','...kkkkkkkkkk...','..kppppppppppk..','..kpggggggggpk..',
      '..kpgppggppgpk..','..kpgppppppgpk..','..kpgpgssgpgpk..','..kpgppppppgpk..',
      '..kpgppggppgpk..','..kpggggggggpk..','..kPPPPPPPPPPk..','...kkkkkkkkkk...',
      '................','................','................','................',
    ],
  };

  function renderMatrix(templateKey, paletteOverride = null, auraKey = null, scale = 3) {
    const palKey = paletteOverride ? paletteOverride.join(',') : 'default';
    const key = `${templateKey}|${palKey}|${auraKey || ''}|${scale}`;
    if (cache.has(key)) return cache.get(key);

    const rows = TEMPLATES[templateKey] || TEMPLATES.sword;
    const h = rows.length;
    const w = rows[0].length;

    const c = document.createElement('canvas');
    c.width = w * scale;
    c.height = h * scale;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const palette = Object.assign({}, BASE_COLORS);
    if (paletteOverride && paletteOverride.length >= 3) {
      palette['1'] = paletteOverride[0];
      palette['2'] = paletteOverride[1];
      palette['3'] = paletteOverride[2];
    }

    if (auraKey && AURA_COLORS[auraKey]) {
      const [a1, a2] = AURA_COLORS[auraKey];
      const dots = [[2,2],[13,2],[1,7],[14,8],[2,13],[13,13],[7,1],[8,14]];
      dots.forEach(([x, y], idx) => {
        ctx.fillStyle = idx % 2 === 0 ? a1 : a2;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      });
    }

    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < w; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const col = palette[ch] || palette[ch.toLowerCase()];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    const url = c.toDataURL('image/png');
    cache.set(key, url);
    return url;
  }

  function loadImageCached(url, onReady) {
    if (imgCache.has(url)) {
      const entry = imgCache.get(url);
      if (entry.status === 'ok') {
        if (onReady) onReady(entry.img);
        return entry.img;
      }
      if (entry.status === 'loading' && onReady) {
        entry.cbs.push(onReady);
      }
      return null;
    }
    const img = new Image();
    const entry = { img, status: 'loading', cbs: onReady ? [onReady] : [] };
    imgCache.set(url, entry);
    img.onload = () => {
      entry.status = 'ok';
      entry.cbs.forEach((cb) => cb(img));
      entry.cbs = [];
    };
    img.onerror = () => {
      entry.status = 'err';
      entry.cbs = [];
    };
    img.src = url;
    return null;
  }

  function drawAuraSparkles(ctx, w, h, auraKey) {
    if (!auraKey || !AURA_COLORS[auraKey]) return;
    const [a1, a2] = AURA_COLORS[auraKey];
    const pts = [
      [0.12, 0.14], [0.86, 0.16], [0.08, 0.52], [0.90, 0.54],
      [0.16, 0.86], [0.84, 0.84], [0.50, 0.08], [0.48, 0.92]
    ];
    const sz = Math.max(2, Math.round(w * 0.055));
    pts.forEach(([fx, fy], i) => {
      ctx.fillStyle = i % 2 === 0 ? a1 : a2;
      ctx.fillRect(Math.round(fx * w), Math.round(fy * h), sz, sz);
    });
  }

  // Draw an external PNG sprite onto canvas with aura sparkles (falls back to matrix if not loaded)
  function drawArtToCanvas(canvas, imgUrl, fallbackTemplate, fallbackPalette = null, auraKey = null) {
    if (!canvas) return;
    const renderImg = (img) => {
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawAuraSparkles(ctx, canvas.width, canvas.height, auraKey);
      const pad = 2;
      ctx.drawImage(img, pad, pad, canvas.width - pad * 2, canvas.height - pad * 2);
    };

    if (imgUrl) {
      const ready = loadImageCached(imgUrl, renderImg);
      if (ready) {
        renderImg(ready);
        return;
      }
    }
    drawToCanvas(canvas, fallbackTemplate, fallbackPalette, auraKey);
  }

  function drawToCanvas(canvas, templateKey, paletteOverride = null, auraKey = null) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rows = TEMPLATES[templateKey] || TEMPLATES.sword;
    const h = rows.length;
    const w = rows[0].length;
    const scale = Math.max(1, Math.floor(Math.min(canvas.width / w, canvas.height / h)));
    const ox = Math.floor((canvas.width - w * scale) / 2);
    const oy = Math.floor((canvas.height - h * scale) / 2);

    const palette = Object.assign({}, BASE_COLORS);
    if (paletteOverride && paletteOverride.length >= 3) {
      palette['1'] = paletteOverride[0];
      palette['2'] = paletteOverride[1];
      palette['3'] = paletteOverride[2];
    }

    drawAuraSparkles(ctx, canvas.width, canvas.height, auraKey);

    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < w; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const col = palette[ch] || palette[ch.toLowerCase()];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
      }
    }
  }

  const NAMED_ICONS = {
    coin:         ['coin', null],
    star_gem:     ['gem', ['#d4ffff', '#4de6d9', '#1b7a8c']],
    enchant_dust: ['dust', ['#f0c4ff', '#c278ff', '#6b27a8']],
    hammer:       ['hammer', null],
    rune_fire:    ['rune', ['#ffcf6b', '#ff5938', '#8f1b10']],
    chest:        ['chest', null],
    ore_iron:     ['ore', ['#e1e8f2', '#9aa6b8', '#525d70']],
    anvil_logo:   ['anvil_logo', null],
    skill_book:   ['skill_book', null],
  };

  function getNamedIcon(name, scale = 3) {
    const def = NAMED_ICONS[name];
    if (!def) return renderMatrix('coin', null, null, scale);
    return renderMatrix(def[0], def[1], null, scale);
  }

  // Direct high-res asset URLs generated by gpt-image-2.6-sunburst
  function getRecipeImgUrl(recipeId) {
    return `assets/items/${recipeId}.png`;
  }
  function getMatImgUrl(matId) {
    return `assets/mats/${matId}.png`;
  }
  function getCharImgUrl(charId) {
    return `assets/chars/${charId}.png`;
  }

  global.Sprites = {
    renderMatrix,
    drawToCanvas,
    drawArtToCanvas,
    loadImageCached,
    getNamedIcon,
    getRecipeImgUrl,
    getMatImgUrl,
    getCharImgUrl,
    AURA_COLORS,
    TEMPLATES,
  };
})(window);
