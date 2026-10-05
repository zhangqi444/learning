import * as React from "react"

import { D, SUBJ, parseSetId, setId, setsFor } from "@/lib/content"
import { anotherLike, reviewItems, wordQuizItems } from "@/lib/engine"
import { go, lastCat, rememberCat, splitCat, useRoute } from "@/lib/router"
import { ChineseScreen } from "@/pages/chinese"
import { DRIVE_ENABLED, Store, useStore } from "@/lib/store"
import { Button } from "@zhangqi444/ui/ui/button"
import { AppShell } from "@zhangqi444/ui/app/app-shell"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SignIn, Splash } from "@/pages/signin"
import { Home } from "@/pages/home"
import { Subject } from "@/pages/subject"
import { Runner } from "@/pages/runner"
import { Review } from "@/pages/review"
import { Precision } from "@/pages/precision"
import { EssayList, EssayWeek } from "@/pages/essay"
import { MockCorrections, MockEssay, MockList, MockOverview, MockSection, OfflineMock } from "@/pages/mock"
import { Calendar } from "@/pages/calendar"
import { Checklist } from "@/pages/checklist"
import { Mixed, MixedRun } from "@/pages/mixed"
import { Score } from "@/pages/score"
import { Base } from "@/pages/base"
import { Quest } from "@/pages/quest"
import { Rewards } from "@/pages/rewards"
import { Books } from "@/pages/books"
import { Import } from "@/pages/import"
import { DriveSettings } from "@/pages/drive"

/** The queue is read once on mount, so finishing the run (which reschedules every item) keeps the score screen up. */
function ReviewRun({ sub, mode }) {
  const items = React.useMemo(() => reviewItems(sub, mode), [sub, mode])
  if (!items.length) return <Review />
  return <Runner items={items} custom ctx="review" resume={`review:${sub}:${mode || "due"}`} sub={sub} title={`${SUBJ[sub].name} · ${mode === "checkin" ? "Check-in" : "Review"}`} exitPath="/review" exitLabel="Back to review" />
}
function VocabRun({ wk }) {
  const items = React.useMemo(() => wordQuizItems(wk), [wk])
  if (!items.length) return <Precision key={wk} wk={wk} />
  return <Runner items={items} custom ctx="vocab" resume={"vocab:" + wk} sub="vr" title={`Precision words · ${wk} · quiz`} exitPath={`/precision/${wk}`} exitLabel="Back to the words" />
}

/** One more question on the skill she just missed.
 *
 *  `from` is the set she came out of, carried as a set id — "ma:W3:0" has
 *  colons and no slashes, so it survives a hash route that splits on "/" without
 *  any encoding. Without it there is nowhere honest to send her back to, because
 *  the new question is picked by skill and will often live in a different week
 *  from the one she was working in. */
function AgainRun({ id, from }) {
  const next = React.useMemo(() => anotherLike(id), [id])
  const back = React.useMemo(() => {
    if (!from) return next ? `/s/${next.sub}` : "/"
    if (D.mocks.some((m) => m.id === from)) return `/mock/${from}`
    const { sub, wk, n } = parseSetId(from)
    return SUBJ[sub] && wk ? `/run/${sub}/${wk}/${n}` : "/"
  }, [from, next])
  if (!next) {
    return (
      <div className="mx-auto mt-10 flex max-w-md flex-col gap-3 rounded-xl border bg-card p-6 text-center">
        <h2 className="text-lg font-semibold">No other question on this one yet</h2>
        <p className="text-muted-foreground text-sm">This skill has only the question you just did. The lesson on the score card is the thing to read instead.</p>
        <div className="flex justify-center"><Button variant="outline" onClick={() => go(back)}>Back</Button></div>
      </div>
    )
  }
  return (
    <Runner
      key={"again:" + next.it.id}
      items={[next.it]}
      custom
      ctx="again"
      sub={next.sub}
      title={`Another ${next.sk} question`}
      exitPath={back}
      exitLabel="Back to the set"
      /* so a second "try another" from here still knows the set she came out of */
      backTo={from}
    />
  )
}

