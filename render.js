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