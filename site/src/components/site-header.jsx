import * as React from "react"
import { Moon, Sun, Volume2, VolumeX } from "lucide-react"

import { D, SUBJ, spanById } from "@/lib/content"
import { W } from "@/lib/world"
import { go, splitCat } from "@/lib/router"
import { zhCrumbs } from "@/pages/chinese"
import { setLang, t, useLang } from "@/lib/lang"
import { importIsZh, parsePaperImport } from "@/lib/reviews"
import { offlinePaper } from "@/lib/engine"
import { DRIVE_ENABLED, useStore } from "@/lib/store"
import { DriveChip } from "@zhangqi444/ui/app/drive-chip"
import { SiteHeaderTemplate } from "@zhangqi444/ui/app/site-header"
import { Button } from "@zhangqi444/ui/ui/button"
import { SidebarTrigger } from "@zhangqi444/ui/ui/sidebar"
import { CHIP_LABEL, CHIP_LABEL_ZH, STATUS_LABEL, STATUS_LABEL_ZH } from "@/components/nav-user"

/** Breadcrumb trail for the current hash route. Every crumb is a real link, so
 *  there is always a way out of a set or a review. `zhImport`: the route is an
 *  import link carrying Chinese reviews, which makes it a Chinese page. */
function crumbs(route, zhImport) {
  const { cat, rest } = splitCat(route)
  if (cat === "chinese") return zhCrumbs(rest)
  const [top, a, b, c] = rest
  if (zhImport) return [{ label: t("中文", "Chinese"), path: "/chinese" }, { label: t("添加批改", "Add a review"), path: "/import/" + a }]
  const out = [{ label: "Dashboard", path: "/" }]
  if (top === "s" && SUBJ[a]) {
    out.push({ label: SUBJ[a].name, path: "/s/" + a })
    if (b) out.push({ label: b, path: `/s/${a}/${b}` })
  } else if (top === "run" && SUBJ[a]) {
    out.push({ label: SUBJ[a].name, path: "/s/" + a })
    out.push({ label: b, path: `/s/${a}/${b}` })
    out.push({ label: "Set " + (+c + 1), path: `/run/${a}/${b}/${c}` })
  } else if (top === "review") {
    out.push({ label: "Review", path: "/review" })
    if (SUBJ[a]) out.push({ label: SUBJ[a].name, path: "/review/" + a })
    if (SUBJ[a] && b) out.push({ label: b === "checkin" ? "Check-in" : "Everything", path: `/review/${a}/${b}` })
  } else if (top === "precision") {
    out.push({ label: SUBJ.vr.name, path: "/s/vr" })
    if (a) out.push({ label: a, path: "/s/vr/" + a })
    out.push({ label: "Precision review", path: "/precision/" + a })
    if (b === "quiz") out.push({ label: "Word quiz", path: `/precision/${a}/quiz` })
  } else if (top === "mixed") {
    out.push({ label: "Mixed practice", path: "/mixed" })
    if (a === "run") out.push({ label: "Mixed set", path: "/mixed/run" })
  } else if (top === "score") {
    out.push({ label: "Score", path: "/score" })
  } else if (top === "quest") {
    out.push({ label: W.woodTitle, path: "/quest" })
    if (a) out.push({ label: a, path: "/quest/" + a })
  } else if (top === "base") {
    out.push({ label: W.homeTitle, path: "/base" })
  } else if (top === "rewards") {
    out.push({ label: "Rewards", path: "/rewards" })
  } else if (top === "books") {
    out.push({ label: "Reading", path: "/books" })
  } else if (top === "essay") {
    out.push({ label: "Essay", path: "/essay" })
    if (a) out.push({ label: a, path: "/essay/" + a })
  } else if (top === "mock") {
    out.push({ label: "Mock exams", path: "/mock" })
    const m = a && D.mocks.find((x) => x.id === a)
    if (m) out.push({ label: m.name, path: "/mock/" + a })
    const off = a && !m && a !== "add" && offlinePaper(a)
    if (off) out.push({ label: off.name, path: "/mock/" + a })
    if (a === "add") out.push({ label: "Add a paper", path: "/mock/add" })
    if (m && b) out.push({ label: b === "corrections" ? "Corrections" : (m.sections.find((x) => x.id === b) || {}).name || b, path: `/mock/${a}/${b}` })
  } else if (top === "calendar") {
    out.push({ label: "Calendar", path: "/calendar" })
  } else if (top === "checklist") {
    out.push({ label: "Checklist", path: "/checklist" })
    if (a === "month" && b) out.push({ label: b, path: `/checklist/month/${b}` })
    /* The route segment is the span's id, and for a plan week the id happens to
       read as a name — "W3" — so printing it raw was right for eight weeks out
       of twelve and never questioned. The plan's own between-weeks are keyed
       "B:2026-09-21", and that is what the trail then said she was looking at.
       Ask the plan what the span is called instead of assuming the key is it. */
    else if (a) out.push({ label: (spanById(a) || {}).name || a, path: `/checklist/${a}` })
  } else if (top === "skill" && SUBJ[a] && b) {
    let sk = b
    try { sk = decodeURIComponent(b) } catch { /* as typed */ }
    out.push({ label: SUBJ[a].name, path: "/s/" + a })
    out.push({ label: sk, path: `/skill/${a}/${b}` })
    if (c === "practice") out.push({ label: "Practice", path: `/skill/${a}/${b}/practice` })
  } else if (top === "vocab") {
    out.push({ label: "Vocabulary", path: "/vocab" })
    if (a) {
      let w = a
      try { w = decodeURIComponent(a) } catch { /* as typed */ }
      out.push({ label: w, path: "/vocab/" + a })
    }
  } else if (top === "drive") {
    out.push({ label: "Drive settings", path: "/drive" })
  } else if (top === "import") {
    // A paper's results come in by the same door as an essay review, and belong to the paper.
    let paper = null
    try { paper = a ? parsePaperImport(a) : null } catch { paper = null }
    if (paper) {
      out.push({ label: "Mock exams", path: "/mock" })
      out.push({ label: paper.form.name, path: "/mock/" + paper.form.id })
      out.push({ label: "Add results", path: "/import/" + a })
    } else {
      out.push({ label: "Essay", path: "/essay" })
      out.push({ label: "Add a review", path: "/import" })
    }
  }
  return out
}

