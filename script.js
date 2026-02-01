/* --- CONFIGURATION --- */
const USE_MASKS = true;
let AUTO_FIX_ARTIFACTS = true;
let AUTO_CLEAN_PASTE = false;
let PRETTY_MODE = false; 

// VIEW TOGGLES
let SHOW_GEAR_SCORE = true;
let SHOW_BRACKETS = true;

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

const RARITIES = ["VERY SPECIAL", "UNCOMMON", "LEGENDARY", "SPECIAL", "COMMON", "DIVINE", "DEVINE", "MYTHIC", "RARE", "EPIC"];
const ROMAN_MAP = { "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10 };

let isSimpleMode = false;
let cachedJSON = {};
let lastFocusedInput = null;

document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('code-editor');
    const simpleEditor = document.getElementById('simple-editor');
    const simpleName = document.getElementById('simple-name');
    const simpleLore = document.getElementById('simple-lore');
    const modeBtn = document.getElementById('mode-toggle-btn');
    const bgToggle = document.getElementById('bg-toggle-btn');
    const magicToggle = document.getElementById('magic-toggle-btn');
    const cleanToggle = document.getElementById('clean-toggle-btn');
    const prettyToggle = document.getElementById('pretty-toggle-btn');
    const btnGS = document.getElementById('btn-toggle-gs');
    const btnBrackets = document.getElementById('btn-toggle-brackets');
    const previewPanel = document.getElementById('preview-panel');
    
    const symbolBtns = document.querySelectorAll('.symbol-btn');

    if (localStorage.getItem('autoCleanPaste') === 'true') {
        AUTO_CLEAN_PASTE = true;
        if (cleanToggle) {
            cleanToggle.innerText = "🧹 Clean: ON";
            cleanToggle.classList.add('active');
        }
    }
    if (localStorage.getItem('prettyMode') === 'true') {
        PRETTY_MODE = true;
        if (prettyToggle) {
            prettyToggle.innerText = "✨ Pretty: ON";
            prettyToggle.classList.add('active');
        }
    }

    if (editor) editor.addEventListener('input', () => render(editor.value));

    if (simpleName) {
        simpleName.addEventListener('focus', () => { lastFocusedInput = simpleName; });
        simpleName.addEventListener('input', updateFromSimple);
    }
    if (simpleLore) {
        simpleLore.addEventListener('focus', () => { lastFocusedInput = simpleLore; });
        simpleLore.addEventListener('input', updateFromSimple);
    }

    symbolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const char = btn.getAttribute('data-insert');
            const target = lastFocusedInput || simpleLore; 
            
            if (target) {
                const start = target.selectionStart;
                const end = target.selectionEnd;
                const text = target.value;
                
                target.value = text.substring(0, start) + char + text.substring(end);
                target.selectionStart = target.selectionEnd = start + char.length;
                target.focus();
                
                updateFromSimple();
            }
        });
    });

    if (editor) {
        editor.addEventListener('paste', (e) => {
            if (isSimpleMode) return; 
            const text = (e.clipboardData || window.clipboardData).getData('text');
            try {
                let json = JSON.parse(text);

                if (AUTO_CLEAN_PASTE) {
                    const clean = {};
                    let foundData = false;
                    let srcName = json.name || json.tag?.display?.Name;
                    let srcLore = json.Lore || json.tag?.display?.Lore;
                    if (srcName) { clean.name = srcName; foundData = true; }
                    if (srcLore) { clean.Lore = srcLore; foundData = true; }
                    if (foundData) json = clean;
                }

                if (json.Lore && Array.isArray(json.Lore)) {
                    e.preventDefault(); 
                    json.Lore = json.Lore.map(line => {
                        const plain = line.replace(/§[0-9a-fk-orA-FK-OR]/gi, "").trim();
                        const hasArtifacts = /^[aAv\-].*[aAv\-]$/.test(plain);
                        if (hasArtifacts) {
                            for (const rarity of RARITIES) {
                                if (line.includes(rarity)) {
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

    if (prettyToggle) {
        prettyToggle.addEventListener('click', () => {
            PRETTY_MODE = !PRETTY_MODE;
            localStorage.setItem('prettyMode', PRETTY_MODE);
            prettyToggle.innerText = PRETTY_MODE ? "✨ Pretty: ON" : "✨ Pretty: OFF";
            prettyToggle.classList.toggle('active');
            render(editor.value);
        });
    }

    if (cleanToggle) {
        cleanToggle.addEventListener('click', () => {
            AUTO_CLEAN_PASTE = !AUTO_CLEAN_PASTE;
            localStorage.setItem('autoCleanPaste', AUTO_CLEAN_PASTE);
            cleanToggle.innerText = AUTO_CLEAN_PASTE ? "🧹 Clean: ON" : "🧹 Clean: OFF";
            cleanToggle.classList.toggle('active');
        });
    }

    if (btnGS) {
        btnGS.addEventListener('click', () => {
            SHOW_GEAR_SCORE = !SHOW_GEAR_SCORE;
            btnGS.innerText = SHOW_GEAR_SCORE ? "GS: ON" : "GS: OFF";
            btnGS.classList.toggle('active');
            render(editor.value);
        });
    }

    if (btnBrackets) {
        btnBrackets.addEventListener('click', () => {
            SHOW_BRACKETS = !SHOW_BRACKETS;
            btnBrackets.innerText = SHOW_BRACKETS ? "Brackets: ON" : "Brackets: OFF";
            btnBrackets.classList.toggle('active');
            render(editor.value);
        });
    }

    if (modeBtn) {
        modeBtn.addEventListener('click', () => {
            isSimpleMode = !isSimpleMode;
            if (isSimpleMode) {
                try {
                    const json = JSON.parse(editor.value);
                    cachedJSON = json; 
                    let name = json.name || "";
                    name = name.replace(/§/g, '&');
                    let lore = json.Lore || [];
                    lore = lore.map(l => l.replace(/§/g, '&')).join('\n');
                    simpleName.value = name;
                    simpleLore.value = lore;
                    editor.style.display = 'none';
                    simpleEditor.style.display = 'flex';
                    modeBtn.innerText = "✎ Code Mode";
                    modeBtn.classList.add('active');
                } catch (e) {
                    alert("Invalid JSON!");
                    isSimpleMode = false;
                }
            } else {
                editor.style.display = 'block';
                simpleEditor.style.display = 'none';
                modeBtn.innerText = "✎ Simple Mode";
                modeBtn.classList.remove('active');
            }
        });
    }

    function updateFromSimple() {
        const name = simpleName.value.replace(/&/g, '§');
        const loreLines = simpleLore.value.split('\n').map(l => l.replace(/&/g, '§'));
        cachedJSON.name = name;
        cachedJSON.Lore = loreLines;
        const newString = JSON.stringify(cachedJSON, null, 2);
        editor.value = newString;
        render(newString);
    };

    if (bgToggle) bgToggle.addEventListener('click', () => document.getElementById('preview-panel').classList.toggle('white-mode'));
    if (magicToggle) {
        magicToggle.addEventListener('click', () => {
            AUTO_FIX_ARTIFACTS = !AUTO_FIX_ARTIFACTS;
            magicToggle.innerText = AUTO_FIX_ARTIFACTS ? "★ Auto-Magic: ON" : "☆ Auto-Magic: OFF";
            magicToggle.classList.toggle('active');
            if (editor) render(editor.value);
        });
    }

    if (editor) render(editor.value);
    startObfuscation();
});

/* --- RENDERER --- */
function render(jsonString) {
    const container = document.getElementById('item-tooltip');
    if (!container) return;

    try {
        const data = JSON.parse(jsonString);
        let name = data.name || (data.tag?.display?.Name) || "";
        let lore = data.Lore || (data.tag?.display?.Lore) || [];
        
        if (!SHOW_GEAR_SCORE) {
            lore = lore.filter(line => !line.includes("Gear Score:"));
        }

        if (!SHOW_BRACKETS) {
            lore = lore.map(line => {
                return line.replace(/\s*§8\([^)]*\)/g, "").replace(/\s*&8\([^)]*\)/g, ""); 
            });
        }

        if (PRETTY_MODE && typeof SKYBLOCK_DB !== 'undefined') {
            lore = globalPrettifyLore(lore);
        }

        if (AUTO_FIX_ARTIFACTS && lore.length > 0) {
            lore = lore.map(line => {
                line = line.replace(/^((?:§[0-9a-fk-orA-FK-OR])+)((?:[aAv\-])+)(?=§)/, '$1§k$2');
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

function globalPrettifyLore(lore) {
    let newLore = [];
    let collectedEnchants = [];
    let enchantStartIndex = -1;
    let foundEnchants = false;

    for (let i = 0; i < lore.length; i++) {
        let line = lore[i];
        
        if (line.includes(":") || line.includes("Gear Score") || line.includes("Damage")) {
            if (!foundEnchants) newLore.push(line);
            else if (collectedEnchants.length > 0) {
                newLore = newLore.concat(formatEnchantBlock(collectedEnchants));
                collectedEnchants = [];
                newLore.push(line);
            } else {
                newLore.push(line);
            }
            continue;
        }

        if (containsEnchant(line)) {
            if (enchantStartIndex === -1) enchantStartIndex = i;
            foundEnchants = true;
            
            const parts = line.split(',').map(p => p.trim());
            parts.forEach(p => collectedEnchants.push(p));
        } else {
            if (collectedEnchants.length > 0) {
                newLore = newLore.concat(formatEnchantBlock(collectedEnchants));
                collectedEnchants = [];
            }
            newLore.push(line);
        }
    }

    if (collectedEnchants.length > 0) {
        newLore = newLore.concat(formatEnchantBlock(collectedEnchants));
    }

    return newLore;
}

function containsEnchant(line) {
    const plain = line.replace(/§[0-9a-fk-orA-FK-OR]/gi, "");
    if (/[IVX0-9]+$/.test(plain)) return true;
    return false;
}

function formatEnchantBlock(enchants) {
    let ultimates = [];
    let stackings = [];
    let normals = [];

    enchants.forEach(part => {
        const plain = part.replace(/§[0-9a-fk-orA-FK-OR]/gi, "").trim();
        const match = plain.match(/^(.*?)\s+([IVX0-9]+)$/);
        
        let bucket = "normal";

        if (match) {
            const name = match[1].trim();
            const levelStr = match[2];
            const level = ROMAN_MAP[levelStr] || parseInt(levelStr) || 0;

            const ultEntry = SKYBLOCK_DB.ultimate.find(u => u.name === name);
            if (ultEntry) {
                if (level >= ultEntry.min && level <= ultEntry.max) bucket = "ultimate";
            }

            if (SKYBLOCK_DB.stacking.includes(name)) {
                if (level >= 1 && level <= 10) bucket = "stacking";
            }

            const normEntry = SKYBLOCK_DB.normal.find(n => n.name === name);
            if (normEntry) {
                if (level >= normEntry.min && level <= normEntry.max) bucket = "normal";
            }
        }

        if (bucket === "ultimate") ultimates.push(part);
        else if (bucket === "stacking") stackings.push(part);
        else normals.push(part);
    });

    const sorted = [...new Set([...ultimates, ...stackings, ...normals])];
    
    const resultLines = [];
    let chunk = [];
    
    for (let i = 0; i < sorted.length; i++) {
        chunk.push(sorted[i]);
        if (chunk.length === 3) {
            resultLines.push(chunk.join(', '));
            chunk = [];
        }
    }
    if (chunk.length > 0) resultLines.push(chunk.join(', '));
    
    return resultLines;
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
            // GRID OVERLAY METHOD
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