/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        paper: "#f6f7f4",
        river: "#2f7de1",
        leaf: "#65a30d",
        amberline: "#d97706",
        coral: "#dc5f45",
        mintline: "#0f9f8f",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 32, 51, 0.08)",
      },
    },
  },
  plugins: [],
};
