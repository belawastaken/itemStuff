// Global State
const appState = {
    name: "",
    lore: [],
    id: "",
    rawObject: null
};

/**
 * Parses item data from a JSON object.
 * Supports proprietary mod format (name, Lore, id) and standard Minecraft NBT (tag.display).
 * @param {Object} input 
 */
function parseItemData(input) {
    if (!input || typeof input !== 'object') return;

    // Preserve the full object structure
    appState.rawObject = JSON.parse(JSON.stringify(input));

    let name = "";
    let lore = [];
    let id = "";

    // Check for Standard Minecraft NBT format
    if (input.tag && input.tag.display) {
        if (input.tag.display.Name) name = input.tag.display.Name;
        if (Array.isArray(input.tag.display.Lore)) lore = input.tag.display.Lore;
        if (input.id) id = input.id;
    } 
    // Check for Proprietary Mod format
    else {
        if (input.name) name = input.name;
        if (Array.isArray(input.Lore)) lore = input.Lore;
        if (input.id) id = input.id;
    }

    // Update State
    appState.name = name;
    appState.lore = lore;
    appState.id = id;

    renderApp();
}

/**
 * Replaces special characters with sprite spans using unicode_page_XX.png.
 * @param {string} text 
 * @returns {string} HTML string
 */
function replaceSymbols(text) {
    // Match any character outside the standard ASCII range (0-127)
    return text.replace(/[^\u0000-\u007F]/gu, (char) => {
        const cp = char.codePointAt(0);

        // Exclude the star character (✪) to use the font glyph instead
        if (cp === 0x272A) return char;

        const page = cp >> 8;
        const row = (cp >> 4) & 0xF;
        const col = cp & 0xF;
        
        const pageHex = page.toString(16).toLowerCase().padStart(2, '0');
        const xPos = -(col * 16);
        const yPos = -(row * 16);
        
        const style = `
            -webkit-mask-image: url('unicode_page_${pageHex}.png');
            mask-image: url('unicode_page_${pageHex}.png');
            -webkit-mask-position: ${xPos}px ${yPos}px;
            mask-position: ${xPos}px ${yPos}px;
        `.replace(/\s+/g, ' ').trim();

        return `<span class="mc-symbol" style="${style}"></span>`;
    });
}

/**
 * Converts a string with Minecraft § codes into HTML spans.
 * @param {string} text 
 * @returns {string} HTML string
 */
function parseMinecraftFormatting(text) {
    if (!text) return "";
    
    let output = "";
    let currentStyle = {
        color: null,
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        obfuscated: false
    };

    const parts = text.split(/(§[0-9a-fk-or])/g);

    parts.forEach(part => {
        if (part.startsWith('§')) {
            const code = part.charAt(1).toLowerCase();
            
            // Color codes (0-9, a-f) reset formatting
            if (/[0-9a-f]/.test(code)) {
                currentStyle.color = `mc-${code}`;
                currentStyle.bold = false;
                currentStyle.italic = false;
                currentStyle.underline = false;
                currentStyle.strikethrough = false;
                currentStyle.obfuscated = false;
            } 
            // Formatting codes
            else if (code === 'l') currentStyle.bold = true;
            else if (code === 'o') currentStyle.italic = true;
            else if (code === 'n') currentStyle.underline = true;
            else if (code === 'm') currentStyle.strikethrough = true;
            else if (code === 'k') currentStyle.obfuscated = true;
            else if (code === 'r') {
                currentStyle = { color: null, bold: false, italic: false, underline: false, strikethrough: false, obfuscated: false };
            }
        } else if (part.length > 0) {
            let classes = [];
            if (currentStyle.color) classes.push(currentStyle.color);
            if (currentStyle.bold) classes.push('mc-l');
            if (currentStyle.italic) classes.push('mc-o');
            if (currentStyle.underline) classes.push('mc-n');
            if (currentStyle.strikethrough) classes.push('mc-m');
            if (currentStyle.obfuscated) classes.push('mc-k');

            // Process unicode symbols (e.g. ✪, ⚚) using sprite sheets
            const processedPart = replaceSymbols(part);

            if (classes.length > 0) {
                output += `<span class="${classes.join(' ')}">${processedPart}</span>`;
            } else {
                output += processedPart;
            }
        }
    });

    return output;
}

