// ============================
// PREMIUM AVATAR SYSTEM — Generos Care
// Duolingo-style geometric child avatars
// ============================

/* GLOBAL CONFIG */
const AVATAR_SKIN_TONES = {
  'warm-peach': { label: 'Cerah', hex: '#FAD5B5', order: 0 },
  'olive':      { label: 'Olive', hex: '#D4A574', order: 1 },
  'tan':        { label: 'Sawo', hex: '#C68E5B', order: 2 },
  'deep-brown': { label: 'Coklat', hex: '#8D5524', order: 3 },
  'golden':     { label: 'Kuning', hex: '#F1C27D', order: 4 },
  'beige':      { label: 'Krem', hex: '#FFE0BD', order: 5 },
};

const AVATAR_HAIR_STYLES = {
  'short-curly':   { label: 'Ikal', order: 0 },
  'long-straight': { label: 'Panjang', order: 1 },
  'pigtails':      { label: 'Cepol', order: 2 },
  'short-flat':    { label: 'Rapi', order: 3 },
  'messy':         { label: 'Acak', order: 4 },
  'bald-cap':      { label: 'Tipis', order: 5 },
};

const AVATAR_HAIR_COLORS = {
  'dark-brown':  { label: 'Coklat', hex: '#3B2314', order: 0 },
  'black':       { label: 'Hitam', hex: '#1A1A1A', order: 1 },
  'light-brown': { label: 'CokMuda', hex: '#8D6E4E', order: 2 },
  'blonde':      { label: 'Pirang', hex: '#D4A843', order: 3 },
  'ginger':      { label: 'Merah', hex: '#B85C2E', order: 4 },
};

const AVATAR_EYE_STYLES = {
  'dots':  { label: 'Titik', order: 0 },
  'wide':  { label: 'Besar', order: 1 },
  'happy': { label: '^_^', order: 2 },
};

const AVATAR_MOUTH_STYLES = {
  'smile':      { label: 'Senyum', order: 0 },
  'open-smile': { label: 'Gembira', order: 1 },
  'neutral':    { label: 'Biasa', order: 2 },
};

const AVATAR_CLOTHING_COLORS = {
  'navy':     { label: 'Biru', hex: '#003DA5', order: 0 },
  'coral':    { label: 'Merah', hex: '#E86C3A', order: 1 },
  'green':    { label: 'Hijau', hex: '#4CAF82', order: 2 },
  'yellow':   { label: 'Kuning', hex: '#F5A623', order: 3 },
  'sky-blue': { label: 'Langit', hex: '#5B9BD5', order: 4 },
};

const AVATAR_DEFAULT = {
  type: 'child',
  skinTone: 'warm-peach',
  hair: 'short-flat',
  hairColor: 'dark-brown',
  eyes: 'dots',
  mouth: 'smile',
  clothingColor: 'navy',
};

// ============================
// PARSE — backward compat dg emoji
// ============================
function avatarParse(data) {
  if (!data) return { ...AVATAR_DEFAULT };
  if (typeof data === 'string') {
    try {
      const p = JSON.parse(data);
      if (p && p.type) return { ...AVATAR_DEFAULT, ...p };
    } catch (_) {
      // Legacy emoji — return default + _emoji flag
      return { ...AVATAR_DEFAULT, _emoji: data, _isEmoji: true };
    }
  }
  // Strip internal flags so they don't persist after user clicks options
  const clean = {};
  for (const k of Object.keys(data)) {
    if (k !== '_emoji' && k !== '_isEmoji') clean[k] = data[k];
  }
  return { ...AVATAR_DEFAULT, ...clean };
}

