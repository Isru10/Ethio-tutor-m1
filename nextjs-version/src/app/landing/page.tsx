// import type { Metadata } from 'next'
// import { LandingPageContent } from './landing-page-content'

// // Metadata for the landing page
// export const metadata: Metadata = {
//   title: 'ShadcnStore - Modern Admin Dashboard Template',
//   description: 'A beautiful and comprehensive admin dashboard template built with React, Next.js, TypeScript, and shadcn/ui. Perfect for building modern web applications.',
//   keywords: ['admin dashboard', 'react', 'nextjs', 'typescript', 'shadcn/ui', 'tailwind css'],
//   openGraph: {
//     title: 'ShadcnStore - Modern Admin Dashboard Template',
//     description: 'A beautiful and comprehensive admin dashboard template built with React, Next.js, TypeScript, and shadcn/ui.',
//     type: 'website',
//   },
//   twitter: {
//     card: 'summary_large_image',
//     title: 'ShadcnStore - Modern Admin Dashboard Template',
//     description: 'A beautiful and comprehensive admin dashboard template built with React, Next.js, TypeScript, and shadcn/ui.',
//   },
// }

// export default function LandingPage() {
//   return <LandingPageContent />
// }



"use client"

import React, { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { 
  BookOpen, Calculator, Atom, FlaskConical, Dna, Globe, Map, 
  Languages, Scale, Monitor, Video, CreditCard, BookMarked, 
  TrendingUp, ArrowRight, Play, CheckCircle2, Users, Star, 
  GraduationCap, BookCheck, 
  BookA
} from 'lucide-react'

// ==========================================
// 1. AMBIENT BACKGROUND ANIMATION
// Simulates a "live educational network" and soft-pop aesthetic
// ==========================================
const AmbientBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#05050A]">
    {/* Grid Pattern */}
    <div 
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }}
    />
    
    {/* Soft Pop Neon Glowing Orbs */}
    <motion.div
      animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-violet-600/20 blur-[120px]"
    />
    <motion.div
      animate={{ scale: [1, 1.3, 1], x: [0, -40, 0], y: [0, 50, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[40%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-fuchsia-600/20 blur-[120px]"
    />
    <motion.div
      animate={{ scale: [1, 1.1, 1], x: [0, 30, 0], y: [0, 30, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/20 blur-[120px]"
    />
  </div>
)

// ==========================================
// 2. REUSABLE ANIMATION WRAPPER
// ==========================================
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, type: "spring", bounce: 0.4 }}
    className={className}
  >
    {children}
  </motion.div>
)

// ==========================================
// MAIN LANDING PAGE COMPONENT
// ==========================================
export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  
  // Futuristic Progress Bar
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })
  
  // Hero Parallax
  const y = useTransform(scrollYProgress, [0, 1], [0, 300])
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

  return (
    <div ref={containerRef} className="min-h-screen relative text-white selection:bg-fuchsia-500/30 overflow-hidden font-sans">
      <AmbientBackground />

      {/* Top Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 origin-left z-50 shadow-[0_0_20px_rgba(217,70,239,0.8)]"
        style={{ scaleX }}
      />

      {/* NAVBAR */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 w-full z-40 backdrop-blur-xl bg-[#05050A]/60 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              E
            </div>
            <span className="font-bold text-xl tracking-tight">EthioTutor</span>
          </div>
          <div className="hidden md:flex gap-4">
            <button className="text-sm font-medium text-white/70 hover:text-white transition-colors">Sign in</button>
            <button className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium backdrop-blur-md transition-all">
              Become a Tutor
            </button>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10 pt-32 pb-20 px-4 md:px-6 max-w-7xl mx-auto flex flex-col gap-32">
        
        {/* ================= HERO SECTION ================= */}
        <motion.section style={{ y, opacity }} className="min-h-[80vh] flex flex-col items-center justify-center text-center gap-8 relative pt-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm text-cyan-300 font-medium mb-4"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            🇪🇹 Ethiopia's #1 Online Tutoring Platform
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.1] max-w-5xl">
            Learn from the <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 animate-gradient-x">
              Best Tutors
            </span> <br/>
            in Ethiopia
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl font-light leading-relaxed">
            Connect with expert tutors for Mathematics, Science, English and more. Book live sessions, track your progress, and ace your exams.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
            <button className="group relative px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              <span className="relative z-10 flex items-center gap-2">
                Register as Student <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 font-semibold backdrop-blur-md transition-all flex items-center gap-2 justify-center">
              <Play className="w-4 h-4 text-fuchsia-400" /> See How it Works
            </button>
          </div>

          {/* Abstract 3D Floating Video Mockup (Impresses Investors) */}
          <motion.div 
            initial={{ y: 100, opacity: 0, rotateX: 40 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            transition={{ duration: 1.5, delay: 0.4, type: "spring", bounce: 0.3 }}
            style={{ perspective: "1000px" }}
            className="w-full max-w-4xl mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-transparent to-transparent z-10" />
            <div className="w-full aspect-video rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col">
              {/* Fake Browser/App Header */}
              <div className="h-12 border-b border-white/10 bg-white/5 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <div className="ml-4 text-xs text-white/40 font-mono">live-session.ethiotutor.com</div>
              </div>
              {/* Fake Content area */}
              <div className="flex-1 p-6 flex gap-6 relative">
                {/* Floating math equations moving slowly */}
                <motion.div animate={{ y: [-10, 10, -10], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 5, repeat: Infinity }} className="absolute text-cyan-500/30 text-4xl top-10 left-10 font-mono">∑</motion.div>
                <motion.div animate={{ y: [10, -10, 10], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 7, repeat: Infinity }} className="absolute text-fuchsia-500/30 text-2xl bottom-20 right-20 font-mono">E = mc²</motion.div>
                <motion.div animate={{ x: [-10, 10, -10], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 6, repeat: Infinity }} className="absolute text-violet-500/30 text-5xl top-20 right-1/3 font-mono">∫</motion.div>
                
                {/* Simulated webcam grid */}
                <div className="w-3/4 h-full rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/5 flex items-center justify-center">
                  <div className="text-white/20 font-medium">Interactive Whiteboard Active</div>
                </div>
                <div className="w-1/4 flex flex-col gap-4">
                  <div className="flex-1 rounded-xl border border-white/10 bg-white/5 overflow-hidden relative">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80" alt="Tutor" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-[10px] px-2 py-1 rounded-md">Tutor Sarah</div>
                  </div>
                  <div className="flex-1 rounded-xl border border-white/10 bg-white/5 overflow-hidden relative">
                    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80" alt="Student" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-[10px] px-2 py-1 rounded-md">You</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* ================= STATS Ticker ================= */}
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-lg">
            {[
              { icon: Users, stat: "500+", label: "Expert Tutors", color: "text-violet-400" },
              { icon: Star, stat: "4.8★", label: "Average Rating", color: "text-yellow-400" },
              { icon: GraduationCap, stat: "10k+", label: "Students Helped", color: "text-fuchsia-400" },
              { icon: BookOpen, stat: "12+", label: "Subjects Covered", color: "text-cyan-400" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center justify-center text-center gap-2 p-4">
                <s.icon className={`w-6 h-6 mb-2 ${s.color}`} />
                <h3 className="text-3xl md:text-4xl font-bold">{s.stat}</h3>
                <p className="text-white/50 text-sm font-medium uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* ================= HOW IT WORKS ================= */}
        <section className="flex flex-col gap-12 pt-10">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">How EthioTutor Works</h2>
              <p className="text-white/60 text-lg">From signup to your first session in under 5 minutes.</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0" />
            
            {[
              { step: "01", title: "Create Your Profile", desc: "Tell us about yourself, your grade, and your learning goals in a quick 2-minute setup." },
              { step: "02", title: "Browse & Book", desc: "Find the right tutor by subject, grade, price, and rating. Book a slot in one click." },
              { step: "03", title: "Learn & Grow", desc: "Join live online sessions, take notes, and track your progress over time." }
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.2} className="relative z-10">
                <div className="p-8 rounded-3xl bg-[#0A0A12] border border-white/10 hover:border-fuchsia-500/50 transition-all duration-500 group h-full shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full" />
                  <div className="text-6xl font-black text-white/5 mb-6 group-hover:text-fuchsia-500/20 transition-colors">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                  <p className="text-white/60 leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ================= POPULAR SUBJECTS (Interactive Grid) ================= */}
        <section className="pt-10">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Popular Subjects</h2>
          </FadeIn>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: "Mathematics", icon: Calculator, color: "hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-400" },
              { name: "Physics", icon: Atom, color: "hover:bg-fuchsia-500/20 hover:border-fuchsia-500/50 hover:text-fuchsia-400" },
              { name: "Chemistry", icon: FlaskConical, color: "hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:text-cyan-400" },
              { name: "Biology", icon: Dna, color: "hover:bg-green-500/20 hover:border-green-500/50 hover:text-green-400" },
              { name: "English", icon: BookA, color: "hover:bg-yellow-500/20 hover:border-yellow-500/50 hover:text-yellow-400" },
              { name: "History", icon: Globe, color: "hover:bg-orange-500/20 hover:border-orange-500/50 hover:text-orange-400" },
              { name: "Geography", icon: Map, color: "hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-400" },
              { name: "Amharic", icon: Languages, color: "hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400" },
              { name: "Civics", icon: Scale, color: "hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-indigo-400" },
              { name: "ICT", icon: Monitor, color: "hover:bg-violet-500/20 hover:border-violet-500/50 hover:text-violet-400" },
            ].map((sub, i) => (
              <FadeIn key={sub.name} delay={i * 0.05}>
                <button className={`flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 ${sub.color} group`}>
                  <sub.icon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <span className="font-medium">{sub.name}</span>
                </button>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ================= BENTO GRID: WHY CHOOSE US ================= */}
        <section className="pt-10">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Students Choose Us</h2>
              <p className="text-white/60 text-lg">Built strictly for the Ethiopian national curriculum.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Bento Box 1: Large Video feature */}
            <FadeIn className="md:col-span-2 relative rounded-3xl overflow-hidden border border-white/10 group">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-900/80 to-[#0A0A12]/90 z-10" />
              <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80" alt="Video Call" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                <Video className="w-10 h-10 text-violet-400 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Live 1-on-1 & Group Sessions</h3>
                <p className="text-white/70 max-w-md">Real-time interaction with expert tutors using state-of-the-art video & whiteboard tech.</p>
              </div>
            </FadeIn>

            {/* Bento Box 2: Pricing */}
            <FadeIn delay={0.1} className="relative rounded-3xl bg-gradient-to-br from-fuchsia-900/40 to-transparent border border-white/10 p-8 flex flex-col justify-between hover:border-fuchsia-500/50 transition-colors">
              <CreditCard className="w-8 h-8 text-fuchsia-400" />
              <div>
                <h3 className="text-xl font-bold mb-2">Affordable Pricing</h3>
                <p className="text-white/60 text-sm">Premium education starting from just <span className="text-fuchsia-400 font-bold">120 ETB/hour</span>.</p>
              </div>
            </FadeIn>

            {/* Bento Box 3: Curriculum */}
            <FadeIn delay={0.2} className="relative rounded-3xl bg-[#0A0A12] border border-white/10 p-8 flex flex-col justify-between hover:border-cyan-500/50 transition-colors">
              <BookMarked className="w-8 h-8 text-cyan-400" />
              <div>
                <h3 className="text-xl font-bold mb-2">Ethiopian Curriculum</h3>
                <p className="text-white/60 text-sm">Perfectly aligned with national standards for Grades 5 to 12.</p>
              </div>
            </FadeIn>

            {/* Bento Box 4: Tracking */}
            <FadeIn delay={0.3} className="md:col-span-2 relative rounded-3xl bg-gradient-to-tr from-cyan-900/30 to-violet-900/30 border border-white/10 p-8 flex items-center gap-8 hover:border-white/20 transition-colors overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay mask-image-gradient-l" />
              <div className="relative z-10 flex-1">
                <TrendingUp className="w-10 h-10 text-white mb-4" />
                <h3 className="text-2xl font-bold mb-2">Track Progress & Recordings</h3>
                <p className="text-white/70">Pro plan users get full session recordings and deep analytics to track grade improvement over time.</p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ================= TRUST METRICS ================= */}
        <section className="pt-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: "100% Online", desc: "Learn from anywhere", icon: Globe },
              { title: "Rated 4.8/5", desc: "By 10,000+ students", icon: Star },
              { title: "Certified Tutors", desc: "Verified experts", icon: CheckCircle2 },
              { title: "All Grades", desc: "Grade 5 through 12", icon: BookCheck }
            ].map((t, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="p-3 rounded-xl bg-white/5 text-cyan-400">
                    <t.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{t.title}</h4>
                    <p className="text-xs text-white/50">{t.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ================= EXPLOSIVE CTA ================= */}
        <FadeIn className="pt-20 pb-10">
          <div className="relative rounded-[40px] overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 opacity-90" />
            <motion.div 
              animate={{ x: ["0%", "100%", "0%"] }} 
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"
            />
            
            <div className="relative z-10 p-12 md:p-20 text-center flex flex-col items-center">
              <h2 className="text-4xl md:text-6xl font-black mb-6 text-white drop-shadow-md">
                Ready to Start Learning?
              </h2>
              <p className="text-xl text-white/90 mb-10 max-w-2xl font-medium">
                Join thousands of Ethiopian students improving their grades with EthioTutor today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button className="px-10 py-5 rounded-full bg-white text-black font-bold text-lg hover:scale-105 active:scale-95 transition-transform shadow-2xl">
                  Register as Student
                </button>
                <button className="px-10 py-5 rounded-full bg-black/20 hover:bg-black/40 text-white border border-white/20 backdrop-blur-md font-bold text-lg transition-all">
                  Become a Tutor
                </button>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ================= FOOTER ================= */}
        <footer className="border-t border-white/10 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">E</div>
            <span>© 2026 EthioTutor</span>
          </div>
          <p>Connecting students with great teachers across Ethiopia.</p>
        </footer>

      </main>
    </div>
  )
}