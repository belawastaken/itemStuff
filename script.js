/* --- CONFIGURATION --- */
const USE_MASKS = true;
let AUTO_FIX_ARTIFACTS = true;

// 1. STANDARD MINECRAFT FONT WIDTHS
const CHAR_WIDTHS = {
    32: 4, 33: 2, 34: 5, 35: 6, 36: 6, 37: 6, 38: 6, 39: 3, 40: 5, 41: 5, 42: 5, 
    43: 6, 44: 2, 45: 6, 46: 2, 47: 6, 48: 6, 49: 6, 50: 6, 51: 6, 52: 6, 53: 6, 
    54: 6, 55: 6, 56: 6, 57: 6, 58: 2, 59: 2, 60: 5, 61: 6, 62: 5, 63: 6, 64: 7, 
    65: 6, 66: 6, 67: 6, 68: 6, 69: 6, 70: 6, 71: 6, 72: 6, 73: 4, 74: 6, 75: 6, 
    76: 6, 77: 6, 78: 6, 79: 6, 80: 6, 81: 6, 82: 6, 83: 6, 84: 6, 85: 6, 86: 6, 
    87: 6, 88: 6, 89: 6, 90: 6, 91: 4, 92: 6, 93: 4, 94: 6, 95: 6, 96: 3, 97: 6, 
    98: 6, 99: 6, 100: 6, 101: 6, 102: 5, 103: 6, 104: 6, 105: 2, 106: 6, 107: 5, 
    108: 3, 109: 6, 110: 6, 111: 6, 112: 6, 113: 6, 114: 6, 115: 6, 116: 4, 117: 6, 
    118: 6, 119: 6, 120: 6, 121: 6, 122: 6, 123: 5, 124: 2, 125: 5, 126: 7, 
    default: 6
};

// 2. KNOWN RARITIES
const RARITIES = [
    "VERY SPECIAL", "UNCOMMON", "LEGENDARY", "SPECIAL", 
    "COMMON", "DIVINE", "DEVINE", "MYTHIC", "RARE", "EPIC"
];

document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('code-editor');
    const bgToggle = document.getElementById('bg-toggle-btn');
    const magicToggle = document.getElementById('magic-toggle-btn');
    const previewPanel = document.getElementById('preview-panel');

    if (editor) {
        editor.addEventListener('input', () => render(editor.value));
        
        // --- PASTE HANDLER ---
        editor.addEventListener('paste', (e) => {
            const text = (e.clipboardData || window.clipboardData).getData('text');
            try {
                const json = JSON.parse(text);
                if (json.Lore && Array.isArray(json.Lore)) {
                    e.preventDefault(); 
                    
                    // Logic: Auto-insert space before rarity if magic artifacts exist
                    json.Lore = json.Lore.map(line => {
                        const plain = line.replace(/§[0-9a-fk-or]/gi, "").trim();
                        // Check for Start/End Artifacts (Strict Case Sensitive Check)
                        // This prevents normal text lines from being flagged
                        const hasMagicArtifacts = /^[aAv\-].*[aAv\-]$/.test(plain);

                        if (hasMagicArtifacts) {
                            for (const rarity of RARITIES) {
                                if (line.includes(rarity)) {
                                    // Add Space ONLY if missing
                                    const regex = new RegExp(`(?<! )(${rarity})`, 'g');
                                    line = line.replace(regex, ' $1');
                                    break;
                                }
                            }
                        }
                        return line;
                    });

                    document.execCommand('insertText', false, JSON.stringify(json, null, 2));
                }
            } catch (err) {}
        });
    }

    if (bgToggle && previewPanel) {
        bgToggle.addEventListener('click', () => {
            previewPanel.classList.toggle('white-mode');
        });
    }

    if (magicToggle) {
        magicToggle.addEventListener('click', () => {
            AUTO_FIX_ARTIFACTS = !AUTO_FIX_ARTIFACTS;
            if (AUTO_FIX_ARTIFACTS) {
                magicToggle.innerText = "★ Auto-Magic: ON";
                magicToggle.classList.add('active');
            } else {
                magicToggle.innerText = "☆ Auto-Magic: OFF";
                magicToggle.classList.remove('active');
            }
            if (editor) render(editor.value);
        });
    }

    if (editor) render(editor.value);
    startObfuscation();
});