function Screen({ route }) {
  // The category is the first segment (docs/chinese.md § 2). `isee` is stripped so
  // the ISEE routes below read as they always have; `chinese` has its own switch.
  const { cat, rest } = splitCat(route)
  if (cat === "chinese") return <ChineseScreen rest={rest} />
  const [top, a, b, c] = rest
  if (top === "s" && SUBJ[a]) return <Subject sub={a} wk={b} />
  if (top === "run" && SUBJ[a]) {
    const n = +c
    const set = setsFor(a, b)[n]
    if (set) {
      return (
        <Runner
          key={`run:${a}:${b}:${n}`}
          items={set}
          setId={setId(a, b, n)}
          prior={Store.s.results[setId(a, b, n)] || null}
          title={`${SUBJ[a].name} · ${b} · Set ${n + 1}`}
          exitPath={`/s/${a}/${b}`}
          exitLabel="Back to sets"
        />
      )
    }
  }
  if (top === "again" && a) return <AgainRun key={"again:" + a} id={a} from={b} />
  if (top === "review" && SUBJ[a]) return <ReviewRun key={`rev:${a}:${b || ""}`} sub={a} mode={b} />
  if (top === "review") return <Review />
  if (top === "precision" && a && D.precision[a] && b === "quiz") return <VocabRun key={"vocab:" + a} wk={a} />
  if (top === "precision" && a && D.precision[a]) return <Precision key={a} wk={a} />
  if (top === "mixed") return b === undefined && a === "run" ? <MixedRun key="mixed-run" /> : <Mixed />
  if (top === "score") return <Score />
  if (top === "base") return <Base />
  // /quest walks everything she has met; /quest/W3 walks one week's cats, which
  // is what the weekly plan and the precision page link to.
  if (top === "quest") return <Quest key={a || "all"} wk={a && D.precision[a] ? a : null} />
  if (top === "rewards") return <Rewards />
  if (top === "books") return <Books />
  if (top === "essay" && a && D.essay.weeks[a]) return <EssayWeek key={a} wk={a} />
  if (top === "essay") return <EssayList />
  if (top === "mock" && a && D.mocks.some((m) => m.id === a)) {
    if (b === "corrections") return <MockCorrections form={a} />
    if (b === "ESSAY") return <MockEssay key={a} form={a} />
    if (b) return <MockSection key={a + b} form={a} sec={b} />
    return <MockOverview form={a} />
  }
  if (top === "mock" && a && (D.offlineMocks || []).some((m) => m.id === a)) return <OfflineMock key={a} form={a} />
  if (top === "mock") return <MockList />
  if (top === "calendar") return <Calendar />
  if (top === "checklist") return a === "month" ? <Checklist month={b} /> : <Checklist wk={a} />
  if (top === "drive") return <DriveSettings />
  if (top === "import") return <Import key={a || ""} payload={a || ""} />
  return <Home />
}

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null } }
  static getDerivedStateFromError(err) { return { err } }
  componentDidCatch(err) { console.error(err) }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <div className="mx-auto mt-16 flex max-w-md flex-col gap-3 rounded-xl border bg-card p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">{String(this.state.err && this.state.err.message || this.state.err)}</p>
        <div className="flex justify-center gap-2">
          <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => location.reload()}>Reload</button>
          <button className="rounded-md bg-destructive px-3 py-1.5 text-sm text-white" onClick={() => { if (confirm("Clear the progress saved in this browser? Anything already in Google Drive is kept.")) { localStorage.removeItem("isee.v1"); location.reload() } }}>Clear local data</button>
        </div>
      </div>
    )
  }
}

export default function App() {
  const route = useRoute()
  const store = useStore()
  // Opening the site at `#/` lands on the half she used last — remembered in
  // localStorage only, because which half she opened is not learning evidence.
  // Only the first route of a session is redirected: after that `#/` is the ISEE
  // dashboard, or the switch to ISEE would bounce straight back to 中文, which is
  // what the first version of this did and the suite caught.
  const first = React.useRef(true)
  React.useEffect(() => {
    const opened = first.current; first.current = false
    if (!route.length && opened && lastCat() === "chinese") { go("/chinese"); return }
    rememberCat(splitCat(route).cat)
  }, [route])
  // Nothing renders until Google has said who this is. The offline artifact build
  // has no Drive at all, so it is never gated.
  if (DRIVE_ENABLED) {
    if (store.booting) return <Splash />
    if (!store.signedIn()) return <SignIn />
  }
  return (
    <AppShell
      sidebar={<AppSidebar variant="inset" route={route} />}
      header={<SiteHeader route={route} />}
      sidebarWidth="calc(var(--spacing) * 68)"
    >
      <ErrorBoundary key={route.join("/")}><Screen route={route} /></ErrorBoundary>
    </AppShell>
  )
}