// ============================
// GENERATE SVG
// viewBox="0 0 120 140"
// ============================
function avatarGenerateSVG(config, size) {
  const cfg = avatarParse(config);
  size = size || 120;

  // Colors
  const skinFill  = AVATAR_SKIN_TONES[cfg.skinTone]?.hex || '#FAD5B5';
  const hairFill  = AVATAR_HAIR_COLORS[cfg.hairColor]?.hex || '#3B2314';
  const clothFill = AVATAR_CLOTHING_COLORS[cfg.clothingColor]?.hex || '#003DA5';

  // If emoji legacy, render as text
  if (cfg._isEmoji) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" width="${size}" height="${size}">
      <text x="60" y="95" text-anchor="middle" font-size="80">${cfg._emoji}</text>
    </svg>`;
  }

  // Child props — big head, round body
  const cx = 60, cy = 38; // head center
  const headR = 27;
  const bodyY = 64, bodyH = 55, bodyW = 54, bodyRX = 22;

  // Build SVG parts
  let parts = [];

  // Shadow
  parts.push(`<ellipse cx="60" cy="132" rx="28" ry="5" fill="rgba(0,0,0,0.06)"/>`);

  // Legs
  const legW = 12, legH = 14, legRX = 6;
  parts.push(`<rect x="40" y="114" width="${legW}" height="${legH}" rx="${legRX}" fill="${skinFill}"/>`);
  parts.push(`<rect x="68" y="114" width="${legW}" height="${legH}" rx="${legRX}" fill="${skinFill}"/>`);

  // Arms
  parts.push(`<rect x="24" y="74" width="12" height="26" rx="6" fill="${skinFill}"/>`);
  parts.push(`<rect x="84" y="74" width="12" height="26" rx="6" fill="${skinFill}"/>`);

  // Body (clothing)
  parts.push(`<rect x="33" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="${bodyRX}" fill="${clothFill}"/>`);

  // Collar detail
  parts.push(`<path d="M52,66 Q60,72 68,66" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" stroke-linecap="round"/>`);

  // Neck
  parts.push(`<rect x="54" y="58" width="12" height="8" rx="4" fill="${skinFill}"/>`);

  // Head
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${headR}" fill="${skinFill}"/>`);

  // Cheeks (warm blush)
  parts.push(`<ellipse cx="${cx - 11}" cy="${cy + 4}" rx="5" ry="3" fill="rgba(232,108,58,0.12)"/>`);
  parts.push(`<ellipse cx="${cx + 11}" cy="${cy + 4}" rx="5" ry="3" fill="rgba(232,108,58,0.12)"/>`);

  // Hair
  parts = parts.concat(avatarHairPaths(cfg.hair, hairFill));

  // Eyes
  parts = parts.concat(avatarEyes(cfg.eyes, cx, cy - 1));

  // Mouth
  parts.push(avatarMouth(cfg.mouth, cx, cy + 9));

  // Assemble
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" width="${size}" height="${size}">
    ${parts.join('\n    ')}
  </svg>`;
}

// ============================
// HAIR PATHS — 6 styles
// ============================
function avatarHairPaths(style, fill) {
  const all = {
    'short-curly': [
      `M35,38 Q35,12 48,8 Q55,6 62,8 Q75,12 78,30 Q80,36 85,38 Q82,40 75,38 Q70,36 60,34 Q50,33 42,35 Q37,37 35,38 Z`,
    ],
    'long-straight': [
      `M30,38 Q30,10 48,6 Q60,5 72,6 Q90,10 90,38 L92,62 Q90,65 86,63 L84,40 Q82,14 60,11 Q48,11 38,14 Q36,40 34,63 Q30,65 28,62 Z`,
    ],
    'pigtails': [
      `M42,36 Q40,12 50,8 Q55,6 58,10 Q60,14 60,22 Q60,30 58,35 Q54,38 48,36 Z`,
      `M60,36 Q60,12 70,8 Q75,7 78,12 Q80,18 80,28 Q80,34 76,36 Q70,38 64,36 Z`,
      `M32,40 Q28,38 26,42 Q28,46 34,44 Z`,
      `M86,40 Q90,38 92,42 Q90,46 84,44 Z`,
    ],
    'short-flat': [
      `M33,40 Q34,16 42,10 Q52,6 60,6 Q68,6 78,10 Q86,16 87,40 Q84,38 78,36 Q68,34 60,34 Q52,34 42,36 Q36,38 33,40 Z`,
    ],
    'messy': [
      `M30,36 Q28,8 42,4 Q50,2 58,4 Q66,2 76,6 Q84,10 86,22 Q88,18 90,20 Q92,30 88,40 Q85,44 80,42 Q78,38 74,34 Q66,30 58,30 Q50,30 42,34 Q38,37 35,42 Q32,44 30,36 Z`,
      `M44,4 Q48,0 52,3 Q50,8 46,6 Z`,
      `M68,3 Q72,0 74,4 Q72,8 66,6 Z`,
    ],
    'bald-cap': [
      `M38,38 Q38,12 46,8 Q54,6 60,6 Q66,6 74,8 Q82,12 82,38 Q78,35 70,32 Q60,30 50,32 Q42,35 38,38 Z`,
    ],
  };

  const paths = all[style] || all['short-flat'];
  return paths.map(d => `<path d="${d}" fill="${fill}"/>`);
}

// ============================
// EYES — 3 styles
// ============================
function avatarEyes(style, cx, cy) {
  const base = [
    // Simple dots
    `<circle cx="${cx - 9}" cy="${cy}" r="3" fill="#1A1A2E"/>`,
    `<circle cx="${cx + 9}" cy="${cy}" r="3" fill="#1A1A2E"/>`,
  ];

  if (style === 'dots') return base;

  if (style === 'wide') {
    return [
      `<circle cx="${cx - 9}" cy="${cy}" r="5" fill="white" stroke="#1A1A2E" stroke-width="1.5"/>`,
      `<circle cx="${cx - 9}" cy="${cy}" r="2" fill="#1A1A2E"/>`,
      `<circle cx="${cx + 9}" cy="${cy}" r="5" fill="white" stroke="#1A1A2E" stroke-width="1.5"/>`,
      `<circle cx="${cx + 9}" cy="${cy}" r="2" fill="#1A1A2E"/>`,
      `<circle cx="${cx - 10}" cy="${cy - 2}" r="1" fill="white"/>`,
      `<circle cx="${cx + 8}" cy="${cy - 2}" r="1" fill="white"/>`,
    ];
  }

  if (style === 'happy') {
    return [
      `<path d="M${cx - 13},${cy - 1} Q${cx - 10},${cy - 5} ${cx - 7},${cy - 1}" fill="none" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round"/>`,
      `<path d="M${cx + 7},${cy - 1} Q${cx + 10},${cy - 5} ${cx + 13},${cy - 1}" fill="none" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round"/>`,
    ];
  }

  return base;
}

