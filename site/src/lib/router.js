/* Hash router: works on GitHub Pages under a project subpath and inside the artifact. */
import { useEffect, useState } from "react"

/* A route is the path before any `?`; what follows is the page's own state — the filters on a
 * question list — kept in the address so going back to the page finds them as they were. No
 * route has carried a `?` before this, and an import payload is base64url, which never does. */
const parse = () => (location.hash || "#/").replace(/^#/, "").split("?")[0].split("/").filter(Boolean)

export function useRoute() {
  const [parts, set] = useState(parse)
  useEffect(() => {
    const on = () => { set(parse()); window.scrollTo(0, 0) }
    addEventListener("hashchange", on)
    return () => removeEventListener("hashchange", on)
  }, [])
  return parts
}
/** The address as it was when she last navigated. A page whose state lives in the query (a
 *  question list's filters) is keyed by this, so following a link to the same page with other
 *  filters starts it afresh, while the filters it writes itself (`setRouteQuery`, no hashchange)
 *  never remount it. Registered at import, so it is current before any route re-renders. */
let NAV = typeof location !== "undefined" ? location.hash : ""
if (typeof window !== "undefined") addEventListener("hashchange", () => { NAV = location.hash })
export const navHash = () => NAV

export function go(path) { location.hash = path }
export function href(path) { return "#" + path }
/** The page's state from the address: `#/s/ma?status=missed` gives { status: "missed" }. */
export function routeQuery() {
  const h = location.hash || ""
  const at = h.indexOf("?")
  return at < 0 ? {} : Object.fromEntries(new URLSearchParams(h.slice(at + 1)))
}
/** A query string from an object, leaving out empty values: `?status=missed&sk=Fractions`. */
export function queryString(q) {
  const keep = Object.entries(q || {}).filter(([, v]) => v != null && v !== "")
  return keep.length ? "?" + new URLSearchParams(keep).toString() : ""
}
/** Write the page's state into the address without moving the page. A hash assignment fires
 *  `hashchange`, which re-renders the route and scrolls to the top on every filter tap;
 *  `replaceState` fires nothing and adds no history entry, so Back still leaves the page. */
export function setRouteQuery(q) {
  const path = (location.hash || "#/").split("?")[0]
  try { history.replaceState(history.state, "", path + queryString(q)) } catch { /* a sandboxed frame: the filters still work, only the address does not keep them */ }
}

/* The category is the first route segment (docs/chinese.md § 2): `#/chinese/...`
 * is the Chinese half, and `#/isee/...` the ISEE half. The ISEE routes also keep
 * their un-prefixed form — `#/s/vr/W3` is the same page as `#/isee/s/vr/W3` —
 * because eighteen files and three suites address them that way, and a rewrite
 * would churn all of it for an address bar. New links are written the short way;
 * the typed URL `/isee` and the stub behind it resolve to the same place. What is
 * remembered is only which half she used last, and only in localStorage: it is a
 * convenience, not learning evidence, so it has no business in Drive. */
export const CATS = ["isee", "chinese"]
const CAT_KEY = "learning.cat"
export function splitCat(route) {
  if (route[0] === "chinese") return { cat: "chinese", rest: route.slice(1) }
  if (route[0] === "isee") return { cat: "isee", rest: route.slice(1) }
  return { cat: "isee", rest: route }
}
export function lastCat() { try { const c = localStorage.getItem(CAT_KEY); return CATS.includes(c) ? c : "isee" } catch { return "isee" } }
export function rememberCat(cat) { try { localStorage.setItem(CAT_KEY, cat) } catch { /* private mode: nothing to remember with */ } }
