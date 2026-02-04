/* --- MAIN APPLICATION LOGIC --- */

document.addEventListener('DOMContentLoaded', () => {
    // Initializer dependencies
    if (typeof initPools === 'function') initPools();
    if (typeof startObfuscation === 'function') startObfuscation();

    const editor = document.getElementById('code-editor');
    const magicToggle = document.getElementById('magic-toggle-btn');
    const cleanToggle = document.getElementById('clean-toggle-btn');
    const btnGS = document.getElementById('btn-toggle-gs');
    const btnBrackets = document.getElementById('btn-toggle-brackets');
    const btnSave = document.getElementById('btn-save-png');
    const controlRow = document.querySelector('.control-row');
    
    // State for Pretty Print
    let isPretty = false;

    // Helper: Decides whether to render raw JSON or "Prettified" JSON
    const updatePreview = () => {
        if (!editor) return;
        const rawValue = editor.value;

        if (isPretty) {
            try {
                const json = JSON.parse(rawValue);
                let lore = json.Lore || json.tag?.display?.Lore;
                
                // If valid lore exists, apply prettify logic on a COPY for rendering
                if (lore && Array.isArray(lore)) {
                    // Deep copy logic for the render object to avoid mutating the editor state
                    const renderObj = JSON.parse(JSON.stringify(json));
                    
                    // Apply sorting to the copy
                    let targetLore = renderObj.Lore || renderObj.tag?.display?.Lore;
                    if (targetLore) {
                        const newLore = prettifyEnchants(targetLore);
                        if (renderObj.Lore) renderObj.Lore = newLore;
                        else if (renderObj.tag?.display?.Lore) renderObj.tag.display.Lore = newLore;
                    }
                    
                    render(JSON.stringify(renderObj, null, 2));
                    return; 
                }
            } catch (e) {
                // If JSON is invalid, just render raw so the error border still shows up
                // console.log("Pretty preview failed (invalid JSON), falling back to raw");
            }
        }
        
        // Default: Render raw value exactly as typed
        render(rawValue);
    };

    // Load LocalStorage Defaults
    if (localStorage.getItem('autoCleanPaste') === 'true') {
        AUTO_CLEAN_PASTE = true;
        if (cleanToggle) {
            cleanToggle.innerText = "🧹 Clean: ON";
            cleanToggle.classList.add('active');
        }
    }
    
    // --- EVENT LISTENERS ---

    // Updated: Use updatePreview instead of direct render
    if (editor) editor.addEventListener('input', updatePreview);

    if (editor) {
        editor.addEventListener('paste', (e) => {
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
                    // execCommand triggers 'input', which calls updatePreview()
                }
            } catch (err) {}
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
            updatePreview(); 
        });
    }

    if (btnBrackets) {
        btnBrackets.addEventListener('click', () => {
            SHOW_BRACKETS = !SHOW_BRACKETS;
            btnBrackets.innerText = SHOW_BRACKETS ? "Brackets: ON" : "Brackets: OFF";
            btnBrackets.classList.toggle('active');
            updatePreview();
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

    // --- PRETTY BUTTON (Visual Only) ---
    if (controlRow) {
        const btnPretty = document.createElement('button');
        btnPretty.className = 'control-btn';
        btnPretty.innerText = '✨ Pretty: OFF';
        btnPretty.title = "Sorts enchants visually (Ultimate > Stacking > Normal) without changing code";
        controlRow.appendChild(btnPretty);

        btnPretty.addEventListener('click', () => {
            isPretty = !isPretty; // Toggle state
            
            if (isPretty) {
                btnPretty.innerText = '✨ Pretty: ON';
                btnPretty.classList.add('active');
            } else {
                btnPretty.innerText = '✨ Pretty: OFF';
                btnPretty.classList.remove('active');
            }
            
            // Re-render immediately
            updatePreview();
        });
    }

    if (magicToggle) {
        magicToggle.addEventListener('click', () => {
            AUTO_FIX_ARTIFACTS = !AUTO_FIX_ARTIFACTS;
            magicToggle.innerText = AUTO_FIX_ARTIFACTS ? "★ Auto-Magic: ON" : "☆ Auto-Magic: OFF";
            magicToggle.classList.toggle('active');
            if (editor) updatePreview();
        });
    }

    if (editor) updatePreview();
});

/* --- PRETTY ENCHANTS LOGIC --- */
function prettifyEnchants(lore) {
    const enchantLinesIndices = [];
    const extractedEnchants = [];

    // 1. Identify and Extract
    lore.forEach((line, index) => {
        const clean = line.replace(/§[0-9a-fk-or]/gi, "");
        if (!clean.trim()) return;

        const parts = clean.split(',');
        // Heuristic: Line is enchants if it contains at least one known enchant and isn't a stat (contains :)
        const hasEnchant = parts.some(p => getEnchantType(getEnchantName(p.trim())) !== 'unknown');
        const isStat = clean.includes(':'); 
        
        if (hasEnchant && !isStat) {
            enchantLinesIndices.push(index);
            const originalParts = line.split(',');
            originalParts.forEach(p => extractedEnchants.push(p.trim()));
        }
    });

    if (extractedEnchants.length === 0) return lore;

    // 2. Sort
    extractedEnchants.sort((a, b) => {
        const nameA = getEnchantName(a.replace(/§[0-9a-fk-or]/gi, "").trim());
        const nameB = getEnchantName(b.replace(/§[0-9a-fk-or]/gi, "").trim());
        
        const typeA = getEnchantType(nameA);
        const typeB = getEnchantType(nameB);
        
        const priority = { 'ultimate': 0, 'stacking': 1, 'normal': 2, 'unknown': 3 };
        
        if (priority[typeA] !== priority[typeB]) return priority[typeA] - priority[typeB];
        return nameA.localeCompare(nameB);
    });

    // 3. Re-Chunk (3 per line)
    const newEnchantLines = [];
    let chunk = [];
    extractedEnchants.forEach(ench => {
        chunk.push(ench);
        if (chunk.length >= 3) { newEnchantLines.push(chunk.join(', ')); chunk = []; }
    });
    if (chunk.length > 0) newEnchantLines.push(chunk.join(', '));

    // 4. Re-Insert
    const resultLore = [];
    let inserted = false;
    lore.forEach((line, index) => {
        if (enchantLinesIndices.includes(index)) {
            if (!inserted) { resultLore.push(...newEnchantLines); inserted = true; }
        } else { resultLore.push(line); }
    });
    return resultLore;
}

function getEnchantName(str) { return str.replace(/\s+(\d+|I|V|X|L|C|D|M)+$/i, ""); }

function getEnchantType(name) {
    if (typeof SKYBLOCK_DB === 'undefined') return 'normal';
    if (SKYBLOCK_DB.ultimate.includes(name)) return 'ultimate';
    if (SKYBLOCK_DB.stacking.includes(name)) return 'stacking';
    if (SKYBLOCK_DB.normal[name]) return 'normal';
    return 'unknown';
}