/* --- RENDERER LOGIC --- */

function initPools() {
    const allChars = CHARS + EXTENDED;
    for (const char of allChars) {
        const code = char.codePointAt(0);
        const width = CHAR_WIDTHS[code] || 6;
        if (!POOLS[width]) POOLS[width] = "";
        POOLS[width] += char;
    }
}

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

function render(jsonString) {
    const container = document.getElementById('item-tooltip');
    const editor = document.getElementById('code-editor');
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

        // 1. Grouping/Prettifying (Respects Color Mode internally)
        if (PRETTY_MODE && typeof SKYBLOCK_DB !== 'undefined') {
            lore = globalPrettifyLore(lore);
        }
        // 2. If NOT Prettifying, we still might need to apply colors individually
        else if (ENCHANT_COLOR_MODE === 'sba' && typeof SKYBLOCK_DB !== 'undefined') {
            lore = colorizeRawLore(lore);
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
        if(editor) editor.style.borderLeft = "none"; 

    } catch (e) {
        if(editor) editor.style.borderLeft = "2px solid #ff5555";
    }
}

/**
 * Iterates over standard lore lines and recolors any enchantments found
 * matching the SBA criteria, without changing line breaks or order.
 */
function colorizeRawLore(lore) {
    return lore.map(line => {
        // Regex to find enchant patterns like "§9Sharpness VII" or just "Sharpness VII"
        // Captures: 1=ColorCodePrefix(optional), 2=Name, 3=Level(Roman or Number)
        // We look for patterns that END with a roman numeral or digit
        // and match a known enchant name in DB.
        
        // This is a naive replacement strategy that works for single-enchant lines
        // or comma-separated lines if we are careful.
        
        // Strategy: Split by comma, process parts, join back.
        const parts = line.split(',');
        const processedParts = parts.map(part => {
            const trimmed = part.trim();
            // Remove existing color codes for analysis
            const plain = trimmed.replace(/§[0-9a-fk-orzA-FK-ORZ]/gi, "");
            const match = plain.match(/^(.*?)\s+([IVX0-9]+)$/);
            
            if (match) {
                const name = match[1].trim();
                const levelStr = match[2];
                const level = ROMAN_MAP[levelStr] || parseInt(levelStr) || 0;
                
                // Determine SBA Color
                const sbaColor = getSBAColor(name, level);
                if (sbaColor) {
                    return `§${sbaColor}${name} ${levelStr}`;
                }
            }
            // If no match or no color change needed, return original part (trimmed)
            // But we lost original spacing? 
            // Better to only replace if we are sure.
            
            // If we didn't find an enchant, returning 'part' keeps original formatting including spaces
            return part; 
        });
        
        // If we modified parts, join them. If strict comma format, use ", "
        // But simply joining by comma might lose original whitespace if it wasn't ", "
        // However, for SkyBlock tooltips, ", " is standard.
        return processedParts.join(','); 
    });
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

function getSBAColor(name, level) {
    // 1. ULTIMATE
    if (SKYBLOCK_DB.ultimate.some(u => u.toLowerCase() === name.toLowerCase())) {
        return "d§l"; // Pink Bold
    }
    // 2. STACKING
    if (SKYBLOCK_DB.stacking.some(s => s.toLowerCase() === name.toLowerCase())) {
        return "c"; // Red
    }
    // 3. NORMAL
    const dbName = Object.keys(SKYBLOCK_DB.normal).find(key => key.toLowerCase() === name.toLowerCase());
    if (dbName) {
        const data = SKYBLOCK_DB.normal[dbName];
        if (level >= data.max) return "z"; // Chroma
        if (level >= data.good) return "6"; // Gold
        return "9"; // Blue
    }
    return null; // No special color
}

function formatEnchantBlock(enchants) {
    let ultimates = [];
    let stackings = [];
    let normals = [];

    enchants.forEach(part => {
        const plain = part.replace(/§[0-9a-fk-orA-FK-OR]/gi, "").trim();
        const match = plain.match(/^(.*?)\s+([IVX0-9]+)$/);
        
        if (match) {
            const name = match[1].trim();
            const levelStr = match[2];
            const level = ROMAN_MAP[levelStr] || parseInt(levelStr) || 0;

            let colorCode = "9"; // Default Blue

            if (ENCHANT_COLOR_MODE === 'sba') {
                const sba = getSBAColor(name, level);
                if (sba) colorCode = sba;
            }

            const formatted = `§${colorCode}${name} ${levelStr}`;

            // Bucketing for sorting (Only relevant if we are Prettifying/Reordering)
            // If just recoloring, we might not need this, but this function implies reformatting.
            if (colorCode.includes("d")) ultimates.push(formatted);
            else if (colorCode === "c") stackings.push(formatted);
            else normals.push(formatted);

        } else {
            normals.push(`§7${plain}`);
        }
    });

    const sorted = [...new Set([...ultimates, ...stackings, ...normals])];
    
    const resultLines = [];
    let chunk = [];
    
    for (let i = 0; i < sorted.length; i++) {
        chunk.push(sorted[i]);
        if (chunk.length === 3) {
            resultLines.push(chunk.join('§7, '));
            chunk = [];
        }
    }
    if (chunk.length > 0) resultLines.push(chunk.join('§7, '));
    
    return resultLines;
}

function parseText(text) {
    if (!text) return "";
    const parts = text.split(/([§&][0-9a-fk-orzA-FK-ORZ])/gi); 
    let output = "";
    let color = "f";
    let styles = new Set();
    
    // Counter for "Rolling" Chroma effect
    let chromaIndex = 0; 

    parts.forEach(part => {
        if (part.match(/^[§&][0-9a-fk-orzA-FK-ORZ]$/i)) {
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
        
        if (styles.has('z')) {
            chromaIndex++;
            const delay = -(chromaIndex * 0.3) + "s";
            output += `<span class="${cls.join(' ')}" style="animation-delay: ${delay};">${part}</span>`;
        } else if (styles.has('k')) {
            for (const char of part) {
                if (char === ' ') {
                    output += `<span class="${cls.join(' ')}"> </span>`;
                } else {
                    const cp = char.codePointAt(0);
                    const widthBucket = CHAR_WIDTHS[cp] || CHAR_WIDTHS.default;
                    output += `<span style="display: inline-grid; vertical-align: bottom;">
                        <span class="${cls.join(' ')}" style="grid-area: 1/1; visibility: hidden;">${char}</span>
                        <span class="obfuscated ${cls.join(' ')}" 
                              style="grid-area: 1/1; text-align: center;" 
                              data-width="${widthBucket}">
                        ${char}</span>
                    </span>`;
                }
            }
        } else {
            output += `<span class="${cls.join(' ')}">${part}</span>`;
        }
    });
    return output;
}