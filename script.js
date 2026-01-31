/* --- CONFIGURATION --- */
// TRUE: Use your local "unicode_page_XX.png" images for symbols (Game Authentic)
// FALSE: Use the downloaded font for symbols (Wiki Authentic)
const USE_SPRITE_MASKS = true; 

/* --- MAIN LOGIC --- */

document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('code-editor');

    if (editor) {
        editor.addEventListener('input', updatePreview);
        // Force an initial render
        updatePreview();
    }
});

function updatePreview() {
    const editor = document.getElementById('code-editor');
    const previewContainer = document.getElementById('item-tooltip'); 
    
    if (!editor || !previewContainer) return;

    let json = null;

    try {
        // 1. Try to parse the JSON
        json = JSON.parse(editor.value);
        
        // If successful, remove error styling
        editor.style.borderColor = ""; 
        editor.style.backgroundColor = "#1e1e1e";

    } catch (e) {
        // 2. If JSON is invalid, show visual error
        console.error("JSON Error:", e);
        editor.style.borderColor = "#ff5555";
        editor.style.backgroundColor = "#2a1a1a";
        
        // Optional: Don't update preview if invalid, OR show an error item
        // return; 
    }

    // 3. Extract Data (Use fallback if json is null)
    let name = "&cError: Invalid JSON";
    let lore = ["&7Check your spelling,", "&7quotes, and commas!"];
    
    if (json) {
        if (json.tag && json.tag.display) {
            // NBT Format
            name = json.tag.display.Name || "";
            lore = json.tag.display.Lore || [];
        } else {
            // Simple Format
            name = json.name || "";
            lore = json.Lore || json.lore || [];
        }
    }

    // 4. Render
    renderWikiTooltip(name, lore);
}

function renderWikiTooltip(name, lore) {
    const container = document.getElementById('item-tooltip');
    
    let html = `<div id="minetip-tooltip">`;

    // Title
    html += `<span class="minetip-title">${parseWikiText(name)}</span>`;

    // Lore
    if (lore && lore.length > 0) {
        html += `<span class="minetip-description">`;
        lore.forEach((line, index) => {
            if (index > 0) html += `<br>`;
            html += parseWikiText(line);
        });
        html += `</span>`;
    }

    html += `</div>`;
    
    container.innerHTML = html;
}

function parseWikiText(text) {
    if (!text) return "";

    let output = "";
    const parts = text.split(/([§&][0-9a-fk-or])/gi);

    let currentColor = "f"; 
    let formats = new Set(); 

    parts.forEach(part => {
        if (part.match(/^[§&][0-9a-fk-or]$/i)) {
            const code = part.charAt(1).toLowerCase();
            if (/[0-9a-f]/.test(code)) {
                currentColor = code;
                formats.clear();
            } else if (code === 'l') formats.add('l');
            else if (code === 'o') formats.add('o');
            else if (code === 'n') formats.add('n');
            else if (code === 'm') formats.add('m');
            else if (code === 'k') formats.add('k');
            else if (code === 'r') {
                currentColor = 'f';
                formats.clear();
            }
        } else if (part !== "") {
            let classes = [`format-${currentColor}`];
            formats.forEach(f => classes.push(`format-${f}`));

            let processedText = "";
            for (const char of part) {
                const cp = char.codePointAt(0);
                if (cp > 255 && USE_SPRITE_MASKS) {
                    const page = cp >> 8;
                    const row = (cp >> 4) & 0xF;
                    const col = cp & 0xF;
                    const pageHex = page.toString(16).toLowerCase().padStart(2, '0');
                    const xPos = -(col * 16);
                    const yPos = -(row * 16);

                    // Ensure this path matches your folder: "fonts/"
                    processedText += `<span class="mc-symbol ${classes.join(' ')}" style="
                        -webkit-mask-image: url('fonts/unicode_page_${pageHex}.png');
                        mask-image: url('fonts/unicode_page_${pageHex}.png');
                        -webkit-mask-position: ${xPos}px ${yPos}px;
                        mask-position: ${xPos}px ${yPos}px;
                    "></span>`;
                } else {
                    processedText += char;
                }
            }
            output += `<span class="${classes.join(' ')}">${processedText}</span>`;
        }
    });

    return output;
}