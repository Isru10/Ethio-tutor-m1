"use client"

import * as React from "react"
import { 
  Banknote, 
  TrendingUp, 
  Wallet, 
  CreditCard,
  FileText,
  Filter,
  Download,
  Award
} from "lucide-react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { KpiCard, EarningsBalanceCard } from "./components/kpi-cards"
import { EarningsCharts } from "./components/earnings-charts"
import { TopPerformingCards } from "./components/highlight-cards"
import { EarningsTable } from "./components/earnings-table"
import { Button } from "@/components/ui/button"

export default function EarningsPage() {
  const { user } = useAuthStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="px-4 lg:px-6 py-20 text-center font-bold text-muted-foreground animate-pulse">Initializing Financial Core...</div>
  }

  return (
    <div className="px-4 lg:px-6 space-y-8 pb-12">
      {/* Financial Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter">
            Revenue Analytics
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Financial Status</span>
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Verified Merchant</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" className="font-bold gap-2 text-[10px] uppercase tracking-widest bg-background/50">
             <FileText className="h-3 w-3" /> Report
           </Button>
           <Button size="sm" className="font-bold gap-2 text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
             <CreditCard className="h-3 w-3" /> Withdraw Funds
           </Button>
        </div>
      </header>

      {/* Main Balance Highlight */}
      <EarningsBalanceCard 
        total="ETB 142,500"
        pending="ETB 12,400"
        withdrawn="ETB 130,100"
      />

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Net Earnings" 
          value="ETB 18,240" 
          icon={Banknote} 
          trend={{ value: "12.4%", isUp: true }}
          description="Total after commission this month"
        />
        <KpiCard 
          title="Profit Margin" 
          value="85%" 
          icon={TrendingUp} 
          trend={{ value: "2.1%", isUp: true }}
          description="Avg. retention of gross booking"
        />
        <KpiCard 
          title="Platform Fees" 
          value="ETB 3,250" 
          icon={Wallet} 
          trend={{ value: "5.4%", isUp: false }}
          description="EthioTutor service commission"
        />
        <KpiCard 
          title="Active Contracts" 
          value="14" 
          icon={FileText} 
          trend={{ value: "2", isUp: true }}
          description="Ongoing long-term relationships"
        />
      </section>

      {/* Highlights Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Performance Highlights</h2>
          <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-primary">View Global Stats</Button>
        </div>
        <TopPerformingCards />
      </section>

      {/* Advanced Charts Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
           <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Earnings Trends</h2>
           <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest">
                <Filter className="h-2.5 w-2.5 mr-1" /> Filter
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest">
                <Download className="h-2.5 w-2.5 mr-1" /> Export
              </Button>
           </div>
        </div>
        <EarningsCharts />
      </section>

      {/* Transaction History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Recent Activity</h2>
          <span className="text-[10px] font-bold text-muted-foreground">Last updated: Just now</span>
        </div>
        <EarningsTable />
      </section>
    </div>
  )
}
