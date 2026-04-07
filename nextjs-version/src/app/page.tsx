"use client"

import Link from "next/link"
import { GraduationCap, BookOpen, Star, Users, ArrowRight, CheckCircle, Globe, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">ET</div>
            <span className="font-bold text-lg">EthioTutor</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register/student">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center">
        <Badge variant="secondary" className="mb-4 text-xs px-3">
          🇪🇹 Ethiopia's #1 Online Tutoring Platform
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Learn from the{" "}
          <span className="text-primary">Best Tutors</span>
          <br />in Ethiopia
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Connect with expert tutors for Mathematics, Science, English and more.
          Book live sessions, track your progress, and ace your exams.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="gap-2 text-base px-8 h-12 shadow-lg" asChild>
            <Link href="/register/student">
              <GraduationCap className="size-5" />
              Register as Student
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12" asChild>
            <Link href="/register/tutor">
              <BookOpen className="size-5" />
              Become a Tutor
            </Link>
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/dashboard" className="underline underline-offset-4 hover:text-foreground">
            Sign in here
          </Link>
        </p>
      </section>

      {/* ── STATS ───────────────────────────────────────── */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "500+",  label: "Expert Tutors",      icon: Users },
            { value: "4.8★",  label: "Average Rating",     icon: Star },
            { value: "10k+",  label: "Students Helped",    icon: GraduationCap },
            { value: "12+",   label: "Subjects Covered",   icon: BookOpen },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon className="size-6 text-primary" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">How EthioTutor Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From signup to your first session in under 5 minutes.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Create Your Profile", desc: "Tell us about yourself, your grade, and your learning goals in a quick 2-minute setup.", icon: GraduationCap },
            { step: "02", title: "Browse & Book",       desc: "Find the right tutor by subject, grade, price, and rating. Book a slot in one click.", icon: BookOpen },
            { step: "03", title: "Learn & Grow",        desc: "Join live online sessions, take notes, and track your progress over time.", icon: Award },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="flex flex-col items-center text-center gap-4 rounded-2xl border p-8 bg-card hover:shadow-md transition-shadow">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-7" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">STEP {step}</p>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SUBJECTS ────────────────────────────────────── */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Popular Subjects</h2>
            <p className="text-muted-foreground">Expert tutors available for all major subjects</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {["Mathematics", "Physics", "Chemistry", "Biology", "English", "History", "Geography", "Amharic", "Civics", "ICT"].map((sub) => (
              <Badge key={sub} variant="outline" className="text-sm px-4 py-2 rounded-xl hover:bg-primary hover:text-primary-foreground cursor-default transition-colors">
                {sub}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ETHIOTUTOR ──────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Why Students Choose EthioTutor</h2>
            <div className="space-y-4">
              {[
                "Live 1-on-1 and group sessions with expert tutors",
                "Affordable pricing starting from 120 ETB/hour",
                "Subjects aligned with Ethiopian national curriculum",
                "Session recordings for Pro plan users",
                "Track progress and access session notes",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-muted-foreground text-sm">{item}</p>
                </div>
              ))}
            </div>
            <Button className="mt-8 gap-2" asChild>
              <Link href="/register/student">
                Start Learning Today <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Globe,        title: "100% Online",       desc: "Learn from anywhere in Ethiopia" },
              { icon: Star,         title: "Rated 4.8/5",       desc: "By 10,000+ happy students" },
              { icon: Award,        title: "Certified Tutors",  desc: "All tutors are verified experts" },
              { icon: GraduationCap, title: "All Grades",       desc: "Grade 5 through Grade 12" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border bg-card p-5 space-y-2">
                <Icon className="size-6 text-primary" />
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────── */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Join thousands of Ethiopian students improving their grades with EthioTutor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="gap-2 px-8" asChild>
              <Link href="/register/student">
                <GraduationCap className="size-5" />
                Register as Student
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/register/tutor">
                <BookOpen className="size-5" />
                Become a Tutor
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} EthioTutor · Connecting students with great teachers across Ethiopia.
        </div>
      </footer>
    </div>
  )
}
