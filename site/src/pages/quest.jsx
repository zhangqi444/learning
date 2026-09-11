import * as React from "react"
import { ArrowRight, Home, RotateCcw, Wand2 } from "lucide-react"

import { buildRun, cast } from "@/lib/quest"
import { go } from "@/lib/router"
import { useStore } from "@/lib/store"
import { syncBadges } from "@/lib/rewards"
import { cn } from "@/lib/utils"
import { W, atLeast } from "@/lib/world"

/** Meanings in the content sometimes end in a full stop and sometimes do not,
 *  so add one here rather than printing "demanding..". */
const sentence = (t) => String(t || "").trim().replace(/\.*$/, "") + "."
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Burst } from "@/components/burst"
import { Gate } from "@/components/gate"
import { Glim } from "@/components/glim"
import { WORD_GLOW } from "@/lib/glim"
import { wordStatus } from "@/lib/engine"
import { sfx } from "@/lib/sfx"

export function Quest({ wk = null }) {
  useStore()
  // local calendar day, so the day's gates are the same all day and a reload
  // cannot reroll a hard gate into an easy one
  const day = React.useMemo(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }, [])
  // A week-scoped walk seeds off the week too, so W3's five gates are not the
  // same five the whole wood would have given today.
  const run = React.useMemo(() => buildRun(wk ? `${day}:${wk}` : day, 5, wk ? [wk] : null), [day, wk])
  const [i, setI] = React.useState(0)
  const [result, setResult] = React.useState(null)
  const [right, setRight] = React.useState(0)
  const [done, setDone] = React.useState(false)
  const [won, setWon] = React.useState([])
  // who actually came, in the order they came, for the card at the end
  const [came, setCame] = React.useState([])
  const started = React.useRef(Date.now())

  const g = run[i]

  if (!run.length) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Card className="items-center py-12 text-center">
          <CardHeader className="items-center">
            <Wand2 className="text-primary mb-2 size-8" />
            <CardTitle>{wk ? `Not enough ${W.cats} from ${wk} yet` : `No ${W.cats} yet`}</CardTitle>
            <CardDescription>
              {wk
                ? `A walk needs six ${W.cats} you have met, and ${wk} has not given up that many yet. Write its precision words in your own words and come back.`
                : `${W.wood} fills up as you meet words. Write this week\u2019s precision words in your own words and they will be here.`}
            </CardDescription>
          </CardHeader>
          {wk ? (
            <CardContent>
              <Button variant="outline" onClick={() => go("/quest")} data-testid="quest-all">Walk the whole {W.woodTitle} instead</Button>
            </CardContent>
          ) : null}
        </Card>
      </div>
    )
  }

  // Who is standing at the gate. A cat that came when called is drawn at the
  // brightness the engine really reports for that word — no flattery — and a
  // cat that came by mistake is drawn Steady, because it is a perfectly real
  // cat and she did in fact call it.
  // The brightness is read from the ENTRY the gate belongs to, not from the name
  // on the chip: "elaborate" has no record of its own, "elaborate / intricate"
  // does, and asking the wrong one drew every cluster cat at the same flat
  // Steady no matter how well she knew it.
  const arrival = !result
    ? null
    : result.ok
      ? { word: g.word, stage: atLeast(WORD_GLOW[wordStatus(g.answer.word).status]) }
      : { word: result.chosen.word, stage: "Steady" }

  function choose(word) {
    if (result) return
    const r = cast(g, word, Date.now() - started.current)
    setResult(r)
    // the name she called, and the entry it belongs to — the first is who she
    // sees and hears, the second is where the record that says how well she
    // knows it actually lives
    if (r.ok) { setRight((n) => n + 1); setCame((list) => [...list, { word: g.word, key: g.answer.word }]) }
    // the cat that actually turned up is the one that speaks — right or wrong,
    // she hears *who* came before she reads why
    sfx(r.ok ? "call" : "miscall", r.chosen ? r.chosen.word : word)
  }

  function next() {
    if (i + 1 >= run.length) {
      setWon(syncBadges())
      setDone(true)
      // the run's own tune: the cats that came, in the order they came
      sfx("chorus", came.map((c) => c.word))
      return
    }
    setI(i + 1); setResult(null); started.current = Date.now()
  }

  function again() {
    setI(0); setResult(null); setRight(0); setDone(false); setWon([]); setCame([]); started.current = Date.now()
  }

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Card className="from-primary/5 to-card relative items-center bg-gradient-to-t text-center" data-testid="quest-done">
          <Burst seed={right} />
          <CardHeader className="w-full">
            <CardDescription>{W.wood}{wk ? ` · ${wk}` : ""} · today's gates</CardDescription>
            <CardTitle className="text-4xl font-extrabold tabular-nums">{right} / {run.length}</CardTitle>
            <CardDescription className="text-base">
              {right === run.length ? "Every one came first time." : `Every ${W.cat} that came is a word you can use. The ones that stayed out are waiting at the door.`}
            </CardDescription>
            {came.length ? (
              <div className="mt-3 flex flex-wrap justify-center gap-2" data-testid="came">
                {came.map((c) => (
                  <figure key={c.word} className="flex w-16 flex-col items-center gap-0.5">
                    <Glim word={c.word} stage={atLeast(WORD_GLOW[wordStatus(c.key).status])} className="size-12" title={c.word} />
                    <figcaption className="w-full truncate text-[11px] font-semibold">{c.word}</figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
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
          <span className="font-medium">{W.woodTitle}{wk ? ` · ${wk}` : ""}</span>
          <span className="tabular-nums" data-testid="quest-counter">Gate {i + 1} / {run.length}</span>
        </div>
        <Progress value={(i / run.length) * 100} className="h-1.5" />
      </div>

      <Card className="gap-5">
        <CardContent className="flex flex-col gap-5">
          {/* the gate, and whoever walked through it. On a right call that is
              her cat, at the brightness the engine really says it has; on a
              wrong one it is the cat she actually named, drawn in full, because
              the point of the mistake is that somebody definitely came. */}
          <div className="relative mx-auto w-full max-w-sm">
            <Gate open={!!(result && result.ok)} glow={!arrival} className="w-full" />
            {arrival ? (
              <Glim
                key={arrival.word}
                word={arrival.word}
                stage={arrival.stage}
                title={`${arrival.word} came to the gate`}
                className="motion-safe:animate-[pop_420ms_cubic-bezier(.34,1.56,.64,1)_both] absolute top-[66%] left-1/2 size-24 -translate-x-1/2 -translate-y-1/2"
              />
            ) : null}
          </div>

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
                  <p className="text-success font-bold">It comes when you call.</p>
                  <p className="mt-1"><b>{g.word}</b> — {sentence(result.answer.meaning)}</p>
                  {result.answer.usage ? <p className="text-muted-foreground mt-1">{result.answer.usage}</p> : null}
                </>
              ) : (
                <>
                  {/* the wrong spell still does something — what THAT word means */}
                  <p className="text-destructive font-bold">You called <b>{result.chosen.word}</b>, so that is who turned up — {sentence(result.meaning)}</p>
                  <p className="mt-1">Not the one the sentence wanted. It was after <b>{g.word}</b>: {sentence(result.answer.meaning)}</p>
                </>
              )}
            </div>
          ) : null}

          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">Names you know</p>
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
                    {/* every name is a face: after a fortnight she knows the
                        ginger tabby is `stifle` before she has read the chip.
                        Drawn at full brightness here on purpose — the hand is a
                        set of controls, and a dim chip would both be a tell and
                        read as broken. The honest gradient is in the Glimbook. */}
                    <Glim word={s.word} stage="Steady" className="size-8" title={s.word} />
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
            <p className="text-muted-foreground text-center text-xs">Call the name the sentence is missing. Call the wrong one and the wrong {W.cat} comes.</p>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-center text-xs">
        Every call counts as real vocabulary practice — the same evidence the word quiz gives, feeding the same mastery and the same door.
      </p>
    </div>
  )
}
