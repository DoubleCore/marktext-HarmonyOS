import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: '../../dist/harmony-editor',
    emptyOutDir: true,
    assetsInlineLimit: 20 * 1024 * 1024,
    rollupOptions: {
      output: {
        entryFileNames: 'editor.bundle.js',
        chunkFileNames: 'editor.bundle.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.names.some(name => name.endsWith('.css')))
            return 'editor.css'
          return 'assets/[name][extname]'
        },
        inlineDynamicImports: true,
      },
    },
  },
})
