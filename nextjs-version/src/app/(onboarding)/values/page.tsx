"use client"

import * as React from "react"
import { 
  ShieldCheck, 
  Sparkles, 
  Users2, 
  Zap, 
  GraduationCap, 
  HeartHandshake 
} from "lucide-react"
import { 
  PageHeader, 
  SectionContainer, 
  InfoCard, 
  ProgressStepper, 
  CallToAction 
} from "@/components/onboarding/onboarding-components"

const onboardingSteps = [
  { title: "Training", status: "complete" as const },
  { title: "Our Values", status: "current" as const },
  { title: "Niches", status: "upcoming" as const },
  { title: "Review", status: "upcoming" as const },
]

const values = [
  {
    title: "Student-First Mindset",
    description: "Our primary goal is to ensure every student succeeds. We prioritize student outcomes over everything else, tailoring our teaching to their unique needs and learning styles.",
    icon: GraduationCap,
  },
  {
    title: "Unwavering Integrity",
    description: "Trust is the foundation of our community. We expect honesty, punctuality, and professionalism in every interaction between tutors, students, and parents.",
    icon: ShieldCheck,
  },
  {
    title: "Committment to Excellence",
    description: "Good isn't enough. We strive for excellence in our teaching methods, our subject matter expertise, and the way we represent the EthioTutor brand.",
    icon: Sparkles,
  },
  {
    title: "Radical Empathy",
    description: "Learning can be challenging. We meet our students where they are, showing patience and understanding during their most difficult academic moments.",
    icon: HeartHandshake,
  },
  {
    title: "Continuous Growth",
    description: "The best tutors are also the best learners. We encourage our tutor community to constantly refine their skills and stay updated with the latest educational trends.",
    icon: Zap,
  },
  {
    title: "Inclusive Community",
    description: "We celebrate diversity in all its forms. Our platform is a safe space for everyone to learn, grow, and succeed regardless of their background.",
    icon: Users2,
  }
]

export default function ValuesPage() {
  return (
    <SectionContainer>
      <ProgressStepper steps={onboardingSteps} />
      
      <PageHeader 
        title="Our Core Philosophy" 
        description="At EthioTutor, we believe that education is the most powerful tool for change. Our values guide every decision we make and every lesson we teach."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {values.map((value, idx) => (
          <div key={value.title} className="transition-all duration-700 delay-[idx*100ms] animate-in fade-in slide-in-from-bottom-4">
            <InfoCard
              title={value.title}
              description={value.description}
              icon={value.icon}
              className="h-full"
            />
          </div>
        ))}
      </div>

      <CallToAction 
        title="Ready to find your niche?" 
        description="Knowing our values is only half the battle. Now, let's see where your expertise can make the most impact."
        buttonText="Next: Preferred Niches"
        href="/preferred"
        className="mt-16"
      />
    </SectionContainer>
  )
}
