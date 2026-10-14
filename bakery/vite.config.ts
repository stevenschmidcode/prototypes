import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Source lives in src/. The build produces ONE self-contained file: ./index.html
// (JS, CSS, fonts inlined). Upload it anywhere, or open it via double-click.
export default defineConfig({
  root: 'src',
  base: './',
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: { outDir: '..', emptyOutDir: false },
})
