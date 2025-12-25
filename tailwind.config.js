/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}", // Added components dir in root
        "./services/**/*.{js,ts,jsx,tsx}",   // Added services dir in root if applicable
        "./*.{js,ts,jsx,tsx}",               // Root files like App.tsx
    ],
    theme: {
        extend: {
            colors: {
                background: '#020617', // Deeper Slate
                surface: '#0f172a',
                primary: '#38bdf8',
                secondary: '#818cf8',
                accent: '#f472b6',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['Fira Code', 'monospace'],
            },
            animation: {
                'spin-slow': 'spin 8s linear infinite',
                'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
            },
            keyframes: {
                'pulse-glow': {
                    '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
                    '50%': { opacity: '0.6', transform: 'scale(1.1)' },
                }
            }
        },
    },
    plugins: [],
}