function render(jsonString) {
    const container = document.getElementById('item-tooltip');
    if (!container) return;

    try {
        const data = JSON.parse(jsonString);
        let name = data.name || (data.tag?.display?.Name) || "";
        let lore = data.Lore || (data.tag?.display?.Lore) || [];
        
        // --- FIX: CASE-SENSITIVE REGEX ---
        if (AUTO_FIX_ARTIFACTS && lore.length > 0) {
            lore = lore.map(line => {
                // 1. Removed '/i' flag (Case Sensitive)
                // 2. Expanded Color Regex to [0-9a-fk-orA-FK-OR] manually
                // 3. Artifact class [aAv\-] allows lowercase 'v' but ignores Uppercase 'V'
                
                // Fix Start
                line = line.replace(/^((?:§[0-9a-fk-orA-FK-OR])+)((?:[aAv\-])+)(?=§)/, '$1§k$2');
                
                // Fix End
                line = line.replace(/((?:§[0-9a-fk-orA-FK-OR])+)?((?:[aAv\-])+)$/, '$1§k$2');
                
                return line;
            });
        }
        
        let html = `<div class="tooltip-box">`;
        html += `<div class="line p-top"></div><div class="line p-bottom"></div><div class="line p-left"></div><div class="line p-right"></div>`;
        html += `<div class="line b-top"></div><div class="line b-bottom"></div><div class="line b-left"></div><div class="line b-right"></div>`;

        html += `<div class="tooltip-content">`;
        html += `<div class="tooltip-title">${parseText(name)}</div>`;
        
        if (lore.length > 0) {
            html += `<div class="tooltip-lore">`;
            lore.forEach((line) => {
                html += parseText(line) + "<br>";
            });
            html += `</div>`;
        }
        
        html += `</div></div>`; 
        container.innerHTML = html;
        document.getElementById('code-editor').style.borderLeft = "none"; 

    } catch (e) {
        document.getElementById('code-editor').style.borderLeft = "2px solid #ff5555";
    }
}

function parseText(text) {
    if (!text) return "";
    const parts = text.split(/([§&][0-9a-fk-or])/gi);
    let output = "";
    let color = "f";
    let styles = new Set();

    parts.forEach(part => {
        if (part.match(/^[§&][0-9a-fk-or]$/i)) {
            const code = part[1].toLowerCase();
            if (/[0-9a-f]/.test(code)) {
                color = code;
                styles.clear();
            } else if (code === 'r') {
                color = 'f';
                styles.clear();
            } else {
                styles.add(code); 
            }
            return;
        } 
        
        if (part === "") return;

        let cls = [`c-${color}`];
        styles.forEach(s => cls.push(`s-${s}`));
        let baseClass = cls.join(' ');

        if (styles.has('k')) {
            // MAGIC TEXT (Phantom Overlay)
            for (const char of part) {
                if (char === ' ') {
                    output += `<span class="${baseClass}"> </span>`;
                } else {
                    const cp = char.codePointAt(0);
                    const widthBucket = CHAR_WIDTHS[cp] || CHAR_WIDTHS.default;
                    output += `<span style="display: inline-grid; vertical-align: bottom;">
                        <span class="${baseClass}" style="grid-area: 1/1; visibility: hidden;">${char}</span>
                        <span class="obfuscated ${baseClass}" 
                              style="grid-area: 1/1; text-align: center;" 
                              data-width="${widthBucket}">
                        ${char}</span>
                    </span>`;
                }
            }
        } else {
            // NORMAL TEXT
            let content = "";
            for (const char of part) {
                const cp = char.codePointAt(0);
                if (cp > 255 && USE_MASKS) {
                    if (content) { output += `<span class="${baseClass}">${content}</span>`; content = ""; }
                    const page = (cp >> 8).toString(16).padStart(2, '0');
                    const row = (cp >> 4) & 0xF;
                    const col = cp & 0xF;
                    output += `<span class="mc-symbol ${baseClass}" style="
                        -webkit-mask-image: url('fonts/unicode_page_${page}.png');
                        mask-image: url('fonts/unicode_page_${page}.png');
                        -webkit-mask-position: -${col * 16}px -${row * 16}px;
                        mask-position: -${col * 16}px -${row * 16}px;
                    "></span>`;
                } else {
                    content += char;
                }
            }
            if (content) output += `<span class="${baseClass}">${content}</span>`;
        }
    });
    return output;
}

/* --- ANIMATION ENGINE --- */
const POOLS = {};
const CHARS = "abcdefghjknopqrstuvxyzABCDEFGHJKLMNOPQRSTUVWXYZ1234567890?#$%^&*()[]{}-=_+<>\"';:,.|~`@!\\/";
const EXTENDED = "ÀÁÂÃÄÅÇÈÉÊËÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåçèéêëðñòóôõöøùúûüýþÿ";

function initPools() {
    const allChars = CHARS + EXTENDED;
    for (const char of allChars) {
        const code = char.codePointAt(0);
        const width = CHAR_WIDTHS[code] || 6;
        if (!POOLS[width]) POOLS[width] = "";
        POOLS[width] += char;
    }
}
initPools();

function startObfuscation() {
    setInterval(() => {
        const magicElements = document.querySelectorAll('.obfuscated');
        magicElements.forEach(el => {
            const width = parseInt(el.getAttribute('data-width') || "6");
            const pool = POOLS[width] || POOLS[6];
            const randomChar = pool.charAt(Math.floor(Math.random() * pool.length));
            el.innerText = randomChar;
        });
    }, 20);
}