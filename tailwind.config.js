/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          deep: '#0f2318',
          mid: '#1a3a2a',
          light: '#2a5040',
          border: '#3a6050',
        },
        playerX: '#e84545',
        playerO: '#4a9eff',
        gold: '#f0c040',
        cream: '#f0ece0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '60%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-5px)' },
          '80%': { transform: 'translateX(5px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        confettiFall: {
          '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        pulse: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%,100%': { boxShadow: '0 0 8px 2px rgba(240,192,64,0.4)' },
          '50%': { boxShadow: '0 0 20px 6px rgba(240,192,64,0.8)' },
        },
      },
      animation: {
        'bounce-in': 'bounceIn 0.35s ease-out forwards',
        shake: 'shake 0.4s ease-in-out',
        'fade-in': 'fadeIn 0.25s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'confetti-fall': 'confettiFall linear forwards',
        pulse: 'pulse 1.4s ease-in-out infinite',
        glow: 'glow 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
