import * as React from "react"
import { Award, Blocks, BookA, Languages, Library, Volume2, BookMarked, BookOpen, Calculator, CalendarDays, GraduationCap, LayoutDashboard, ListChecks, PenLine, Play, RotateCcw, Shuffle, Sigma, Timer, Trophy, Wand2 } from "lucide-react"

import { D, ORDER, SUBJ, subjProgress, zhLessonLabel } from "@/lib/content"
import { currentZhLesson, noteFor, zhNextUp } from "@/pages/chinese"
import { W, WZ } from "@/lib/world"
import { reviewQueue } from "@/lib/engine"
import { recentBadges } from "@/lib/rewards"
import { baseCounts } from "@/lib/base"
import { currentBook, finishedBooks } from "@/lib/books"
import { nextUp, weekLeft } from "@/pages/checklist"
import { essayStatus } from "@/pages/essay"
import { importIsZh, unseenReviews } from "@/lib/reviews"
import { go, splitCat } from "@/lib/router"
import { t, useLang } from "@/lib/lang"
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
  useStore(); useLang()
  const nav = useNav()
  const misses = reviewQueue().due.length
  const zhDue = reviewQueue(null, "chinese").due.length
  const fresh = recentBadges(3).length
  const week = weekLeft()
  const next = nextUp()
  const essayDone = D.weeks.filter((w) => essayStatus(w.w) === "complete").length
  const newReviews = unseenReviews().length
  const { cat, rest } = splitCat(route)
  // An import link carrying Chinese reviews is a Chinese page, as the header
  // already treats it (site-header.jsx): the sidebar it sits beside is 中文's.
  const zhImport = React.useMemo(() => rest[0] === "import" && !!rest[1] && importIsZh(rest[1]), [route])
  const isee = cat === "isee" && !zhImport
  const top = rest[0] || ""
  const activeSub = top === "s" || top === "run" ? rest[1] : top === "precision" ? "vr" : null
  const zhLesson = currentZhLesson(), zhNote = zhLesson ? noteFor(zhLesson.id) : null, zhNext = zhNote ? zhNextUp(zhNote) : null

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href={isee ? "#/" : "#/chinese"} onClick={(e) => { e.preventDefault(); nav(isee ? "/" : "/chinese") }}>
                <GraduationCap className="!size-5 text-primary" />
                <span className="text-base font-semibold tracking-tight">{isee ? "Sheila · ISEE" : t("Sheila · 中文", "Sheila · Chinese")}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* Two halves, one record (docs/chinese.md § 2). The switch lives in the
            header, not among the groups: test_features.cjs reads the groups by
            position — the first is the working list — and a switch is not a list
            of pages. Both roots are typed URLs too, so no page lives only here. */}
        <div className="grid grid-cols-2 gap-1 rounded-lg border p-1" role="tablist" aria-label={isee ? "Category" : t("类别", "Category")} data-testid="category-switch">
          <button type="button" role="tab" aria-selected={isee} className={cn("rounded-md px-2 py-1 text-sm", isee ? "bg-primary text-primary-foreground" : "hover:bg-accent")} onClick={() => nav("/")} data-testid="cat-isee">ISEE</button>
          <button type="button" role="tab" aria-selected={!isee} className={cn("rounded-md px-2 py-1 text-sm", !isee ? "bg-primary text-primary-foreground" : "hover:bg-accent")} onClick={() => nav("/chinese")} data-testid="cat-chinese">{t("中文", "Chinese")}</button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {!isee && zhLesson ? (
          <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
              {/* The same working list the ISEE half has — 继续, the dashboard, the
                  checklist, review, score — so the two halves are one site. */}
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={zhNext ? t(`下一项：${zhNext.label}`, `Next: ${zhNext.label}`) : t("这周的作业都做完了", "Everything this week is done")}
                    onClick={() => nav(zhNext ? zhNext.path : "/chinese")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                    data-testid="zh-continue-practice"
                  >
                    <Play className="shrink-0" />
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="font-medium">{zhNext ? t("继续", "Continue") : t("都做完了", "All done")}</span>
                      <span className="truncate text-xs opacity-80">{zhNext ? zhNext.label : t("这周没有剩下的了", "nothing left this week")}</span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={t("首页", "Dashboard")} isActive={top === ""} onClick={() => nav("/chinese")}>
                    <LayoutDashboard /><span>{t("首页", "Dashboard")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={t("清单", "Checklist")} isActive={top === "checklist"} onClick={() => nav("/chinese/checklist")}>
                    <ListChecks /><span>{t("清单", "Checklist")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={t("复习", "Review")} isActive={top === "review"} onClick={() => nav("/chinese/review")}>
                    <RotateCcw /><span>{t("复习", "Review")}</span>
                  </SidebarMenuButton>
                  {zhDue ? <SidebarMenuBadge className="bg-destructive text-white rounded-full h-5 min-w-5 px-1.5" data-testid="zh-due">{zhDue}</SidebarMenuBadge> : null}
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={t("成绩", "Score")} isActive={top === "score"} onClick={() => nav("/chinese/score")}>
                    <Trophy /><span>{t("成绩", "Score")}</span>
                  </SidebarMenuButton>
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
                <SidebarMenuButton tooltip="Every word, with the questions that test it" isActive={top === "vocab"} onClick={() => nav("/vocab")} data-testid="nav-vocab">
                  <Library />
                  <span>Vocabulary</span>
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
        {/* On the Chinese side the same two, in Chinese: a page is one language
            at a time, and the world's nouns there are the plain words in WZ —
            placeholders until the world is named in Chinese by the people whose
            naming it is (docs/world.md § 12). */}
        <SidebarGroup data-testid="world-group">
          <SidebarGroupLabel>{isee ? W.world : t(WZ.world, W.world)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={isee ? W.homeTitle : t(WZ.homeTitle, W.homeTitle)} isActive={top === "base"} onClick={() => nav("/base")}>
                  <Blocks />
                  <span>{isee ? W.homeTitle : t(WZ.homeTitle, W.homeTitle)}</span>
                </SidebarMenuButton>
                <SidebarMenuBadge className="text-muted-foreground tabular-nums">{baseCounts().built}/{baseCounts().total}</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={isee ? "Rewards" : t(WZ.rewards, "Rewards")} isActive={top === "rewards"} onClick={() => nav("/rewards")}>
                  <Award />
                  <span>{isee ? "Rewards" : t(WZ.rewards, "Rewards")}</span>
                </SidebarMenuButton>
                {fresh ? <SidebarMenuBadge className="pointer-events-none" data-testid="rewards-new"><span className="bg-primary size-2 rounded-full" title={isee ? `${fresh} new badge${fresh === 1 ? "" : "s"}` : t(`${fresh} 个新徽章`, `${fresh} new badge${fresh === 1 ? "" : "s"}`)} /></SidebarMenuBadge> : null}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isee && zhLesson ? (
        <SidebarGroup data-testid="zh-subjects-group">
          <SidebarGroupLabel>{t("科目", "Subjects")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={zhLessonLabel(zhLesson)} isActive={top === "l"} onClick={() => nav("/chinese/l/" + zhLesson.id)}>
                  <BookOpen /><span>{t("课本", "Textbook")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t("练习册", "Workbook")} isActive={top === "workbook" || top === "ex" || top === "block"} onClick={() => nav("/chinese/workbook/" + zhLesson.id)}>
                  <PenLine /><span>{t("练习册", "Workbook")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t("听写", "Dictation")} isActive={top === "dictation"} onClick={() => nav("/chinese/dictation/" + zhLesson.id)}>
                  <Volume2 /><span>{t("听写", "Dictation")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t("阅读", "Reading")} isActive={top === "read"} onClick={() => nav("/chinese/read/" + zhLesson.id)}>
                  <BookMarked /><span>{t("阅读", "Reading")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        ) : null}
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
        <NavUser zh={!isee} />
      </SidebarFooter>
    </Sidebar>
  )
}
