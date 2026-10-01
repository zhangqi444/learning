/* Hash router: works on GitHub Pages under a project subpath and inside the artifact. */
import { useEffect, useState } from "react"

const parse = () => (location.hash || "#/").replace(/^#/, "").split("/").filter(Boolean)

export function useRoute() {
  const [parts, set] = useState(parse)
  useEffect(() => {
    const on = () => { set(parse()); window.scrollTo(0, 0) }
    addEventListener("hashchange", on)
    return () => removeEventListener("hashchange", on)
  }, [])
  return parts
}
export function go(path) { location.hash = path }
export function href(path) { return "#" + path }

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
