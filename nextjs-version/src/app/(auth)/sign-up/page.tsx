import Link from "next/link"
import { Logo } from "@/components/logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, BookOpen, ArrowRight } from "lucide-react"

export default function SignUpGatewayPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md">
            <Logo size={24} />
          </div>
          EthioTutor
        </Link>
        
        <Card className="mx-auto w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create an Account</CardTitle>
            <CardDescription>
              How would you like to join EthioTutor today?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              
              {/* Student Option */}
              <Link href="/sign-up/student" className="block outline-none group">
                <div className="flex flex-col items-center p-6 border-2 rounded-xl border-border hover:border-primary hover:bg-primary/5 transition-all text-center h-full space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <GraduationCap className="size-8 text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">I am a Student</h3>
                    <p className="text-sm text-muted-foreground">
                      Book sessions, access materials, and improve your grades.
                    </p>
                  </div>
                  <div className="mt-auto pt-4 flex items-center text-sm font-semibold text-primary">
                    Join as Student <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
              
              {/* Tutor Option */}
              <Link href="/sign-up/tutor" className="block outline-none group">
                <div className="flex flex-col items-center p-6 border-2 rounded-xl border-border hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all text-center h-full space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                    <BookOpen className="size-8 text-blue-600 group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">I am a Tutor</h3>
                    <p className="text-sm text-muted-foreground">
                      Share your knowledge, set your own schedule, and earn.
                    </p>
                  </div>
                  <div className="mt-auto pt-4 flex items-center text-sm font-semibold text-blue-600">
                    Apply as Tutor <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

            </div>

            <div className="text-center mt-12 text-sm">
              Already have an account?{" "}
              <Link href="/sign-in" className="underline underline-offset-4 font-medium text-primary hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
