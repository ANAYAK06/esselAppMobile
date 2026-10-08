/** @type {import('tailwindcss').Config} */
const { brand } = require("./src/theme/colors");

module.exports = {

    content: ["./app/**/*", "./components/**/*.{js,jsx,ts,tsx}", "./src/**/*"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            // Same palette as the Corex web app (RAPP-SLAPP frontend)
            colors: {
                brand: {
                    navy: brand.navy,
                    "navy-dark": brand.navyDark,
                    orange: brand.orange,
                },
            },
        },
    },
    plugins: [],
}
