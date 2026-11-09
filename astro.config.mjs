import { defineConfig } from 'astro/config';

// Defina `site` com o endereço final (ex.: 'https://www.duoestamparia.com.br')
// para gerar URLs canônicas, sitemap e imagem de compartilhamento absolutas.
export default defineConfig({
  output: 'static',
  compressHTML: true,
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
  // Em alguns discos (rede, removíveis) o Windows não avisa as mudanças de arquivo; este modo confere por polling.
  vite: { server: { watch: { usePolling: true, interval: 400 } } },
});