// ============================
// MOUTH — 3 styles
// ============================
function avatarMouth(style, cx, cy) {
  switch (style) {
    case 'smile':
      return `<path d="M${cx - 7},${cy} Q${cx},${cy + 7} ${cx + 7},${cy}" fill="none" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round"/>`;
    case 'open-smile':
      return `<ellipse cx="${cx}" cy="${cy + 2}" rx="5" ry="4" fill="#E8682E"/>
  <path d="M${cx - 5},${cy + 2} Q${cx},${cy + 6} ${cx + 5},${cy + 2}" fill="none" stroke="#1A1A2E" stroke-width="1.5"/>`;
    case 'neutral':
      return `<line x1="${cx - 6}" y1="${cy}" x2="${cx + 6}" y2="${cy}" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round"/>`;
    default:
      return `<path d="M${cx - 7},${cy} Q${cx},${cy + 7} ${cx + 7},${cy}" fill="none" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round"/>`;
  }
}

// ============================
// RENDER AVATAR PREVIEW (to DOM element)
// ============================
function avatarRender(el, config, size) {
  if (!el) return;
  const svg = avatarGenerateSVG(config, size || 80);
  el.innerHTML = svg;
}

// ============================
// AVATAR PICKER UI BUILDER
// Returns { container, getConfig, setConfig }
// ============================
function avatarPickerBuilder(containerEl, initialConfig, onChange) {
  const cfg = avatarParse(initialConfig);

  // Container
  containerEl.innerHTML = '';
  containerEl.style.cssText = 'text-align:center;';

  // === PREVIEW ===
  const previewDiv = document.createElement('div');
  previewDiv.id = 'avatar-picker-preview';
  previewDiv.style.cssText = 'margin:0 auto 12px;width:88px;height:88px;';
  avatarRender(previewDiv, cfg, 88);
  containerEl.appendChild(previewDiv);

  // === OPTIONS ROWS ===
  const optionRows = [
    { id: 'skinTone', label: 'Warna Kulit', map: AVATAR_SKIN_TONES },
    { id: 'hair', label: 'Rambut', map: AVATAR_HAIR_STYLES },
    { id: 'hairColor', label: 'Warna Rambut', map: AVATAR_HAIR_COLORS },
    { id: 'eyes', label: 'Mata', map: AVATAR_EYE_STYLES },
    { id: 'mouth', label: 'Mulut', map: AVATAR_MOUTH_STYLES },
    { id: 'clothingColor', label: 'Baju', map: AVATAR_CLOTHING_COLORS },
  ];

  for (const row of optionRows) {
    const rowDiv = document.createElement('div');
    rowDiv.style.cssText = 'margin-bottom:10px;';

    const label = document.createElement('div');
    label.textContent = row.label;
    label.style.cssText = 'font-size:11px;color:#888;margin-bottom:4px;font-weight:600;';
    rowDiv.appendChild(label);

    const optionsDiv = document.createElement('div');
    optionsDiv.style.cssText = 'display:flex;justify-content:center;gap:6px;flex-wrap:wrap;';

    const entries = Object.entries(row.map).sort((a, b) => a[1].order - b[1].order);

    for (const [key, val] of entries) {
      const btn = document.createElement('div');
      btn.dataset.key = key;
      btn.style.cssText = 'width:36px;height:36px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:#555;border:2px solid #e8e8e8;background:#f9f9f9;transition:all 0.15s;user-select:none;';

      // For skin/clothing colors — show color swatch
      if (val.hex) {
        btn.style.background = val.hex;
        btn.style.border = '2px solid #ddd';
        if (val.hex === '#003DA5' || val.hex === '#1A1A1A' || val.hex === '#3B2314' || val.hex === '#8D5524') {
          btn.style.border = '2px solid rgba(0,0,0,0.2)';
        }
        btn.textContent = '';
        // Checkmark for selected
        if (key === cfg[row.id]) {
          btn.style.border = '3px solid #E8682E';
          btn.innerHTML = '<span style="color:white;font-size:14px;text-shadow:0 1px 2px rgba(0,0,0,0.4);">✓</span>';
        }
      } else {
        btn.textContent = val.label.charAt(0).toUpperCase();
        if (key === cfg[row.id]) {
          btn.style.border = '3px solid #E8682E';
          btn.style.background = '#FFF0E8';
        }
      }

      // For hair styles — use small mini icons
      if (row.id === 'hair') {
        btn.style.width = '42px';
        btn.style.height = '42px';
        btn.style.borderRadius = '12px';
        btn.style.flexDirection = 'column';
        btn.style.fontSize = '8px';
        btn.style.padding = '2px';

        // Small SVG preview (strip internal flags from cfg clone)
        const miniCfg = {};
        for (const kk of Object.keys(cfg)) {
          if (kk !== '_emoji' && kk !== '_isEmoji') miniCfg[kk] = cfg[kk];
        }
        miniCfg.hair = key;
        const miniSvg = avatarGenerateSVG(miniCfg, 36);
        btn.innerHTML = miniSvg;
        btn.style.background = '#fff';
        if (key === cfg.hair) {
          btn.style.border = '3px solid #E8682E';
        }
      }

      btn.onclick = (e) => {
        e.stopPropagation();
        cfg[row.id] = key;
        // Re-render
        avatarRender(previewDiv, cfg, 88);

        // Update all buttons in this row
        optionsDiv.querySelectorAll('div[data-key]').forEach(b => {
          const bk = b.dataset.key;
          const val2 = row.map[bk];
          b.style.border = '2px solid #e8e8e8';

          if (val2.hex) {
            b.style.background = val2.hex;
            if (val2.hex === '#003DA5' || val2.hex === '#1A1A1A' || val2.hex === '#3B2314' || val2.hex === '#8D5524') {
              b.style.border = '2px solid rgba(0,0,0,0.2)';
            }
            if (bk === key) {
              b.style.border = '3px solid #E8682E';
              b.innerHTML = '<span style="color:white;font-size:14px;text-shadow:0 1px 2px rgba(0,0,0,0.4);">✓</span>';
            } else {
              b.innerHTML = '';
            }
          } else if (row.id === 'hair') {
            b.style.background = '#fff';
            const miniCfg2 = {};
            for (const kk of Object.keys(cfg)) {
              if (kk !== '_emoji' && kk !== '_isEmoji') miniCfg2[kk] = cfg[kk];
            }
            miniCfg2.hair = bk;
            const miniSvg2 = avatarGenerateSVG(miniCfg2, 36);
            b.innerHTML = miniSvg2;
            if (bk === key) {
              b.style.border = '3px solid #E8682E';
            }
          } else {
            b.textContent = val2.label.charAt(0).toUpperCase();
            b.style.background = '#f9f9f9';
            if (bk === key) {
              b.style.border = '3px solid #E8682E';
              b.style.background = '#FFF0E8';
            }
          }
        });

        if (onChange) onChange(cfg);
      };

      optionsDiv.appendChild(btn);
    }

    rowDiv.appendChild(optionsDiv);
    containerEl.appendChild(rowDiv);
  }

  return {
    getConfig: () => ({ ...cfg }),
    setConfig: (newCfg) => {
      Object.assign(cfg, newCfg);
      avatarRender(previewDiv, cfg, 88);
    },
  };
}

