/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'button-danger': '#dc2626', // vermelho para botão de sair
      },
      minWidth: {
        '100': '400px',
      },
      zIndex: {
        '55': '55',
        '100': '100',
      }
    },
  },
  plugins: [],
}