function renderApp() {
    const tooltipEl = document.getElementById('item-tooltip');
    if (!tooltipEl) return;

    let html = "";
    if (appState.name) {
        html += `<div>${parseMinecraftFormatting(appState.name)}</div>`;
    }
    if (appState.lore && appState.lore.length > 0) {
        appState.lore.forEach(line => {
            if (line.replace(/§[0-9a-fk-or]/g, '').length === 0) {
                html += '<div style="height: 6px"></div>';
            } else {
                html += `<div style="margin-bottom: 2px">${parseMinecraftFormatting(line)}</div>`;
            }
        });
    }
    
    tooltipEl.innerHTML = html || '<p style="color: #aaa; text-align: center;">Preview Area</p>';
}

/**
 * Renders the Visual Editor inputs based on appState.
 */
function updatePreview() {
    const editor = document.getElementById('code-editor');
    if (!editor) return;

    try {
        const value = editor.value;
        if (!value.trim()) return;
        const json = JSON.parse(value);
        editor.classList.remove('error');
        parseItemData(json);
    } catch (error) {
        // Show error indicator
        editor.classList.add('error');
    }
}

function insertAtCursor(text) {
    const editor = document.getElementById('code-editor');
    if (!editor) return;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const value = editor.value;

    editor.value = value.substring(0, start) + text + value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + text.length;
    editor.focus();

    updatePreview();
}

function generateToolbar() {
    const toolbar = document.getElementById('toolbar');
    if (!toolbar) return;
    
    toolbar.innerHTML = '';

    const colors = [
        { code: '§0', color: '#000000' },
        { code: '§1', color: '#0000AA' },
        { code: '§2', color: '#00AA00' },
        { code: '§3', color: '#00AAAA' },
        { code: '§4', color: '#AA0000' },
        { code: '§5', color: '#AA00AA' },
        { code: '§6', color: '#FFAA00' },
        { code: '§7', color: '#AAAAAA' },
        { code: '§8', color: '#555555' },
        { code: '§9', color: '#5555FF' },
        { code: '§a', color: '#55FF55' },
        { code: '§b', color: '#55FFFF' },
        { code: '§c', color: '#FF5555' },
        { code: '§d', color: '#FF55FF' },
        { code: '§e', color: '#FFFF55' },
        { code: '§f', color: '#FFFFFF' }
    ];

    const symbols = ["✪", "❤", "❈", "❁", "☣", "☠", "⚔"];

    colors.forEach(c => {
        const btn = document.createElement('button');
        btn.textContent = c.code;
        btn.style.color = c.color;
        btn.style.backgroundColor = '#333';
        btn.style.border = '1px solid #222';
        btn.style.marginRight = '4px';
        btn.style.cursor = 'pointer';
        btn.style.padding = '5px 10px';
        btn.style.fontFamily = 'monospace';
        
        btn.onclick = () => insertAtCursor(c.code);
        toolbar.appendChild(btn);
    });

    const spacer = document.createElement('div');
    spacer.style.width = '1px';
    spacer.style.height = '20px';
    spacer.style.backgroundColor = '#555';
    spacer.style.margin = '0 10px';
    toolbar.appendChild(spacer);

    symbols.forEach(s => {
        const btn = document.createElement('button');
        btn.textContent = s;
        btn.style.color = '#fff';
        btn.style.backgroundColor = '#333';
        btn.style.border = '1px solid #222';
        btn.style.marginRight = '4px';
        btn.style.cursor = 'pointer';
        btn.style.padding = '5px 10px';
        
        btn.onclick = () => insertAtCursor(s);
        toolbar.appendChild(btn);
    });
}

function saveTooltipAsPng() {
    const element = document.getElementById('item-tooltip');
    if (!element) return;

    html2canvas(element, {
        backgroundColor: null,
        scale: 2 // Higher resolution
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'tooltip_export.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

// Event Listener for Raw JSON Input
document.addEventListener('DOMContentLoaded', () => {
    generateToolbar();

    const editor = document.getElementById('code-editor');
    if (editor) {
        editor.addEventListener('input', updatePreview);
    }

    const saveBtn = document.getElementById('floating-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveTooltipAsPng);
    }
});