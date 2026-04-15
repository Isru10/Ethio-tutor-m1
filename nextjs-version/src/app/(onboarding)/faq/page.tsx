"use client"

import * as React from "react"
import { 
  Search, 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  PhoneCall,
  ChevronDown
} from "lucide-react"
import { 
  PageHeader, 
  SectionContainer, 
  ProgressStepper, 
  CallToAction 
} from "@/components/onboarding/onboarding-components"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const onboardingSteps = [
  { title: "Training", status: "complete" as const },
  { title: "Our Values", status: "complete" as const },
  { title: "Niches", status: "complete" as const },
  { title: "Review", status: "current" as const },
]

const faqCategories = [
  {
    name: "Payments & Earnings",
    questions: [
      {
        q: "How often do I get paid?",
        a: "Tutors are paid bi-weekly for all completed sessions. You can track your pending and processed earnings in the 'Earnings' section of your dashboard."
      },
      {
        q: "How does the platform commission work?",
        a: "EthioTutor takes a 15% service fee on every session. This helps us maintain the platform, handle marketing, and provide 24/7 support for both tutors and students."
      },
      {
        q: "Can I set my own hourly rate?",
        a: "Yes! You have full control over your pricing. We provide suggested price ranges based on your expertise and subject demand, but the final decision is yours."
      }
    ]
  },
  {
    name: "Sessions & Students",
    questions: [
      {
        q: "What happens if a student cancels last minute?",
        a: "We have a 24-hour cancellation policy. If a student cancels within 24 hours of the session, you will receive 50% of the session fee. If they cancel within 2 hours or no-show, you receive 100%."
      },
      {
        q: "How do I conduct the online sessions?",
        a: "EthioTutor has a built-in virtual classroom with video, audio, whiteboard, and screen sharing. You don't need any third-party software like Zoom or Skype."
      }
    ]
  },
  {
    name: "Policies & Rules",
    questions: [
      {
        q: "Can I share my contact info with students?",
        a: "For safety and privacy, all communication must stay within the platform. Sharing personal phone numbers, emails, or social media is against our Terms of Service and may result in account suspension."
      },
      {
        q: "How do I maintain a high rating?",
        a: "Punctuality, clear communication, and personalized lesson plans are the keys to success. Tutors with an average rating of 4.8 or higher are promoted to 'Premium' status."
      }
    ]
  }
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredFaqs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      item => item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
              item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <SectionContainer>
      <ProgressStepper steps={onboardingSteps} />
      
      <PageHeader 
        title="Frequently Asked Questions" 
        description="Everything you need to know about tutoring on EthioTutor. Can't find what you're looking for? Reach out to our support team."
      />

      <div className="relative mb-12 max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search for answers..." 
          className="pl-12 py-6 text-lg rounded-2xl border-2 focus-visible:ring-primary h-auto shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((category) => (
            <div key={category.name} className="space-y-4">
              <h2 className="text-xl font-bold border-b pb-2 text-primary/80 uppercase tracking-widest">{category.name}</h2>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((item, idx) => (
                  <AccordionItem key={idx} value={`${category.name}-${idx}`} className="border-none mb-2">
                    <AccordionTrigger className="hover:no-underline rounded-xl px-4 py-4 bg-accent/50 hover:bg-accent transition-all text-left">
                      <span className="font-semibold text-lg">{item.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-4 text-muted-foreground leading-relaxed text-base bg-accent/20 rounded-b-xl border-x border-b border-accent">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
            <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">No results found</h3>
            <p className="text-muted-foreground">Try searching for something else or browse the categories below.</p>
            <Button variant="ghost" className="mt-4" onClick={() => setSearchQuery("")}>Clear Search</Button>
          </div>
        )}
      </div>

      <section className="mt-20 rounded-3xl bg-accent p-10 flex flex-col items-center text-center gap-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Still need help?</h2>
          <p className="text-muted-foreground text-lg max-w-[600px]">Our support team is available 24/7 to help you with any technical issues or platform questions.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
          <Button variant="outline" className="h-auto py-6 rounded-2xl flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 group">
            <MessageCircle className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
            <div className="flex flex-col">
              <span className="font-bold">Live Chat</span>
              <span className="text-xs text-muted-foreground">Response in 5m</span>
            </div>
          </Button>
          <Button variant="outline" className="h-auto py-6 rounded-2xl flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 group">
            <Mail className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
            <div className="flex flex-col">
              <span className="font-bold">Email Support</span>
              <span className="text-xs text-muted-foreground">Response in 2h</span>
            </div>
          </Button>
          <Button variant="outline" className="h-auto py-6 rounded-2xl flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 group">
            <PhoneCall className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
            <div className="flex flex-col">
              <span className="font-bold">Schedule a Call</span>
              <span className="text-xs text-muted-foreground">Available Mon-Fri</span>
            </div>
          </Button>
        </div>
      </section>

      <CallToAction 
        title="Ready to start your journey?" 
        description="You've completed the onboarding training! Your profile is now set to 100% and will start appearing in student search results."
        buttonText="Go to My Dashboard"
        href="/tutor/tutor-dashboard"
        className="mt-16"
      />
    </SectionContainer>
  )
}
