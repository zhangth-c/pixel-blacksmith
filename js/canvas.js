/* =====================================================
   Live High-Res Pixel-Art Workshop Canvas (480x320)
   Combines gpt-image-2.6-sunburst workshop_bg.png +
   transparent blacksmith & customer sprites +
   live animated flames, sparks, hit-stop & floating text
   ===================================================== */

(function (global) {
  let canvas = null;
  let ctx = null;
  let tick = 0;
  let shakeTimer = 0;
  let hammerTimer = 0;
  let forgeGlow = 0;
  let particles = [];
  let floatTexts = [];
  let furnaceLevel = 1;
  let anvilLevel = 1;
  let activeCustomerId = 'cust_hero';
  let customerMood = 'wait';
  let moodTimer = 0;

  const W = 480;
  const H = 320;

  // Preloaded high-res pixel art images
  const bgImg = new Image();
  let bgReady = false;
  bgImg.onload = () => { bgReady = true; };
  bgImg.src = 'assets/workshop_bg.png';

  const bsIdleImg = new Image();
  let bsIdleReady = false;
  bsIdleImg.onload = () => { bsIdleReady = true; };
  bsIdleImg.src = 'assets/chars/blacksmith_idle.png';

  const bsHitImg = new Image();
  let bsHitReady = false;
  bsHitImg.onload = () => { bsHitReady = true; };
  bsHitImg.src = 'assets/chars/blacksmith_hit.png';

  const custImgs = {};
  function getCustomerImg(id) {
    if (!id) return null;
    if (!custImgs[id]) {
      const im = new Image();
      const entry = { img: im, ready: false };
      im.onload = () => { entry.ready = true; };
      im.src = `assets/chars/${id}.png`;
      custImgs[id] = entry;
    }
    return custImgs[id].ready ? custImgs[id].img : null;
  }

  function init(canvasEl) {
    canvas = canvasEl;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < 18; i++) {
      particles.push(makeEmber());
    }
    requestAnimationFrame(loop);
  }

  function makeEmber() {
    // Furnace mouth in workshop_bg.png sits around x: 52..118, y: 155..205
    return {
      kind: 'ember',
      x: 52 + Math.random() * 66,
      y: 165 + Math.random() * 34,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.35 - Math.random() * 0.55,
      life: 40 + Math.random() * 70,
      size: Math.random() > 0.45 ? 3 : 2,
      color: furnaceLevel >= 5 ? (Math.random() > 0.5 ? '#70f5ff' : '#e08aff')
           : furnaceLevel >= 3 ? (Math.random() > 0.5 ? '#ffe46b' : '#ff5b36')
           : (Math.random() > 0.4 ? '#ffcf40' : '#ff7b29')
    };
  }

  function spawnSparks(x, y, count = 26, colors = ['#fff6a6', '#ffcf40', '#ff6b35']) {
    for (let i = 0; i < count; i++) {
      const ang = -Math.PI * Math.random();
      const spd = 1.2 + Math.random() * 3.8;
      particles.push({
        kind: 'spark',
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.8,
        life: 20 + Math.random() * 28,
        size: Math.random() > 0.5 ? 3 : 2,
        color: colors[i % colors.length]
      });
    }
  }

  function spawnFloatText(x, y, text, color = '#ffcf40') {
    floatTexts.push({ x, y, text, color, life: 58 });
  }

  function triggerHammer(grade = 'good', label = '') {
    hammerTimer = 20;
    forgeGlow = 32;
    shakeTimer = grade === 'perfect' ? 12 : 6;
    const colors = grade === 'perfect'
      ? ['#ffffff', '#ffea66', '#4de6d9', '#ff6b35']
      : ['#fff099', '#ff9f33', '#ff5938'];
    // Anvil top in workshop_bg.png is near (236, 186)
    spawnSparks(236, 184, grade === 'perfect' ? 40 : 24, colors);
    if (label) {
      spawnFloatText(236, 146, label, grade === 'perfect' ? '#ffea66' : '#4de6d9');
    }
  }

  function triggerEnchant(color = '#c576ff', label = '附魔成功!') {
    forgeGlow = 36;
    spawnSparks(236, 180, 36, ['#ffffff', color, '#4de6d9']);
    spawnFloatText(236, 140, label, color);
  }

  function triggerSale(amountText = '+100G') {
    customerMood = 'happy';
    moodTimer = 95;
    spawnSparks(394, 186, 28, ['#fff6a6', '#ffcf40', '#69df6e']);
    spawnFloatText(392, 134, amountText, '#ffcf40');
  }

  function triggerHaggleFail() {
    customerMood = 'angry';
    moodTimer = 75;
    spawnFloatText(392, 138, '太贵了!', '#ff5964');
  }

  function syncState(state) {
    if (!state) return;
    furnaceLevel = state.upgrades.furnace || 1;
    anvilLevel = state.upgrades.anvil || 1;
    if (state.customers && state.customers.length > 0) {
      activeCustomerId = state.customers[0].sprite || 'cust_hero';
    } else {
      activeCustomerId = null;
    }
  }

  function drawScene() {
    if (bgReady) {
      ctx.drawImage(bgImg, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#231b2b';
      ctx.fillRect(0, 0, W, H);
    }

    // Dynamic furnace glow pulse overlay (shifts hue for high-level Star Furnace!)
    const pulse = 0.14 + Math.sin(tick * 0.16) * 0.05 + (forgeGlow > 0 ? 0.14 : 0);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const grad = ctx.createRadialGradient(84, 182, 8, 84, 182, 74);
    if (furnaceLevel >= 5) {
      grad.addColorStop(0, `rgba(120, 240, 255, ${pulse + 0.12})`);
      grad.addColorStop(0.5, `rgba(190, 95, 255, ${pulse * 0.65})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (furnaceLevel >= 3) {
      grad.addColorStop(0, `rgba(255, 235, 110, ${pulse + 0.1})`);
      grad.addColorStop(0.55, `rgba(255, 95, 35, ${pulse * 0.6})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      grad.addColorStop(0, `rgba(255, 170, 60, ${pulse})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(10, 108, 150, 150);

    // Subtle lantern flicker
    const lPulse = 0.08 + Math.sin(tick * 0.11 + 1.5) * 0.03;
    const lGrad = ctx.createRadialGradient(240, 68, 4, 240, 68, 56);
    lGrad.addColorStop(0, `rgba(255, 215, 100, ${lPulse})`);
    lGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lGrad;
    ctx.fillRect(184, 12, 112, 112);
    ctx.restore();

    // Hot glowing ingot resting on anvil during forging/enchanting
    if (forgeGlow > 0) {
      const glowC = forgeGlow > 14 ? '#fff6a6' : '#ff6b35';
      ctx.fillStyle = glowC;
      ctx.fillRect(222, 179, 28, 6);
      ctx.fillStyle = 'rgba(255, 180, 70, 0.35)';
      ctx.fillRect(216, 175, 40, 14);
    }

    // Animated Blacksmith beside anvil (left-center)
    const bob = Math.floor(tick / 24) % 2;
    const isHit = hammerTimer > 0 && hammerTimer < 14;
    const bsSprite = (isHit && bsHitReady) ? bsHitImg : (bsIdleReady ? bsIdleImg : null);
    if (bsSprite) {
      const bw = 114;
      const bh = 114;
      const bx = 128 + (isHit ? 8 : 0);
      const by = 166 + (isHit ? 2 : bob * 2);
      // Soft floor shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.beginPath();
      ctx.ellipse(bx + 54, by + 104, 30, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(bsSprite, bx, by, bw, bh);
    }

    // Active Visiting Adventurer Portrait Framed Bubble on Shop Counter Right
    if (activeCustomerId) {
      const custImg = getCustomerImg(activeCustomerId);
      const cbob = Math.floor((tick + 12) / 28) % 2;
      const fx = 382;
      const fy = 112 + cbob * 2;
      if (custImg) {
        // Cozy pixel frame badge behind customer portrait at counter
        ctx.fillStyle = 'rgba(18, 13, 24, 0.85)';
        ctx.fillRect(fx - 4, fy - 4, 84, 84);
        ctx.strokeStyle = customerMood === 'happy' ? '#69df6e' : customerMood === 'angry' ? '#ff5964' : '#e6a92e';
        ctx.lineWidth = 3;
        ctx.strokeRect(fx - 3, fy - 3, 82, 82);
        ctx.drawImage(custImg, fx, fy, 76, 76);

        // Mini reaction tag
        ctx.fillStyle = '#120d16';
        ctx.fillRect(fx + 52, fy - 12, 32, 16);
        ctx.fillStyle = customerMood === 'happy' ? '#69df6e' : customerMood === 'angry' ? '#ff5964' : '#ffcf40';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(customerMood === 'happy' ? '买!' : customerMood === 'angry' ? '怒!' : '求购', fx + 68, fy);
      }
    }
  }

  function updateAndDrawParticles() {
    if (tick % 7 === 0 && particles.length < 85) {
      particles.push(makeEmber());
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.kind === 'spark') p.vy += 0.14;
      p.life -= 1;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }

    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const ft = floatTexts[i];
      ft.y -= 0.65;
      ft.life -= 1;
      if (ft.life <= 0) {
        floatTexts.splice(i, 1);
        continue;
      }
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0c080f';
      ctx.fillText(ft.text, Math.round(ft.x) + 2, Math.round(ft.y) + 2);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
    }
  }

  function loop() {
    tick++;
    if (hammerTimer > 0) hammerTimer--;
    if (forgeGlow > 0) forgeGlow--;
    if (shakeTimer > 0) shakeTimer--;
    if (moodTimer > 0) {
      moodTimer--;
      if (moodTimer === 0) customerMood = 'wait';
    }

    ctx.save();
    if (shakeTimer > 0) {
      ctx.translate(Math.round((Math.random() - 0.5) * 6), Math.round((Math.random() - 0.5) * 6));
    }
    drawScene();
    updateAndDrawParticles();
    ctx.restore();
    requestAnimationFrame(loop);
  }

  global.WorkshopCanvas = {
    init,
    syncState,
    triggerHammer,
    triggerEnchant,
    triggerSale,
    triggerHaggleFail,
  };
})(window);
