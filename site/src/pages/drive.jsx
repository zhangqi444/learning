import * as React from "react"
import { Check, CloudOff, ExternalLink, FileJson, FolderOpen, LogOut, RefreshCw } from "lucide-react"

import { DRIVE_ENABLED, Store, useStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@zhangqi444/ui/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@zhangqi444/ui/ui/input"

/** Where her work is kept, said out loud and openable.
 *
 *  All of this existed and none of it was reachable: the folder id was resolved
 *  on every sync and thrown at one link in the account menu, the file id was
 *  known only to the code that wrote it, and the folder's name was a constant.
 *  Someone who wanted to download the record, put it on another device, or keep
 *  it somewhere of their own choosing had nowhere to go and nothing to click.
 *
 *  The page is careful about one thing above all. The scope is `drive.file`,
 *  which means the site can see the folder and the file it made and nothing else
 *  in her Drive — not the names of other folders, not their contents, not that
 *  they exist. So there is no folder picker here, because a picker would need
 *  permission to read her whole Drive to populate itself. What there is instead
 *  is a name: the app finds or makes a folder called that, and moves the record
 *  into it. Saying which of those two things is on offer is the whole job; a
 *  control that looks like browsing and is not would be worse than no control. */
export function DriveSettings() {
  const store = useStore()
  const live = DRIVE_ENABLED && store.status !== "local" && store.status !== "expired" && !!store.email
  const [name, setName] = React.useState(() => Store.folderName())
  const [busy, setBusy] = React.useState(false)
  const [msg, setMsg] = React.useState(null)
  const folderUrl = Store.driveUrl()
  const fileUrl = Store.fileUrl()
  const changed = name.trim() && name.trim() !== Store.folderName()

  function save() {
    setBusy(true); setMsg(null)
    Store.setFolder(name)
      .then((moved) => { setName(Store.folderName()); setMsg(moved ? "moved" : "nothing to change") })
      .catch((e) => setMsg("failed: " + String((e && e.message) || e)))
      .finally(() => setBusy(false))
  }
  function syncNow() {
    setBusy(true); setMsg(null)
    Store.setStatus("syncing")
    Store.pull()
      .then(() => { Store.lastSync = new Date(); Store.setStatus("live"); setMsg("synced") })
      .catch(() => { Store.setStatus("error"); setMsg("sync failed") })
      .finally(() => setBusy(false))
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 md:gap-6" data-testid="drive-settings">
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-3">
        <CardHeader>
          <CardDescription className="flex items-center gap-2"><FolderOpen className="size-4" /> Google Drive</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">Where this work is saved</CardTitle>
          <CardDescription>
            Everything is kept on this device first and mirrored to one file in your own Google Drive, so it survives a
            lost phone and follows her to another one. Nothing is sent anywhere else.
          </CardDescription>
          <CardAction>
            {live
              ? <Badge variant="success" data-testid="drive-state"><Check className="size-3" /> Connected</Badge>
              : <Badge variant="outline" className="text-muted-foreground" data-testid="drive-state"><CloudOff className="size-3" /> Not connected</Badge>}
          </CardAction>
        </CardHeader>
        {live ? (
          <CardContent className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span data-testid="drive-account">{store.email}</span>
            <span>{store.lastSync ? `last synced ${new Date(store.lastSync).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` : "not synced yet this session"}</span>
          </CardContent>
        ) : (
          <CardContent className="flex flex-col items-start gap-2 text-sm">
            <span className="text-muted-foreground">Connect Drive to keep a copy off this device.</span>
            <Button size="sm" onClick={() => Store.signIn().catch(() => {})}>Connect Google Drive</Button>
          </CardContent>
        )}
      </Card>

      {live ? (
        <>
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-base">The two things it made</CardTitle>
              <CardDescription>Both open in Drive. The file is the record itself — download it, copy it, send it to somebody.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Shortcut
                icon={FolderOpen} label={Store.folderName()} sub="the folder"
                href={folderUrl} testid="drive-folder" missing="not made yet — it appears on the first sync"
              />
              <Shortcut
                icon={FileJson} label="progress.json" sub="every answer, essay, review and reward"
                href={fileUrl} testid="drive-file" missing="not written yet — it appears on the first save"
              />
            </CardContent>
          </Card>

          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-base">Save somewhere else</CardTitle>
              <CardDescription>
                Type a folder name. The site finds a folder of its own by that name, or makes one, and moves
                progress.json into it — the record is never in two places and never in none.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
                  className="h-9 max-w-80" aria-label="Drive folder name" data-testid="drive-folder-name"
                />
                <Button size="sm" onClick={save} disabled={!changed || busy} data-testid="drive-folder-save">Move it there</Button>
                {msg ? <span className="text-muted-foreground text-xs" data-testid="drive-msg">{msg}</span> : null}
              </div>
              {/* The honest limit, next to the control it limits rather than in a
                  help page nobody opens. */}
              <p className="text-muted-foreground text-xs">
                This site asked for the narrowest Drive permission there is: it can see the folder and the file it made,
                and nothing else you keep in Drive. That is why this is a name and not a list of your folders — it cannot
                see them to offer them. Moving it to a folder you made yourself would need permission to read your whole
                Drive, which is not worth it for one file.
              </p>
            </CardContent>
          </Card>

          <Card className="gap-3">
            <CardHeader><CardTitle className="text-base">Housekeeping</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={syncNow} disabled={busy} data-testid="drive-sync"><RefreshCw /> Sync now</Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => Store.signOut()} data-testid="drive-signout"><LogOut /> Disconnect Drive</Button>
              {/* Said because disconnecting sounds like deleting, and it is not. */}
              <span className="text-muted-foreground w-full text-xs">
                Disconnecting stops the mirroring. It does not delete anything — the file stays in your Drive and the
                work stays on this device.
              </span>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

function Shortcut({ icon: Icon, label, sub, href, testid, missing }) {
  const inner = (
    <>
      <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md"><Icon className="size-4" /></span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{label}</span>
        <span className="text-muted-foreground truncate text-xs">{href ? sub : missing}</span>
      </span>
      {href ? <ExternalLink className="text-muted-foreground size-4 shrink-0" /> : null}
    </>
  )
  if (!href) return <div className="flex items-center gap-3 rounded-lg border p-3 opacity-70" data-testid={testid} data-ready="0">{inner}</div>
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="hover:bg-accent/60 flex items-center gap-3 rounded-lg border p-3 transition-colors" data-testid={testid} data-ready="1">
      {inner}
    </a>
  )
}
