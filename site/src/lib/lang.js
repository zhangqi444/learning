/* The language of the Chinese half's chrome. Chinese by default — a Chinese
 * workbook's site should read as one — with English behind one toggle in the
 * header, so a page is never two languages at once. Remembered in localStorage
 * only: which language she read the buttons in is not learning evidence. The
 * ISEE half is English and does not consult this. */
import { useEffect, useState } from "react"
const KEY = "learning.zhLang"
let cur = "zh"
try { cur = localStorage.getItem(KEY) === "en" ? "en" : "zh" } catch { /* private mode */ }
const subs = new Set()
export function getLang() { return cur }
export function setLang(l) { cur = l === "en" ? "en" : "zh"; try { localStorage.setItem(KEY, cur) } catch { /* no-op */ } for (const f of subs) f(cur) }
export function useLang() { const [l, set] = useState(cur); useEffect(() => { subs.add(set); return () => subs.delete(set) }, []); return l }
/** Pick by the current language. Call inside a component that called useLang(). */
export const t = (zh, en) => (cur === "en" ? en : zh)
/** A field that may be a string or { zh, en }. */
export const tf = (v) => (v && typeof v === "object" ? (cur === "en" ? v.en : v.zh) : v)
