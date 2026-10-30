import { generateSW } from 'workbox-build';

generateSW({
  globDirectory: 'dist/',
  globPatterns: ['**/*.{html,js,css,png,jpg,svg,woff2}'],
  swDest: 'dist/sw.js',
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/.*\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
      },
    },
  ],
}).then(({ count, size }) => {
  console.log(`Service worker gerado com ${count} arquivos, totalizando ${size} bytes.`);
});