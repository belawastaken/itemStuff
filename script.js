/* --- CONFIGURATION --- */
const USE_MASKS = true;

document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('code-editor');
    const bgToggle = document.getElementById('bg-toggle-btn');
    const previewPanel = document.getElementById('preview-panel');

    if (editor) editor.addEventListener('input', () => render(editor.value));

    if (bgToggle && previewPanel) {
        bgToggle.addEventListener('click', () => {
            previewPanel.classList.toggle('white-mode');
        });
    }

    if (editor) render(editor.value);

    // Start the Magic Text Animator
    startObfuscation();
});

function render(jsonString) {
    const container = document.getElementById('item-tooltip');
    if (!container) return;

    try {
        const data = JSON.parse(jsonString);
        let name = data.name || (data.tag?.display?.Name) || "";
        let lore = data.Lore || (data.tag?.display?.Lore) || [];
        
        // --- IMPROVED RECOMB DETECTION ---
        const isRecomb = (data.recomb === true) || 
                         (data.recombobulated === true) ||
                         // Check nested NBT (common in API dumps)
                         (data.tag?.ExtraAttributes?.rarity_upgrades > 0) || 
                         // Check lower camelCase root (common in mod dumps)
                         (data.extraAttributes?.rarity_upgrades > 0) ||
                         // Check PascalCase root (Your JSON format)
                         (data.ExtraAttributes?.rarity_upgrades > 0);

        if (isRecomb && lore.length > 0) {
            lore = [...lore]; // Safety copy
            const lastLine = lore[lore.length - 1];
            
            // Recomb Logic: Wrap the last line in Magic (§k) characters
            // "M" is the placeholder that gets scrambled
            lore[lore.length - 1] = `§kM §r${lastLine} §kM`;
        }
        // -------------------------------

        // Build HTML
        let html = `<div class="tooltip-box">`;
        
        // 8-Line Border System
        html += `<div class="line p-top"></div><div class="line p-bottom"></div><div class="line p-left"></div><div class="line p-right"></div>`;
        html += `<div class="line b-top"></div><div class="line b-bottom"></div><div class="line b-left"></div><div class="line b-right"></div>`;

        // Content
        html += `<div class="tooltip-content">`;
        html += `<span class="tooltip-title">${parseText(name)}</span>`;
        
        if (lore.length > 0) {
            html += `<span class="tooltip-lore">`;
            lore.forEach((line, i) => {
                if(i > 0) html += `<br>`;
                html += parseText(line);
            });
            html += `</span>`;
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
        } else if (part !== "") {
            let cls = [`c-${color}`];
            styles.forEach(s => cls.push(`s-${s}`));
            
            let content = "";
            for (const char of part) {
                const cp = char.codePointAt(0);
                if (cp > 255 && USE_MASKS) {
                    const page = (cp >> 8).toString(16).padStart(2, '0');
                    const row = (cp >> 4) & 0xF;
                    const col = cp & 0xF;
                    content += `<span class="mc-symbol ${cls.join(' ')}" style="
                        -webkit-mask-image: url('fonts/unicode_page_${page}.png');
                        mask-image: url('fonts/unicode_page_${page}.png');
                        -webkit-mask-position: -${col * 16}px -${row * 16}px;
                        mask-position: -${col * 16}px -${row * 16}px;
                    "></span>`;
                } else {
                    content += char;
                }
            }
            
            // Add 'obfuscated' class for animation if §k is present
            if (styles.has('k')) {
                output += `<span class="obfuscated ${cls.join(' ')}">${content}</span>`;
            } else {
                output += `<span class="${cls.join(' ')}">${content}</span>`;
            }
        }
    });
    return output;
}

/* --- ANIMATION ENGINE --- */
function startObfuscation() {
    // Magic characters pool
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    
    setInterval(() => {
        const magicElements = document.querySelectorAll('.s-k, .obfuscated');
        
        magicElements.forEach(el => {
            let newText = "";
            for(let i=0; i < el.innerText.length; i++) {
                newText += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            el.innerText = newText;
        });
    }, 50);
}