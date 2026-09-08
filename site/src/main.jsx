import React from "react"
import ReactDOM from "react-dom/client"

import "./index.css"
import "./skins.css"
import App from "./App"
import { setBundle } from "./lib/content"
import { DRIVE_ENABLED, Store } from "./lib/store"
import { backfill } from "./lib/engine"
import { syncBadges } from "./lib/rewards"
import { seedBooks } from "./lib/books"

/* The site's palette. "" is the default Arcade indigo defined in index.css; the
 * alternates live in skins.css — "red", "neon", "candy", "sunset", "forest",
 * "ocean". Changing this one string changes the whole look, both themes, and
 * nothing else has to move. Read the note above each block in skins.css first:
 * two of them sit close to a colour that already carries a meaning. */
const SKIN = ""

/* Theme: saved choice > host's data-theme (the artifact viewer sets it) > OS. */
function applyTheme() {
  const pref = Store.s && Store.s.theme
  const host = document.documentElement.getAttribute("data-theme")
  const sys = matchMedia("(prefers-color-scheme: dark)").matches
  const dark = pref ? pref === "dark" : host ? host === "dark" : sys
  const root = document.documentElement
  root.classList.toggle("dark", dark)
  if (SKIN) root.dataset.skin = SKIN
  Store.setDark(dark)
  // Read the browser chrome colour off the skin actually in force rather than
  // hardcoding one, so a skin change cannot leave a stale colour behind.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    const bar = getComputedStyle(root).getPropertyValue(dark ? "--background" : "--sidebar").trim()
    if (bar) meta.setAttribute("content", bar)
  }
}

function boot(bundle) {
  setBundle(bundle)
  Store.init()
  applyTheme()
  Store.subscribe(applyTheme)
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme)
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
  if (bundle.seed) Store.applySeed(bundle.seed)
  // Learning records for everything answered before the engine existed; again after every Drive merge.
  backfill()
  seedBooks()
  syncBadges()
  Store.afterMerge = () => { backfill(); seedBooks(); syncBadges() }

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  // Resume the Drive session if the stored token is still good. Never open the
  // Google popup on load: with no click behind it, browsers block it anyway.
  if (DRIVE_ENABLED) Store.resume()
}

function fail(msg) {
  document.getElementById("root").innerHTML =
    '<div style="max-width:40ch;margin:15vh auto;padding:24px;text-align:center;font:15px/1.5 system-ui">' +
    "<h2 style='margin:0 0 8px'>Questions could not load</h2><p style='margin:0;opacity:.7'>" + msg + "</p></div>"
}

if (window.__LEARNING__) boot(window.__LEARNING__)
else fetch("content/bundle.json").then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json() }).then(boot)
  .catch((e) => fail("content/bundle.json did not load (" + e.message + ")."))
