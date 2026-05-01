"use client"

import React, { useState } from "react"
import { ThemeTab } from "@/components/theme-customizer/theme-tab"
import { ImportModal } from "@/components/theme-customizer/import-modal"
import { useThemeManager } from "@/hooks/use-theme-manager"
import { tweakcnThemes } from "@/config/theme-data"
import type { ImportedTheme } from "@/types/theme-customizer"
import { Separator } from "@/components/ui/separator"

export default function AppearanceSettings() {
  const { applyImportedTheme, isDarkMode } = useThemeManager()

  const [selectedTheme,        setSelectedTheme]        = useState("soft-pop")
  const [selectedTweakcnTheme, setSelectedTweakcnTheme] = useState("soft-pop")
  const [selectedRadius,       setSelectedRadius]       = useState("1rem")
  const [importedTheme,        setImportedTheme]        = useState<ImportedTheme | null>(null)
  const [importModalOpen,      setImportModalOpen]      = useState(false)

  const handleImport = (themeData: ImportedTheme) => {
    setImportedTheme(themeData)
    setSelectedTheme("")
    setSelectedTweakcnTheme("")
    applyImportedTheme(themeData, isDarkMode)
  }

  return (
    <div className="px-4 lg:px-6 space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Appearance</h1>
        <p className="text-muted-foreground text-sm">
          Customize the look and feel of EthioTutor. Changes apply instantly and are saved in your browser.
        </p>
      </div>

      <Separator />

      <div className="max-w-lg">
        <ThemeTab
          selectedTheme={selectedTheme}
          setSelectedTheme={setSelectedTheme}
          selectedTweakcnTheme={selectedTweakcnTheme}
          setSelectedTweakcnTheme={setSelectedTweakcnTheme}
          selectedRadius={selectedRadius}
          setSelectedRadius={setSelectedRadius}
          setImportedTheme={setImportedTheme}
          onImportClick={() => setImportModalOpen(true)}
        />
      </div>

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImport={handleImport}
      />
    </div>
  )
}
