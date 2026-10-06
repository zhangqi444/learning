import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.dirname(new URL(import.meta.url).pathname)
const ARTIFACT = process.env.LEARNING_TARGET === 'artifact'
const oauth = JSON.parse(fs.readFileSync(path.join(ROOT, 'oauth.json'), 'utf8'))

/** Wires the question bank and the Drive/OAuth config into each build target.
 *  GitHub Pages: bundle.json fetched at runtime, Drive sync on, service worker on.
 *  Artifact:     bundle.json inlined, no Drive (the artifact origin is not an OAuth origin). */
function learningTarget() {
  return {
    name: 'learning-target',
    transformIndexHtml(html) {
      const tags = []
      if (ARTIFACT) {
        const data = fs.readFileSync(path.join(ROOT, 'content/bundle.json'), 'utf8')
        tags.push({ tag: 'script', children: 'window.__LEARNING__=' + data + ';', injectTo: 'body-prepend' })
      } else {
        tags.push({
          tag: 'script',
          children: 'window.__ENABLE_DRIVE__=true;window.__OAUTH_CLIENT_ID__=' + JSON.stringify(oauth.client_id) + ';',
          injectTo: 'head',
        })
        tags.push({ tag: 'script', attrs: { src: 'https://accounts.google.com/gsi/client', async: true }, injectTo: 'head' })
        tags.push({ tag: 'link', attrs: { rel: 'manifest', href: 'manifest.webmanifest' }, injectTo: 'head' })
        tags.push({
          tag: 'script',
          children: 'if("serviceWorker" in navigator)addEventListener("load",function(){navigator.serviceWorker.register("sw.js")});',
          injectTo: 'body',
        })
      }
      return tags
    },
    closeBundle() {
      if (ARTIFACT) return
      const out = path.join(ROOT, 'dist/content')
      fs.mkdirSync(out, { recursive: true })
      fs.copyFileSync(path.join(ROOT, 'content/bundle.json'), path.join(out, 'bundle.json'))
      // The typed URLs /isee and /chinese are redirect stubs (docs/chinese.md § 2):
      // a dozen lines, no assets, one hop to the hash route. They cannot be copies
      // of the app — base './' would resolve the hashed assets against /chinese/,
      // where nothing is served. Both join the service worker's PRECACHE, or a
      // first offline visit to /chinese/ is answered with the root document under
      // the wrong path and its assets 404.
      for (const cat of ['isee', 'chinese']) {
        const dir = path.join(ROOT, 'dist', cat)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sheila's Learning</title><meta name="robots" content="noindex">
<script>location.replace('../#/${cat}')</script></head>
<body><p>Opening <a href="../#/${cat}">${cat}</a>…</p></body></html>
`)
      }
    },
  }
}

export default defineConfig({
  root: ROOT,
  base: './',
  publicDir: ARTIFACT ? false : 'public',
  resolve: { alias: { '@': path.join(ROOT, 'src') } },
  // The artifact has no Drive, so no paper's PDF to draw: a constant lets the build
  // drop pdf.js from it altogether rather than inline a megabyte nobody can use.
  define: { 'import.meta.env.LEARNING_ARTIFACT': JSON.stringify(ARTIFACT) },
  plugins: [react(), tailwindcss(), learningTarget(), ...(ARTIFACT ? [viteSingleFile({ removeViteModuleLoader: true })] : [])],
  build: {
    outDir: ARTIFACT ? 'dist-artifact' : 'dist',
    emptyOutDir: true,
    sourcemap: false,
    reportCompressedSize: true,
  },
})
