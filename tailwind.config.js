/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false,
  },
  content: [
    './src/**/*.html',
    './src/**/*.js',
  ],
  theme: {
    screens: {
      dt: "1200px",
    },
    extend: {},
  },
  plugins: [],
}
