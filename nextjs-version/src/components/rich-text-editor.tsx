"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import TextAlign from "@tiptap/extension-text-align"
import {
  Bold, Italic, List, ListOrdered, Heading2,
  Undo, Redo, Quote, AlignLeft, AlignCenter, AlignRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  maxLength?: number
  className?: string
}

export function RichTextEditor({
  value, onChange, placeholder = "Write something…", maxLength = 2000, className,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxLength }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[160px] px-4 py-3 text-sm",
      },
    },
  })

  if (!editor) return null

  const TB = ({
    onClick, active, children, title,
  }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <Button type="button" variant="ghost" size="icon" title={title}
      className={cn("h-7 w-7 shrink-0", active && "bg-muted text-foreground")}
      onClick={onClick}>
      {children}
    </Button>
  )

  const charCount = editor.storage.characterCount?.characters?.() ?? 0

  return (
    <div className={cn("rounded-md border border-input bg-background overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b px-2 py-1.5 flex-wrap bg-muted/30">
        <TB title="Bold" active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="size-3.5" />
        </TB>
        <TB title="Italic" active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="size-3.5" />
        </TB>
        <TB title="Heading" active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="size-3.5" />
        </TB>

        <div className="mx-1 h-4 w-px bg-border" />

        <TB title="Bullet list" active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="size-3.5" />
        </TB>
        <TB title="Numbered list" active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="size-3.5" />
        </TB>
        <TB title="Blockquote" active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="size-3.5" />
        </TB>

        <div className="mx-1 h-4 w-px bg-border" />

        <TB title="Align left" active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="size-3.5" />
        </TB>
        <TB title="Align center" active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="size-3.5" />
        </TB>
        <TB title="Align right" active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="size-3.5" />
        </TB>

        <div className="mx-1 h-4 w-px bg-border" />

        <TB title="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="size-3.5" />
        </TB>
        <TB title="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="size-3.5" />
        </TB>

        <span className="ml-auto text-[10px] text-muted-foreground pr-1 shrink-0">
          {charCount}/{maxLength}
        </span>
      </div>

      {/* Editor content with explicit styles for lists/headings/blockquotes */}
      <style>{`
        .tiptap-editor h2 { font-size: 1.25rem; font-weight: 700; margin: 0.75rem 0 0.25rem; }
        .tiptap-editor ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .tiptap-editor ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .tiptap-editor li { margin: 0.2rem 0; }
        .tiptap-editor blockquote { border-left: 3px solid hsl(var(--border)); padding-left: 1rem; color: hsl(var(--muted-foreground)); margin: 0.5rem 0; font-style: italic; }
        .tiptap-editor p { margin: 0.25rem 0; }
        .tiptap-editor p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: hsl(var(--muted-foreground)); pointer-events: none; float: left; height: 0; }
      `}</style>
      <div className="tiptap-editor">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
