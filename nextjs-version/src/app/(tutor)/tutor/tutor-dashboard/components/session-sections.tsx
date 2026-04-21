"use client"

import * as React from "react"
import { Users, Star, Clock, Flame, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Session {
  id: string
  studentName: string
  avatar?: string
  topic: string
  date: string
  duration: string
  status: "completed" | "upcoming"
}

interface TrendingSession {
  id: string
  title: string
  category: string
  bookings: number
  rating: number
  isHot: boolean
}

export function RecentSessionsList({ sessions }: { sessions: Session[] }) {
  return (
    <Card className="border-border bg-card shadow-sm h-full">
      <CardHeader className="pb-3 border-b bg-accent/10 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold">Recent Sessions</CardTitle>
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-background">
            Live Updates
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {sessions.map((session) => (
            <div 
              key={session.id} 
              className="flex items-center justify-between p-4 px-6 hover:bg-accent/30 transition-all cursor-pointer group"
              onClick={() => console.log("Session clicked:", session.id)}
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border-2 border-border shadow-sm">
                  <AvatarImage src={session.avatar} />
                  <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                    {session.studentName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold leading-none group-hover:text-primary transition-colors">{session.studentName}</p>
                  <p className="text-xs text-muted-foreground font-medium">{session.topic}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {session.duration}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold italic">{session.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge 
                  variant={session.status === "completed" ? "secondary" : "default"}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    session.status === "completed" ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/10" : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/10"
                  )}
                >
                  {session.status}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function TrendingSessions({ items }: { items: TrendingSession[] }) {
  return (
    <Card className="border-border bg-card shadow-sm h-full">
      <CardHeader className="pb-3 border-b bg-orange-500/5 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            Trending Now
            <Flame className="h-4 w-4 text-orange-500 fill-current" />
          </CardTitle>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Insights</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 divide-y divide-border">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="p-4 px-6 hover:bg-orange-500/5 transition-all cursor-pointer group flex items-start justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <p className="text-sm font-bold group-hover:text-orange-600 transition-colors">{item.title}</p>
                   {item.isHot && <Badge className="bg-orange-500 hover:bg-orange-600 text-[9px] h-4">HOT</Badge>}
                </div>
                <p className="text-xs text-muted-foreground font-medium">{item.category}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" /> {item.bookings} students
                  </span>
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star className="h-3 w-3 fill-current" /> {item.rating}
                  </span>
                </div>
              </div>
              <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                 <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-600" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

import { ArrowUpRight } from "lucide-react"
