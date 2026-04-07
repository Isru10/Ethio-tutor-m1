export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="px-4 py-4 lg:px-6">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} EthioTutor · Connecting students with great teachers.
          </p>
        </div>
      </div>
    </footer>
  )
}
