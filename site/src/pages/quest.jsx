import * as React from "react"
import { ArrowRight, Home, RotateCcw, Wand2 } from "lucide-react"

import { buildRun, cast } from "@/lib/quest"
import { go } from "@/lib/router"
import { useStore } from "@/lib/store"
import { syncBadges } from "@/lib/rewards"
import { cn } from "@/lib/utils"

/** Meanings in the content sometimes end in a full stop and sometimes do not,
 *  so add one here rather than printing "demanding..". */
const sentence = (t) => String(t || "").trim().replace(/\.*$/, "") + "."
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Burst } from "@/components/burst"
import { Gate } from "@/components/gate"
import { sfx } from "@/lib/sfx"

export function Quest() {
  useStore()
  // local calendar day, so the day's gates are the same all day and a reload
  // cannot reroll a hard gate into an easy one
  const day = React.useMemo(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }, [])
  const run = React.useMemo(() => buildRun(day, 5), [day])
  const [i, setI] = React.useState(0)
  const [result, setResult] = React.useState(null)
  const [right, setRight] = React.useState(0)
  const [done, setDone] = React.useState(false)
  const [won, setWon] = React.useState([])
  const started = React.useRef(Date.now())

  const g = run[i]

  if (!run.length) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Card className="items-center py-12 text-center">
          <CardHeader className="items-center">
            <Wand2 className="text-primary mb-2 size-8" />
            <CardTitle>No spells yet</CardTitle>
            <CardDescription>The Wordkeep opens once the vocabulary lists are loaded.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  function choose(word) {
    if (result) return
    const r = cast(g, word, Date.now() - started.current)
    setResult(r)
    if (r.ok) setRight((n) => n + 1)
    sfx(r.ok ? "right" : "wrong")
  }

  function next() {
    if (i + 1 >= run.length) {
      setWon(syncBadges())
      setDone(true)
      sfx("finish")
      return
    }
    setI(i + 1); setResult(null); started.current = Date.now()
  }

  function again() {
    setI(0); setResult(null); setRight(0); setDone(false); setWon([]); started.current = Date.now()
  }

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Card className="from-primary/5 to-card relative items-center bg-gradient-to-t text-center" data-testid="quest-done">
          <Burst seed={right} />
          <CardHeader className="w-full">
            <CardDescription>Wordkeep · today's gates</CardDescription>
            <CardTitle className="text-4xl font-extrabold tabular-nums">{right} / {run.length}</CardTitle>
            <CardDescription className="text-base">
              {right === run.length ? "Every gate opened first time." : "Every gate you opened is a word you can use. The ones that fought back are in your review pile now."}
            </CardDescription>
            {won.length ? <div className="text-primary mt-2 text-sm font-bold">New badge: {won.map((b) => b.name).join(" · ")}</div> : null}
          </CardHeader>
          <CardContent className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={again}><RotateCcw /> Walk it again</Button>
            <Button onClick={() => go("/")}><Home /> Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
          <span className="font-medium">Wordkeep</span>
          <span className="tabular-nums" data-testid="quest-counter">Gate {i + 1} / {run.length}</span>
        </div>
        <Progress value={(i / run.length) * 100} className="h-1.5" />
      </div>

      <Card className="gap-5">
        <CardContent className="flex flex-col gap-5">
          <Gate open={!!(result && result.ok)} className="mx-auto w-full max-w-sm" />

          <div className="text-center">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">The gate is inscribed</p>
            <p className="mt-2 text-lg leading-relaxed font-medium" data-testid="inscription">{g.text}</p>
          </div>

          {result ? (
            <div
              className={cn(
                "motion-safe:animate-[pop_260ms_ease-out_both] rounded-xl border-2 p-4 text-sm leading-relaxed",
                result.ok ? "border-success bg-success-soft" : "border-destructive bg-destructive/10"
              )}
              data-testid="cast-result"
            >
              {result.ok ? (
                <>
                  <p className="text-success font-bold">The gate opens.</p>
                  <p className="mt-1"><b>{g.word}</b> — {sentence(result.answer.meaning)}</p>
                  {result.answer.usage ? <p className="text-muted-foreground mt-1">{result.answer.usage}</p> : null}
                </>
              ) : (
                <>
                  {/* the wrong spell still does something — what THAT word means */}
                  <p className="text-destructive font-bold">You cast <b>{result.chosen.word}</b> — that means {sentence(result.meaning)}</p>
                  <p className="mt-1">Not what the inscription asked for, so the gate holds. It wanted <b>{g.word}</b>: {sentence(result.answer.meaning)}</p>
                </>
              )}
            </div>
          ) : null}

          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">Your spells</p>
            <div className="grid grid-cols-2 gap-2 @md/main:grid-cols-3" data-testid="spellbook">
              {g.hand.map((s) => {
                const isAnswer = s.word.toLowerCase() === g.word.toLowerCase()
                const picked = result && result.chosen && result.chosen.word === s.word
                return (
                  <Button
                    key={s.word}
                    variant="outline"
                    disabled={!!result}
                    onClick={() => choose(s.word)}
                    data-testid="spell"
                    data-word={s.word}
                    className={cn(
                      "h-auto justify-start px-3 py-2.5 text-left",
                      result && isAnswer && "!border-success !bg-success-soft",
                      result && picked && !isAnswer && "!border-destructive !bg-destructive/10"
                    )}
                  >
                    <span className="flex flex-col items-start gap-0.5">
                      <span className="font-bold">{s.word}</span>
                      {s.pos ? <span className="text-muted-foreground text-[11px] font-normal">{s.pos}</span> : null}
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>

          {result ? (
            <div className="flex justify-end">
              <Button onClick={next} data-testid="quest-next">{i + 1 >= run.length ? "Finish" : "Walk on"} <ArrowRight /></Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-center text-xs">Cast the word the sentence is missing. A wrong spell still does something.</p>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-center text-xs">
        Every cast counts as real vocabulary practice — the same evidence the word quiz gives, feeding the same mastery and review pile.
      </p>
    </div>
  )
}
