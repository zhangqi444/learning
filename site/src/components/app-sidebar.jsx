import * as React from "react"
import { Award, Blocks, BookA, Languages, Volume2, BookMarked, BookOpen, Calculator, CalendarDays, GraduationCap, LayoutDashboard, ListChecks, PenLine, Play, RotateCcw, Shuffle, Sigma, Timer, Trophy, Wand2 } from "lucide-react"

import { D, ORDER, SUBJ, subjProgress, zhHomework, zhLessons } from "@/lib/content"
import { W } from "@/lib/world"
import { reviewQueue } from "@/lib/engine"
import { recentBadges } from "@/lib/rewards"
import { baseCounts } from "@/lib/base"
import { currentBook, finishedBooks } from "@/lib/books"
import { nextUp, weekLeft } from "@/pages/checklist"
import { essayStatus } from "@/pages/essay"
import { unseenReviews } from "@/lib/reviews"
import { go, splitCat } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@zhangqi444/ui/ui/sidebar"
import { NavUser } from "@/components/nav-user"

const ICON = { vr: BookA, qr: Sigma, ma: Calculator, rc: BookOpen }

/** Navigates and closes the drawer on phones. */
function useNav() {
  const { isMobile, setOpenMobile } = useSidebar()
  return (path) => { go(path); if (isMobile) setOpenMobile(false) }
}

