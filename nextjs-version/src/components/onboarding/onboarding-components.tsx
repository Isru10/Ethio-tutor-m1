"use client"

import * as React from "react"
import { type LucideIcon, CheckCircle2, ChevronRight, Info, Clock, PlayCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2 px-4 lg:px-6 mb-8", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-lg text-muted-foreground max-w-[700px]">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}

interface SectionContainerProps {
  children: React.ReactNode
  className?: string
}

export function SectionContainer({ children, className }: SectionContainerProps) {
  return (
    <div className={cn("px-4 lg:px-6 flex flex-col gap-8 pb-12", className)}>
      {children}
    </div>
  )
}

interface InfoCardProps {
  title: string
  description: string
  icon?: LucideIcon
  className?: string
}

export function InfoCard({ title, description, icon: Icon, className }: InfoCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border bg-card shadow-md transition-all hover:shadow-lg", className)}>
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        {Icon && (
          <div className="rounded-full bg-primary/10 p-2.5 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <CardTitle className="text-xl font-semibold leading-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}

interface FeatureCardProps {
  title: string
  description: string
  icon: LucideIcon
  badge?: string
  className?: string
}

export function FeatureCard({ title, description, icon: Icon, badge, className }: FeatureCardProps) {
  return (
    <Card className={cn("group flex flex-col justify-between border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50", className)}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="rounded-xl bg-accent p-3 text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="h-6 w-6" />
          </div>
          {badge && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  )
}

interface AnalyticsCardProps {
  title: string
  subtitle?: string
  value?: string | number
  trend?: {
    label: string
    value: string
    isUp: boolean
  }
  children?: React.ReactNode
  className?: string
}

export function AnalyticsCard({ title, subtitle, value, trend, children, className }: AnalyticsCardProps) {
  return (
    <Card className={cn("border-border bg-card shadow-md", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full", trend.isUp ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400")}>
              <span>{trend.value}</span>
              <span>{trend.label}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {value && <div className="text-3xl font-bold mb-4">{value}</div>}
        {children}
      </CardContent>
    </Card>
  )
}

interface ProgressStepperProps {
  steps: {
    title: string
    status: "complete" | "current" | "upcoming"
  }[]
  className?: string
}

export function ProgressStepper({ steps, className }: ProgressStepperProps) {
  const currentStepIndex = steps.findIndex(s => s.status === "current")
  const progress = ((steps.filter(s => s.status === "complete").length) / steps.length) * 100

  return (
    <div className={cn("w-full space-y-4 px-4 lg:px-6 mb-12", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Onboarding Progress</span>
        <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex flex-wrap gap-4 mt-6">
        {steps.map((step, idx) => (
          <div key={step.title} className="flex items-center gap-2">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all", 
              step.status === "complete" ? "border-primary bg-primary text-primary-foreground" : 
              step.status === "current" ? "border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] scale-110" : 
              "border-muted text-muted-foreground")}>
              {step.status === "complete" ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
            </div>
            <span className={cn("text-xs font-medium", step.status === "current" ? "text-primary" : "text-muted-foreground")}>
              {step.title}
            </span>
            {idx < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 hidden sm:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted p-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Info className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="mb-6 max-w-[400px] text-muted-foreground">{description}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}

interface CallToActionProps {
  title: string
  description: string
  buttonText: string
  href: string
  className?: string
}

export function CallToAction({ title, description, buttonText, href, className }: CallToActionProps) {
  return (
    <section className={cn("relative overflow-hidden rounded-3xl bg-primary px-8 py-10 text-primary-foreground shadow-2xl", className)}>
      <div className="relative z-10 flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
          <p className="text-primary-foreground/80 max-w-[600px]">{description}</p>
        </div>
        <Button asChild size="lg" variant="secondary" className="px-8 font-bold shadow-lg shadow-black/20 hover:scale-105 transition-transform">
          <a href={href}>{buttonText}</a>
        </Button>
      </div>
      {/* Subtle background decoration */}
      <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
    </section>
  )
}

export type LessonStatus = "not_started" | "in_progress" | "completed"

export function StatusBadge({ status }: { status: LessonStatus }) {
  const configs = {
    not_started: { label: "Not Started", className: "bg-muted text-muted-foreground border-transparent" },
    in_progress: { label: "In Progress", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
    completed: { label: "Completed", className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
  }

  const { label, className } = configs[status]

  return (
    <Badge variant="outline" className={cn("font-medium", className)}>
      {status === "in_progress" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {status === "completed" && <CheckCircle2 className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  )
}

interface LessonCardProps {
  title: string
  description: string
  duration: string | number
  status: LessonStatus
  onClick?: () => void
  isActive?: boolean
}

export function LessonCard({ title, description, duration, status, onClick, isActive }: LessonCardProps) {
  return (
    <Card 
      className={cn(
        "group cursor-pointer border-2 transition-all duration-300 hover:shadow-lg",
        status === "completed" ? "bg-accent/30 border-green-500/20" : "bg-card hover:border-primary/50 shadow-sm",
        isActive ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{title}</CardTitle>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
      </CardContent>
      <CardFooter className="pt-0 border-t bg-muted/30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Clock className="h-3.5 w-3.5" />
          <span>{duration} min</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span>{status === "completed" ? "View Again" : status === "in_progress" ? "Continue" : "Start"}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </CardFooter>
    </Card>
  )
}

interface ProgressCardProps {
  completed: number
  total: number
  percentage: number
  className?: string
}

export function ProgressCard({ completed, total, percentage, className }: ProgressCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border bg-card shadow-md", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Your Course Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between mb-2">
          <div className="flex flex-col">
            <span className="text-3xl font-bold">{percentage}%</span>
            <span className="text-sm text-muted-foreground">{completed} of {total} lessons completed</span>
          </div>
          <div className="h-12 w-12 rounded-full border-4 border-primary/10 border-t-primary flex items-center justify-center">
             <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
        </div>
        <Progress value={percentage} className="h-2 mt-4" />
      </CardContent>
    </Card>
  )
}

interface ContinueLearningCardProps {
  lessonTitle: string
  lessonDescription: string
  duration: string | number
  onClick: () => void
  disabled?: boolean
}

export function ContinueLearningCard({ lessonTitle, lessonDescription, duration, onClick, disabled }: ContinueLearningCardProps) {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-primary/5 shadow-xl border-2">
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
        <div className="shrink-0 rounded-2xl bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/20">
          <PlayCircle className="h-8 w-8" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
             <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-bold">NEXT LESSON</Badge>
             <span className="text-xs text-muted-foreground flex items-center gap-1">
               <Clock className="h-3 w-3" /> {duration} min
             </span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight">{lessonTitle}</h3>
          <p className="text-muted-foreground max-w-[600px]">{lessonDescription}</p>
        </div>
        <Button 
          onClick={onClick} 
          disabled={disabled}
          size="lg" 
          className="w-full md:w-auto px-8 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          Continue Learning
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      {/* Decorative background element */}
      <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
    </Card>
  )
}
