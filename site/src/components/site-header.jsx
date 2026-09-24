import * as React from "react"
import { Cloud, CloudOff, Home as HomeIcon, Loader2, Moon, Sun, Volume2, VolumeX } from "lucide-react"

import { D, SUBJ, spanById } from "@/lib/content"
import { W } from "@/lib/world"
import { go } from "@/lib/router"
import { DRIVE_ENABLED, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@zhangqi444/ui/ui/breadcrumb"
import { Button } from "@zhangqi444/ui/ui/button"
import { Separator } from "@zhangqi444/ui/ui/separator"
import { SidebarTrigger } from "@zhangqi444/ui/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@zhangqi444/ui/ui/tooltip"
import { STATUS_LABEL } from "@/components/nav-user"

/** Breadcrumb trail for the current hash route. Every crumb is a real link, so
 *  there is always a way out of a set or a review. */
function crumbs(route) {
  const [top, a, b, c] = route
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
  } else if (top === "drive") {
    out.push({ label: "Drive settings", path: "/drive" })
  } else if (top === "import") {
    out.push({ label: "Essay", path: "/essay" })
    out.push({ label: "Add a review", path: "/import" })
  }
  return out
}

export function SiteHeader({ route }) {
  const store = useStore()
  const trail = crumbs(route)
  const status = DRIVE_ENABLED ? store.status : null
  const isDark = store.dark

  function toggleTheme() { store.setTheme(isDark ? "light" : "dark") }

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {trail.map((cr, i) => {
              const last = i === trail.length - 1
              // On phones keep the home link (as an icon) plus the last two crumbs so the trail fits.
              const hideOnMobile = trail.length > 2 && i < trail.length - 2
              const nav = (e) => { e.preventDefault(); go(cr.path) }
              return (
                <React.Fragment key={cr.path}>
                  {i > 0 && <BreadcrumbSeparator className={cn(hideOnMobile && i > 1 && "hidden md:block")} />}
                  {i === 0 && hideOnMobile && (
                    <BreadcrumbItem className="md:hidden">
                      <BreadcrumbLink href="#/" onClick={nav} aria-label="Dashboard" data-testid="crumb-home"><HomeIcon className="size-4" /></BreadcrumbLink>
                    </BreadcrumbItem>
                  )}
                  <BreadcrumbItem className={cn(hideOnMobile && "hidden md:inline-flex")}>
                    {last ? (
                      <BreadcrumbPage className="font-medium">{cr.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={"#" + cr.path} onClick={nav}>{cr.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-1.5">
          {status && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={status === "live" ? "secondary" : "outline"}
                  size="sm"
                  className="hidden gap-2 sm:inline-flex"
                  disabled={status === "connecting" || status === "syncing"}
                  /* Connected, this opens the settings page; it used to sign
                     her out. A chip that reads "Saved to Drive" is a status
                     light, and one tap on it silently stopped the mirroring
                     with nothing asked and nothing said — a child uses this.
                     Disconnecting is still one page away, under its own
                     heading, next to the sentence explaining that it deletes
                     nothing. Not connected, one tap to connect is the right
                     thing and stays. */
                  onClick={() => (status === "live" ? go("/drive") : store.signIn().catch(() => {}))}
                >
                  {status === "connecting" || status === "syncing" ? (
                    <Loader2 className="animate-spin" />
                  ) : status === "error" ? (
                    <CloudOff className="text-destructive" />
                  ) : (
                    <Cloud className={cn(status === "live" && "text-success", status === "expired" && "text-warning")} />
                  )}
                  {status === "live" ? "Saved to Drive" : status === "connecting" ? "Connecting…" : status === "syncing" ? "Syncing…" : status === "error" ? "Retry Drive" : status === "expired" ? "Reconnect Drive" : "Save to Drive"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {status === "live"
                  ? `Progress is mirrored to progress.json in your Google Drive${store.email ? " (" + store.email + ")" : ""}. Click for Drive settings.`
                  : status === "error"
                    ? store.lastError || "Google Drive could not be reached."
                    : status === "expired"
                      ? "Google sign-ins last an hour. Click to reconnect — no consent screen this time, progress on this device is safe meanwhile."
                      : "Authorize the site to keep progress.json in a folder it creates in your Google Drive."}
              </TooltipContent>
            </Tooltip>
          )}
          {status && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 sm:hidden"
              aria-label={STATUS_LABEL[status]}
              disabled={status === "connecting" || status === "syncing"}
              onClick={() => (status === "live" ? go("/drive") : store.signIn().catch(() => {}))}
            >
              {status === "connecting" || status === "syncing" ? <Loader2 className="animate-spin" /> : status === "error" ? <CloudOff className="text-destructive" /> : <Cloud className={cn(status === "live" && "text-success", status === "expired" && "text-warning")} />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => store.setPref("muted", !store.s.muted)}
            aria-label={store.s.muted ? "Turn sound on" : "Turn sound off"}
            data-testid="mute-toggle"
          >
            {store.s.muted ? <VolumeX /> : <Volume2 />}
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? <Sun /> : <Moon />}
          </Button>
        </div>
      </div>
    </header>
  )
}
