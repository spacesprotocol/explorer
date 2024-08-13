/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui';
import typeography from '@tailwindcss/typography';
import { themeVariants } from "tailwindcss-theme-variants";

const colors = ['red-500', 'blue-500', 'green-500', 'yellow-500', 'purple-500', 'pink-500', 'indigo-500', 'teal-500', 'cyan-500', 'lime-500', 'amber-500', 'orange-500', 'gray-500', 'white', 'black'];
const classes = ['border', 'text', 'badge', 'bg'];

const safelist = [];
for (let cls of classes) {
  for (let color of colors)
    safelist.push(`${cls}-${color}`);
}


export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  safelist,
  theme: {
    extend: {},
  },
  plugins: [
    daisyui,
    typeography,
    themeVariants({
      themes: {
        light: {
          selector: `[data-theme="wireframe"]`,
        },
        dark: {
          selector: `[data-theme="black]"`,
        },
      },
    }),
  ],
  daisyui: {
    themes: ["black", "wireframe"],
  },
  darkMode: ['class', '[data-theme="black"]']
}