// ============================
// ENCODE as JSON string (for storage)
// ============================
function avatarEncode(config) {
  const c = avatarParse(config);
  if (c._isEmoji) return c._emoji; // keep legacy
  const out = {};
  out.type = 'child';
  out.skinTone = c.skinTone;
  out.hair = c.hair;
  out.hairColor = c.hairColor;
  out.eyes = c.eyes;
  out.mouth = c.mouth;
  out.clothingColor = c.clothingColor;
  return JSON.stringify(out);
}

// ============================
// DECODE from stored JSON (backward compat)
// ============================
function avatarDecode(stored) {
  return avatarParse(stored);
}

// ============================
// AVATAR — ilustrasi berdasarkan umur + gender
// ============================
function getAvatarByAgeGender(ageMonths, gender) {
  if (ageMonths == null || ageMonths < 0) ageMonths = 0;
  if (gender == null) gender = 'Laki-laki';

  if (ageMonths <= 6) {
    return gender === 'Perempuan' ? 'newborn-pink.png' : 'newborn-cream.png';
  } else if (ageMonths <= 12) {
    return gender === 'Perempuan' ? 'bayi-sit-girl.png' : 'bayi-sit-boy.png';
  } else if (ageMonths <= 36) {
    return gender === 'Perempuan' ? 'anak-celebrate.png' : 'anak-explore.png';
  } else {
    return gender === 'Perempuan' ? 'anak-growth.png' : 'anak-wave.png';
  }
}
