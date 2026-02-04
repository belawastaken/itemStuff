/* --- MAIN APPLICATION LOGIC --- */

let isSimpleMode = false;
let cachedJSON = {};
let lastFocusedInput = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initializer dependencies
    if (typeof initPools === 'function') initPools();
    if (typeof startObfuscation === 'function') startObfuscation();

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
    const btnSave = document.getElementById('btn-save-png');
    
    // NEW: Color Mode Selector
    const colorSelect = document.getElementById('color-mode-select');
    
    const symbolBtns = document.querySelectorAll('.symbol-btn');

    // Load LocalStorage Defaults
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
    
    // Load Saved Color Mode
    const savedColorMode = localStorage.getItem('enchantColorMode');
    if (savedColorMode) {
        ENCHANT_COLOR_MODE = savedColorMode;
        if(colorSelect) colorSelect.value = ENCHANT_COLOR_MODE;
    }

    // --- EVENT LISTENERS ---

    if (colorSelect) {
        colorSelect.addEventListener('change', (e) => {
            ENCHANT_COLOR_MODE = e.target.value;
            localStorage.setItem('enchantColorMode', ENCHANT_COLOR_MODE);
            if (editor) render(editor.value);
        });
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
                    
                    if (srcLore && Array.isArray(srcLore)) { 
                        // --- CLEANING LOGIC ---
                        clean.Lore = srcLore.filter(line => {
                            const plain = line.replace(/§[0-9a-fk-orzA-FK-ORZ]/gi, "").trim();
                            if (plain.startsWith("Seller:")) return false;
                            if (plain.startsWith("Buy it now:")) return false;
                            if (plain.startsWith("Starting bid:")) return false;
                            if (plain.startsWith("Ends in:")) return false;
                            if (plain === "Click to inspect!") return false;
                            if (plain.match(/^-+$/)) return false; 
                            return true;
                        });

                        while(clean.Lore.length > 0 && clean.Lore[clean.Lore.length - 1].replace(/§[0-9a-fk-orzA-FK-ORZ]/gi, "").trim() === "") {
                             clean.Lore.pop();
                        }
                        
                        foundData = true; 
                    }
                    
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

    if (btnSave) {
        btnSave.addEventListener('click', () => {
            const element = document.getElementById('item-tooltip');
            if (!element) return;
            
            html2canvas(element, { backgroundColor: null, scale: 2 }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'tooltip.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
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
});