import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import typography from '@tailwindcss/typography';

export default {
  plugins: [
    tailwindcss({
      content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
      ],
      theme: {
        extend: {},
      },
      plugins: [
        typography,
      ],
    }),
    autoprefixer,
  ],
};
