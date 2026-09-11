/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./host/src/**/*.{html,ts}",
    "./remote/src/**/*.{html,ts}",
    "./projects/core-ui/src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      animation: {
        'blob': 'blob 7s infinite',
        'gradient': 'gradient 3s ease infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        }
      }
    },
  },
  plugins: [],
};
