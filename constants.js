/* --- GLOBAL CONFIGURATION --- */
let AUTO_FIX_ARTIFACTS = true;
let AUTO_CLEAN_PASTE = false;
let PRETTY_MODE = false; 
let ENCHANT_COLOR_MODE = "sba"; // 'sba' or 'vanilla'

// VIEW TOGGLES
let SHOW_GEAR_SCORE = true;
let SHOW_BRACKETS = true;

/* --- CONSTANTS & DATA --- */

const RARITIES = ["VERY SPECIAL", "UNCOMMON", "LEGENDARY", "SPECIAL", "COMMON", "DIVINE", "DEVINE", "MYTHIC", "RARE", "EPIC"];
const ROMAN_MAP = { "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10 };

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

// OBFUSCATION POOLS
const POOLS = {};
const CHARS = "abcdefghjknopqrstuvxyzABCDEFGHJKLMNOPQRSTUVWXYZ1234567890?#$%^&*()[]{}-=_+<>\"';:,.|~`@!\\/";
const EXTENDED = "ÀÁÂÃÄÅÇÈÉÊËÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåçèéêëðñòóôõöøùúûüýþÿ";