/* What the Drive chip's tooltip says here — the part the shared chip
 * deliberately leaves to the site, because the click means something different
 * on each one. */
function driveTip(status, store, cn) {
  if (cn) {
    if (status === "live") return `进度已同步到你 Google Drive 里的 progress.json${store.email ? "（" + store.email + "）" : ""}。点一下打开 Drive 设置。`
    if (status === "error") return store.lastError || "连不上 Google Drive。"
    if (status === "expired") return "Google 登录一小时后会过期。点一下重新连接——这次不用再授权，这台设备上的进度也不会丢。"
    return "授权网站把 progress.json 保存在它在你 Google Drive 里建的文件夹中。"
  }
  if (status === "live") return `Progress is mirrored to progress.json in your Google Drive${store.email ? " (" + store.email + ")" : ""}. Click for Drive settings.`
  if (status === "error") return store.lastError || "Google Drive could not be reached."
  if (status === "expired") return "Google sign-ins last an hour. Click to reconnect — no consent screen this time, progress on this device is safe meanwhile."
  return "Authorize the site to keep progress.json in a folder it creates in your Google Drive."
}

export function SiteHeader({ route }) {
  const store = useStore()
  const lang = useLang()
  const { cat, rest } = splitCat(route)
  // An import link whose reviews are all Chinese is a Chinese page too: it gets
  // the toggle and the 中文 trail. Parsed once per route, not once per render.
  const zhImport = React.useMemo(() => rest[0] === "import" && !!rest[1] && importIsZh(rest[1]), [route])
  const trail = crumbs(route, zhImport)
  const chinese = cat === "chinese" || zhImport
  const cn = chinese && lang === "zh"      // a Chinese page, read in Chinese: the header's own words follow
  const status = DRIVE_ENABLED ? store.status : null
  const isDark = store.dark

  function toggleTheme() { store.setTheme(isDark ? "light" : "dark") }

  return (
    <SiteHeaderTemplate
      trail={trail}
      onNavigate={go}
      trigger={<SidebarTrigger className="-ml-1" />}
      className="transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
    >
      {/* One language per page: the Chinese half is Chinese by default, English
          behind this one tap (lib/lang.js). The ISEE half has no such switch. */}
      {chinese ? (
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-semibold" onClick={() => setLang(lang === "en" ? "zh" : "en")} aria-label={lang === "en" ? "中文" : "English"} data-testid="lang-toggle">
          {lang === "en" ? "中" : "EN"}
        </Button>
      ) : null}
      <DriveChip
        status={status}
        onAct={() => (status === "live" ? go("/drive") : store.signIn().catch(() => {}))}
        tooltip={driveTip(status, store, cn)}
        labels={cn ? CHIP_LABEL_ZH : CHIP_LABEL}
        statusLabels={cn ? STATUS_LABEL_ZH : STATUS_LABEL}
        data-testid="drive-button"
      />
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => store.setPref("muted", !store.s.muted)}
        aria-label={store.s.muted ? (cn ? "打开声音" : "Turn sound on") : (cn ? "关掉声音" : "Turn sound off")}
        data-testid="mute-toggle"
      >
        {store.s.muted ? <VolumeX /> : <Volume2 />}
      </Button>
      <Button variant="ghost" size="icon" className="size-8" onClick={toggleTheme} aria-label={cn ? "切换主题" : "Toggle theme"}>
        {isDark ? <Sun /> : <Moon />}
      </Button>
    </SiteHeaderTemplate>
  )
}
