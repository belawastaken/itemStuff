/* --- SKYBLOCK DATABASE --- */

const SKYBLOCK_DB = {
    // 1. STACKING ENCHANTS
    // Logic automatically accepts Levels 1-10 (I-X) for these.
    // Just list the names.
    stacking: [
        "Toxophilite"
    ],

    // 2. ULTIMATE ENCHANTS
    // Define Name, Min Level, and Max Level.
    // Logic moves these to the very front.
    ultimate: [
        { name: "Soul Eater", min: 1, max: 5 }
    ],

    // 3. NORMAL ENCHANTS
    // Define Name, Min Level, and Max Level.
    // Logic sorts these after Stacking enchants.
    normal: [
        // Example format: { name: "Power", min: 1, max: 7 }
    ]
};