export function AppSidebar({ route, ...props }) {
  useStore()
  const nav = useNav()
  const misses = reviewQueue().due.length
  const zhDue = reviewQueue(null, "chinese").due.length
  const fresh = recentBadges(3).length
  const week = weekLeft()
  const next = nextUp()
  const essayDone = D.weeks.filter((w) => essayStatus(w.w) === "complete").length
  const newReviews = unseenReviews().length
  const { cat, rest } = splitCat(route)
  const isee = cat === "isee"
  const top = rest[0] || ""
  const activeSub = top === "s" || top === "run" ? rest[1] : top === "precision" ? "vr" : null
  const zhLesson = zhLessons()[0], zhNote = zhHomework()[0]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href={isee ? "#/" : "#/chinese"} onClick={(e) => { e.preventDefault(); nav(isee ? "/" : "/chinese") }}>
                <GraduationCap className="!size-5 text-primary" />
                <span className="text-base font-semibold tracking-tight">{isee ? "Sheila · ISEE" : "Sheila · 中文"}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* Two halves, one record (docs/chinese.md § 2). The switch lives in the
            header, not among the groups: test_features.cjs reads the groups by
            position — the first is the working list — and a switch is not a list
            of pages. Both roots are typed URLs too, so no page lives only here. */}
        <div className="grid grid-cols-2 gap-1 rounded-lg border p-1" role="tablist" aria-label="Category" data-testid="category-switch">
          <button type="button" role="tab" aria-selected={isee} className={cn("rounded-md px-2 py-1 text-sm", isee ? "bg-primary text-primary-foreground" : "hover:bg-accent")} onClick={() => nav("/")} data-testid="cat-isee">ISEE</button>
          <button type="button" role="tab" aria-selected={!isee} className={cn("rounded-md px-2 py-1 text-sm", !isee ? "bg-primary text-primary-foreground" : "hover:bg-accent")} onClick={() => nav("/chinese")} data-testid="cat-chinese">中文</button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {!isee && zhLesson ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="This week's homework" isActive={top === ""} onClick={() => nav("/chinese")}>
                    <ListChecks /><span>This week</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={zhLesson.title} isActive={top === "l"} onClick={() => nav("/chinese/l/" + zhLesson.id)}>
                    <BookOpen /><span>第{zhLesson.no}课 {zhLesson.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {zhNote ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Dictation" isActive={top === "dictation"} onClick={() => nav("/chinese/dictation/" + zhNote.set)}>
                      <Volume2 /><span>听写</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Review" isActive={top === "review"} onClick={() => nav("/chinese/review")}>
                    <RotateCcw /><span>Review</span>
                  </SidebarMenuButton>
                  {zhDue ? <SidebarMenuBadge className="bg-destructive text-white rounded-full h-5 min-w-5 px-1.5" data-testid="zh-due">{zhDue}</SidebarMenuBadge> : null}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
        {isee ? (
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  tooltip={next ? "Next: " + next.label : "Everything in the plan is done"}
                  onClick={() => nav(next ? next.path : "/")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                  data-testid="continue-practice"
                >
                  <Play className="shrink-0" />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="font-medium">{next ? "Continue" : "All done"}</span>
                    <span className="truncate text-xs opacity-80">{next ? next.label : "nothing left in the plan"}</span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" isActive={top === ""} onClick={() => nav("/")}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={week.left ? `${week.left} of ${week.total} still to do this week` : "This week is clear"} isActive={top === "checklist"} onClick={() => nav("/checklist")}>
                  <ListChecks />
                  <span>Checklist</span>
                </SidebarMenuButton>
                {week.left ? <SidebarMenuBadge className="bg-warning-soft text-warning rounded-full h-5 min-w-5 px-1.5" data-testid="week-left">{week.left}</SidebarMenuBadge> : null}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Review" isActive={top === "review"} onClick={() => nav("/review")}>
                  <RotateCcw />
                  <span>Review</span>
                </SidebarMenuButton>
                {misses ? (
                  <SidebarMenuBadge className="bg-destructive text-white rounded-full h-5 min-w-5 px-1.5">{misses}</SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Mixed practice" isActive={top === "mixed"} onClick={() => nav("/mixed")}>
                  <Shuffle />
                  <span>Mixed practice</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Score" isActive={top === "score"} onClick={() => nav("/score")}>
                  <Trophy />
                  <span>Score</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={W.woodTitle} isActive={top === "quest"} onClick={() => nav("/quest")}>
                  <Wand2 />
                  <span>{W.woodTitle}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Mock exams" isActive={top === "mock"} onClick={() => nav("/mock")}>
                  <Timer />
                  <span>Mock exams</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Calendar" isActive={top === "calendar"} onClick={() => nav("/calendar")}>
                  <CalendarDays />
                  <span>Calendar</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        ) : null}

        {/* The world's own two: the place she builds and what the work is for.
            Neither produces a single piece of learning evidence, which is why
            they were the odd ones out in the working list above.

            The Wordwood is deliberately NOT here. Every gate in it is recorded
            as an ordinary `vocab` attempt — the same evidence the word quiz
            gives — so filing it under the world's heading would say it does not
            count, and would undo the work of getting the weekly plan to point at
            it in the first place. It stays with the practice, because it is
            practice. Nor is this group called "Games": that phrase means "the
            fun after the work", which is the one framing this whole design
            exists to avoid. */}
        <SidebarGroup>
          <SidebarGroupLabel>{W.world}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={W.homeTitle} isActive={top === "base"} onClick={() => nav("/base")}>
                  <Blocks />
                  <span>{W.homeTitle}</span>
                </SidebarMenuButton>
                <SidebarMenuBadge className="text-muted-foreground tabular-nums">{baseCounts().built}/{baseCounts().total}</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Rewards" isActive={top === "rewards"} onClick={() => nav("/rewards")}>
                  <Award />
                  <span>Rewards</span>
                </SidebarMenuButton>
                {fresh ? <SidebarMenuBadge className="pointer-events-none" data-testid="rewards-new"><span className="bg-primary size-2 rounded-full" title={`${fresh} new badge${fresh === 1 ? "" : "s"}`} /></SidebarMenuBadge> : null}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isee ? (
        <SidebarGroup>
          <SidebarGroupLabel>Subjects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ORDER.map((s) => {
                const Icon = ICON[s]
                const p = subjProgress(s)
                return (
                  <SidebarMenuItem key={s}>
                    <SidebarMenuButton tooltip={SUBJ[s].name} isActive={activeSub === s} onClick={() => nav("/s/" + s)}>
                      <Icon />
                      <span>{SUBJ[s].name}</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge className="text-muted-foreground">{p.done}/{p.total}</SidebarMenuBadge>
                  </SidebarMenuItem>
                )
              })}
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Essay" isActive={top === "essay"} onClick={() => nav("/essay")}>
                  <PenLine />
                  <span>Essay</span>
                </SidebarMenuButton>
                <SidebarMenuBadge className="text-muted-foreground gap-1.5">
                  {newReviews ? <span className="bg-primary size-2 rounded-full" title={`${newReviews} review${newReviews === 1 ? "" : "s"} to read`} data-testid="reviews-new" /> : null}
                  {essayDone}/{D.weeks.length}
                </SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={currentBook() ? "Reading · " + currentBook().title : "Reading"} isActive={top === "books"} onClick={() => nav("/books")}>
                  <BookMarked />
                  <span>Reading</span>
                </SidebarMenuButton>
                {finishedBooks().length ? <SidebarMenuBadge className="text-muted-foreground">{finishedBooks().length}</SidebarMenuBadge> : null}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
