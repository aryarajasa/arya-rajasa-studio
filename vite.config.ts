import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, type Plugin, type ResolvedConfig} from 'vite';
import adminApi from './src/admin/plugin';

// GitHub Pages serves static files only — a direct request for /project/<slug>
// finds no such file and 404s, so shared links and refreshes break even though
// in-app navigation works. Pages falls back to 404.html for any miss, so an
// identical copy of index.html there boots the SPA and lets the router take
// over from the requested URL.
function spaFallback(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    configResolved(resolved) {
      config = resolved;
    },
    closeBundle() {
      const outDir = path.resolve(config.root, config.build.outDir);
      const index = path.join(outDir, 'index.html');
      if (fs.existsSync(index)) fs.copyFileSync(index, path.join(outDir, '404.html'));
    },
  };
}

export default defineConfig(() => {
  return {
    base: '/arya-rajasa-studio/',
    // adminApi is `apply: 'serve'` — it adds no production output.
    plugins: [react(), tailwindcss(), adminApi(), spaFallback()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
