import * as React from "react"
import { Cloud, CloudOff, HardDrive, MonitorSmartphone, Moon, MoreVertical, Settings2, Sun } from "lucide-react"

import { go } from "@/lib/router"
import { useLang } from "@/lib/lang"
import { DRIVE_ENABLED, useStore } from "@/lib/store"
import { DRIVE_CHIP_LABEL, DRIVE_STATUS_LABEL, driveBusy } from "@zhangqi444/ui/lib/drive-status"
import { AccountIdentity, AccountMenu } from "@zhangqi444/ui/app/account-menu"
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@zhangqi444/ui/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@zhangqi444/ui/ui/sidebar"

/* Both maps are the package defaults verbatim: the shared ones were seeded
 * from this site, so there is nothing here to override. The sibling site
 * overrides `local` in both, because with no Drive it cannot do anything at
 * all, where this one goes on saving her work to the device. */
export const STATUS_LABEL = DRIVE_STATUS_LABEL
export const CHIP_LABEL = DRIVE_CHIP_LABEL
/* The same seven states on a Chinese page read in Chinese (lib/lang.js). The
 * words live in the package; which map is handed to it is this site's call,
 * and on the Chinese half that follows the header's toggle. "Drive" and
 * "Google" stay as names, the way the toggle itself says 中 and EN. */
export const STATUS_LABEL_ZH = {
  local: "已保存在这台设备上",
  connecting: "正在连接 Google…",
  syncing: "正在同步到 Drive…",
  live: "已保存到 Google Drive",
  expired: "Drive 登录已过期——请重新连接",
  error: "Drive 同步失败",
  unavailable: "这里用不了 Drive",
}
export const CHIP_LABEL_ZH = {
  local: "保存到 Drive",
  connecting: "连接中…",
  syncing: "同步中…",
  live: "已保存到 Drive",
  expired: "重新连接 Drive",
  error: "重试 Drive",
  unavailable: "Drive 不可用",
}

/** `zh`: the sidebar is on a Chinese page, so the menu reads in that page's
 *  language. On the ISEE half nothing is passed and nothing changes. */
export function NavUser({ zh }) {
  const store = useStore()
  const lang = useLang()
  const cn = !!zh && lang === "zh"
  const { isMobile } = useSidebar()
  const status = DRIVE_ENABLED ? store.status : "local"
  const live = status === "live"
  const name = live ? (store.name || store.email || (cn ? "已登录" : "Signed in")) : "Sheila"
  const sub = live && store.email && store.name ? store.email : (cn ? STATUS_LABEL_ZH : STATUS_LABEL)[status]
  const theme = store.s.theme || "system"

  const who = { name, sub, picture: live ? store.picture : "" }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <AccountMenu
          {...who}
          isMobile={isMobile}
          trigger={
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground" data-testid="nav-user">
              <AccountIdentity {...who} />
              <MoreVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          }
        >
          <DropdownMenuGroup>
            {DRIVE_ENABLED ? (
              live ? (
                /* One way in, not four.
                 *
                   * This menu grew a link at a time — sync, the folder, sign
                   * out — because there was nowhere else to put them. There is
                   * now: the settings page holds all three, plus the file
                   * itself and the folder's name, and says what the permission
                   * does and does not allow. Four entries that each did a
                   * fraction of one page is a menu asking her to know which
                   * fraction she wants before she has seen any of them. */
                <DropdownMenuItem onSelect={() => go("/drive")} data-testid="drive-settings-link">
                  <Settings2 /> {cn ? "Drive 设置" : "Drive settings"}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => store.signIn().catch(() => {})} disabled={driveBusy(status)}>
                  {status === "error" ? <CloudOff /> : <Cloud />}
                  {status === "error" ? (cn ? "重试 Google Drive" : "Retry Google Drive") : status === "expired" ? (cn ? "重新连接 Google Drive" : "Reconnect Google Drive") : (cn ? "保存到 Google Drive" : "Save to Google Drive")}
                </DropdownMenuItem>
              )
            ) : (
              <DropdownMenuItem disabled>
                <HardDrive /> {cn ? "进度只保存在这个浏览器里" : "Progress stays in this browser"}
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-muted-foreground text-xs">{cn ? "主题" : "Theme"}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={(v) => store.setTheme(v === "system" ? undefined : v)}>
            <DropdownMenuRadioItem value="light"><Sun /> {cn ? "浅色" : "Light"}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark"><Moon /> {cn ? "深色" : "Dark"}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system"><MonitorSmartphone /> {cn ? "跟随系统" : "System"}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </AccountMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
