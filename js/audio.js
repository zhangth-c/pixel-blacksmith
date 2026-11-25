/* =====================================================
   8-Bit Web Audio SFX Engine (Zero external assets)
   ===================================================== */

(function (global) {
  let ctx = null;
  let enabled = true;

  function ensureCtx() {
    if (!enabled) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function tone(freq, duration, type = 'square', gainVal = 0.08, delay = 0, slideTo = null) {
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gainVal, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function noise(duration, gainVal = 0.07, delay = 0, highpass = 1200) {
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime + delay;
    const len = Math.max(1, Math.floor(c.sampleRate * duration));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(highpass, now);
    const g = c.createGain();
    g.gain.setValueAtTime(gainVal, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(c.destination);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  const SFX = {
    setEnabled(val) {
      enabled = !!val;
    },
    isEnabled() {
      return enabled;
    },
    click() {
      tone(620, 0.045, 'square', 0.045, 0, 740);
    },
    hammer(grade = 'good') {
      // Metallic anvil strike
      noise(0.07, 0.09, 0, 1800);
      tone(190, 0.12, 'triangle', 0.11, 0, 120);
      tone(980, 0.16, 'square', 0.055, 0.01, 860);
      if (grade === 'perfect') {
        tone(1318.5, 0.12, 'square', 0.06, 0.03);
        tone(1760, 0.18, 'square', 0.06, 0.08);
      } else if (grade === 'great') {
        tone(1046.5, 0.12, 'square', 0.05, 0.03);
      }
    },
    coin() {
      tone(987.77, 0.07, 'square', 0.06, 0);
      tone(1318.51, 0.18, 'square', 0.065, 0.065);
    },
    enchant() {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((n, i) => tone(n, 0.12, 'triangle', 0.07, i * 0.045));
    },
    upgrade() {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((n, i) => tone(n, 0.11, 'square', 0.06, i * 0.06));
    },
    fail() {
      tone(290, 0.13, 'sawtooth', 0.065, 0, 220);
      tone(210, 0.22, 'sawtooth', 0.065, 0.12, 140);
    },
    gachaPull() {
      const notes = [330, 392, 493.88, 587.33, 659.25, 783.99];
      notes.forEach((n, i) => tone(n, 0.08, 'square', 0.05, i * 0.045));
    },
    gachaFlip(rarity) {
      if (rarity === 'UR' || rarity === 'SSR') {
        const fanfare = rarity === 'UR'
          ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98]
          : [523.25, 659.25, 783.99, 1046.5];
        fanfare.forEach((n, i) => tone(n, 0.18, 'square', 0.07, i * 0.07));
      } else if (rarity === 'SR') {
        tone(587.33, 0.09, 'square', 0.06, 0);
        tone(880, 0.16, 'square', 0.06, 0.07);
      } else {
        tone(520, 0.07, 'square', 0.045, 0, 620);
      }
    },
    forgeComplete(rarity) {
      this.gachaFlip(rarity);
    },
    bid() {
      tone(740, 0.05, 'triangle', 0.06, 0);
      tone(880, 0.07, 'triangle', 0.06, 0.05);
    }
  };

  global.SFX = SFX;
})(window);
