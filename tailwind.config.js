/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chat: {
          green: '#10B981',
          emerald: '#059669',
          teal: '#047857',
          blue: '#3B82F6',
          darkbg: '#0B141A',
          darksidebar: '#111B21',
          darkchat: '#0B141A',
          darkbubbleOut: '#005C4B',
          darkbubbleIn: '#202C33',
          darkborder: '#222D34',
          darkhover: '#202C33',
          lightbg: '#EFEAE2',
          lightsidebar: '#FFFFFF',
          lightchat: '#EFEAE2',
          lightbubbleOut: '#D9FDD3',
          lightbubbleIn: '#FFFFFF',
          lightborder: '#E2E8F0',
          lighthover: '#F5F6F6',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'pulse-subtle': 'pulseSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
