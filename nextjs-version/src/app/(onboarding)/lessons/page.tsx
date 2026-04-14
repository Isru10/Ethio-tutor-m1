"use client"

import * as React from "react"
import { 
  PageHeader, 
  SectionContainer, 
  ProgressStepper, 
  LessonCard, 
  ProgressCard, 
  ContinueLearningCard,
  type LessonStatus
} from "@/components/onboarding/onboarding-components"

type Lesson = {
  id: string
  title: string
  description: string
  duration: number
  category: string
  status: LessonStatus
}

const initialLessons: Lesson[] = [
  // Module 1: Getting Started
  {
    id: "l1",
    title: "Platform Overview",
    description: "Learn the basics of how EthioTutor works and what to expect as a new tutor.",
    duration: 5,
    category: "Getting Started",
    status: "completed",
  },
  {
    id: "l2",
    title: "Setting Up Your Workspace",
    description: "Best practices for your teaching environment, lighting, and technical requirements.",
    duration: 8,
    category: "Getting Started",
    status: "completed",
  },
  // Module 2: Profile Optimization
  {
    id: "l3",
    title: "Crafting a Winning Bio",
    description: "How to write a professional biography that attracts students and parents.",
    duration: 10,
    category: "Profile Optimization",
    status: "in_progress",
  },
  {
    id: "l4",
    title: "The Perfect Intro Video",
    description: "Tips for recording a high-impact introduction video that builds trust immediately.",
    duration: 12,
    category: "Profile Optimization",
    status: "not_started",
  },
  // Module 3: Teaching Best Practices
  {
    id: "l5",
    title: "Lesson Planning 101",
    description: "Structure your sessions for maximum student engagement and learning outcomes.",
    duration: 15,
    category: "Teaching Best Practices",
    status: "not_started",
  },
  {
    id: "l6",
    title: "Using the Virtual Classroom",
    description: "A deep dive into our whiteboards, screen sharing, and interactive tools.",
    duration: 20,
    category: "Teaching Best Practices",
    status: "not_started",
  },
  // Module 4: Growth & Monetization
  {
    id: "l7",
    title: "Managing Recurrent Bookings",
    description: "Turn one-off trials into long-term learning relationships.",
    duration: 10,
    category: "Growth & Monetization",
    status: "not_started",
  },
  {
    id: "l8",
    title: "Pricing for Your Market",
    description: "Strategic advice on setting rates that reflect your expertise and demand.",
    duration: 7,
    category: "Growth & Monetization",
    status: "not_started",
  },
]

const onboardingSteps = [
  { title: "Training", status: "current" as const },
  { title: "Our Values", status: "upcoming" as const },
  { title: "Niches", status: "upcoming" as const },
  { title: "Review", status: "upcoming" as const },
]

export default function LessonsPage() {
  const [lessons, setLessons] = React.useState<Lesson[]>(initialLessons)
  
  const completedCount = lessons.filter(l => l.status === "completed").length
  const totalCount = lessons.length
  const percentage = Math.round((completedCount / totalCount) * 100)
  
  const nextLesson = lessons.find(l => l.status === "in_progress") || lessons.find(l => l.status === "not_started")

  const categories = Array.from(new Set(lessons.map(l => l.category)))

  return (
    <SectionContainer>
      <ProgressStepper steps={onboardingSteps} />
      
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full space-y-8">
          <PageHeader 
            title="Onboarding Lessons" 
            description="Master the EthioTutor platform with our structured learning path designed for top-tier educators."
            className="px-0 mb-4"
          />

          {nextLesson && (
            <ContinueLearningCard
              lessonTitle={nextLesson.title}
              lessonDescription={nextLesson.description}
              duration={nextLesson.duration}
              onClick={() => console.log("Starting lesson:", nextLesson.id)}
            />
          )}

          <div className="space-y-12 pb-12">
            {categories.map((category) => (
              <div key={category} className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                  <h2 className="text-xl font-bold tracking-tight">{category}</h2>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {lessons.filter(l => l.category === category && l.status === "completed").length} / {lessons.filter(l => l.category === category).length} DONE
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lessons
                    .filter(l => l.category === category)
                    .map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        title={lesson.title}
                        description={lesson.description}
                        duration={lesson.duration}
                        status={lesson.status}
                        isActive={lesson.id === nextLesson?.id}
                        onClick={() => console.log("Lesson clicked:", lesson.id)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="w-full lg:w-80 space-y-6 lg:sticky lg:top-24">
          <ProgressCard 
            completed={completedCount}
            total={totalCount}
            percentage={percentage}
          />
          
          <div className="rounded-2xl bg-accent/50 p-6 border border-border">
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider">Quick Tips</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>Completion of all lessons gives you a 15% visibility boost.</span>
              </li>
              <li className="flex gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>You can resume any lesson exactly where you left off.</span>
              </li>
              <li className="flex gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>Most tutors finish onboarding in less than 2 hours.</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </SectionContainer>
  )
}
