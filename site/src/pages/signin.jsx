import * as React from "react"
import { BookOpenCheck, Check, CloudOff, GraduationCap, Loader2, ShieldCheck, Smartphone } from "lucide-react"

import { DRIVE_ENABLED, Store, useStore } from "@/lib/store"
import { AuthBrand, AuthPoints, AuthScreen, GoogleButton } from "@zhangqi444/ui/app/auth-screen"
import { Glim } from "@/components/glim"
import { W } from "@/lib/world"


/** Shown while a stored session is being refreshed, so the sign-in page never flashes. */
export function Splash() {
  return (
    <div className="bg-background flex min-h-svh items-center justify-center" data-testid="splash">
      <div className="text-muted-foreground flex items-center gap-3 text-sm">
        <Loader2 className="size-4 animate-spin" /> Signing back in…
      </div>
    </div>
  )
}

const POINTS = [
  { icon: <ShieldCheck className="text-success mt-0.5 size-4 shrink-0" />, text: <>Her work is saved as one file in <strong>your own Google Drive</strong>. There is no server and no account to create.</> },
  { icon: <Check className="text-success mt-0.5 size-4 shrink-0" />, text: "The site can only see the folder it creates — nothing else in your Drive." },
  { icon: <Smartphone className="text-success mt-0.5 size-4 shrink-0" />, text: "Sign in on the laptop or the iPad and it is the same practice, in step." },
]

/**
 * The gate. Nothing else in the app renders until Google says who this is —
 * the same shape as zhangqi444/volunteer's auth screen.
 */
export function SignIn() {
  const store = useStore()
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState("")
  const returning = !!store.s.driveGranted

  function connect() {
    setBusy(true); setErr("")
    Store.signIn()
      .catch((e) => setErr(String((e && e.message) || e)))
      .finally(() => setBusy(false))
  }

  return (
    <AuthScreen data-testid="signin-page">
      <AuthBrand
        icon={
          <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl">
            <GraduationCap className="size-5" />
          </span>
        }
        name="Sheila · ISEE"
      >
          {/* A cat waiting at the door.
           *
           * docs/cats.md §8 allows the sign-in page exactly one thing and forbids
           * the obvious use of it: "a cat may wait at the door; nothing may be
           * promised." So there is no count, no "sign in to meet them", no
           * silhouette of a shelf — anything that makes the animals a reason to
           * sign in would be promising, and this is the one page seen before a
           * single thing has been earned.
           *
           * It is drawn Unseen, which is not a decoration of the emptiness but
           * the literal reading of the world bible's own first line about cats:
           * one that does not know you keeps its distance and watches from
           * somewhere high. Standing outside the door, it does not know her yet.
           * The stage does the rest by itself — glim.jsx draws an Unseen cat
           * small, high in its box and nearly all eyes — so this says the true
           * thing without a word of copy to promise anything with.
           *
           * The word is the world's own name, so it is the same cat on every
           * device and every visit, and it is nobody's: not one of hers, which
           * she has not earned yet, and not one she will later be given.
           *
           * Drawn at size-16 and not the size-10 it was first given. An Unseen
           * cat is two eyes and a shadow, and at forty pixels there is not enough
           * of it for that to read as an animal at all — on the dark page it came
           * out as two faint dots beside the wordmark. The suite was perfectly
           * happy, because the stage and the distance were exactly right; it was
           * only wrong in the screenshot, which is what that habit is for. */}
        <Glim word={W.world} stage="Unseen" className="size-16" title={`A ${W.cat} at the door`} />
      </AuthBrand>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {returning ? "Welcome back." : "Everything for the ISEE, in one place."}
        </h1>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          {returning
            ? "Sign in again to pick up where she left off. Her work is in your Google Drive, exactly as she left it."
            : "Practice sets, the review pile, precision words, essays and full mock exams — with her progress kept in your own Google Drive."}
        </p>
      </div>

      <AuthPoints items={POINTS} />

      <div className="flex flex-col gap-3">
        <GoogleButton busy={busy} markClassName="size-[18px]" onClick={connect} data-testid="signin-google">
          {busy ? "Waiting for Google…" : "Sign in with Google"}
        </GoogleButton>
        {err ? (
          <p className="text-destructive flex items-start gap-2 text-sm" data-testid="signin-error">
            <CloudOff className="mt-0.5 size-4 shrink-0" /> {err}
          </p>
        ) : null}
        <p className="text-muted-foreground text-xs leading-relaxed">
          Signing in opens a Google window asking to see your name and email, and to manage the files this site creates in Drive. You can disconnect at any time from the account menu.
        </p>
      </div>

      <div className="text-muted-foreground flex items-center gap-2 border-t pt-4 text-xs">
        <BookOpenCheck className="size-3.5 shrink-0" />
        ISEE Lower Level · eight-week plan · {DRIVE_ENABLED ? "your work stays in your Drive" : "offline copy"}
      </div>
    </AuthScreen>
  )
}
