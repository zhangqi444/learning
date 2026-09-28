import * as React from "react"
import { Cloud, CloudOff, HardDrive, MonitorSmartphone, Moon, MoreVertical, Settings2, Sun } from "lucide-react"

import { go } from "@/lib/router"
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

export function NavUser() {
  const store = useStore()
  const { isMobile } = useSidebar()
  const status = DRIVE_ENABLED ? store.status : "local"
  const live = status === "live"
  const name = live ? (store.name || store.email || "Signed in") : "Sheila"
  const sub = live && store.email && store.name ? store.email : STATUS_LABEL[status]
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
                  <Settings2 /> Drive settings
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => store.signIn().catch(() => {})} disabled={driveBusy(status)}>
                  {status === "error" ? <CloudOff /> : <Cloud />}
                  {status === "error" ? "Retry Google Drive" : status === "expired" ? "Reconnect Google Drive" : "Save to Google Drive"}
                </DropdownMenuItem>
              )
            ) : (
              <DropdownMenuItem disabled>
                <HardDrive /> Progress stays in this browser
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-muted-foreground text-xs">Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={(v) => store.setTheme(v === "system" ? undefined : v)}>
            <DropdownMenuRadioItem value="light"><Sun /> Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark"><Moon /> Dark</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system"><MonitorSmartphone /> System</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </AccountMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
