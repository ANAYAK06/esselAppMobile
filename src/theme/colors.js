// Brand palette shared with the Corex web app (RAPP-SLAPP frontend).
// Tailwind classes use these via tailwind.config.js (bg-brand-navy, text-brand-orange, ...);
// import them directly where a raw colour value is needed (icon colours, gradients, StatusBar).
const brand = {
    navy: '#0d1b5e',
    navyDark: '#0a1240',
    orange: '#f97316',      // Tailwind orange-500
    orangeDark: '#ea580c',  // Tailwind orange-600
    orangeLight: '#fb923c', // Tailwind orange-400
    orangeSoft: '#fdba74',  // Tailwind orange-300
};

module.exports = { brand };
