import Link from '@tiptap/extension-link'
import { EditorContent, useEditor, Node, mergeAttributes, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const EMPTY_DOC: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] }

/**
 * Normalize a stored field value to a ProseMirror document. Accepts both the
 * JSON shape and legacy plain strings — mirrors the client editor's `toDoc`.
 */
function toDoc(value: unknown): JSONContent {
  if (value && typeof value === 'object' && (value as JSONContent).type === 'doc') {
    return value as JSONContent
  }
  if (typeof value === 'string' && value.trim()) {
    return {
      type: 'doc',
      content: value.split(/\n{2,}/).map((para) => ({
        type: 'paragraph',
        content: para ? [{ type: 'text', text: para }] : [],
      })),
    }
  }
  return EMPTY_DOC
}

/**
 * Body image node, read-only variant of the client's MediaImage. The stored doc
 * carries only `assetId` (keys-only rule); the admin panel has no asset-lookup
 * endpoint, so it renders a neutral placeholder instead of resolving a URL.
 */
const MediaImagePlaceholder = Node.create({
  name: 'image',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      assetId: { default: null },
      alt: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'img[data-asset-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({
        'data-asset-id': HTMLAttributes.assetId,
        class:
          'my-3 flex items-center justify-center gap-2 rounded-lg bg-muted/60 px-3 py-4 text-2xs text-muted-foreground',
        'data-asset-label': HTMLAttributes.alt ?? '',
      }),
      `[image · ${HTMLAttributes.assetId ?? 'no id'}]`,
    ]
  },
})

const CONTENT_CLASS = [
  'outline-none text-sm leading-relaxed text-foreground',
  '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2',
  '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2',
  '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5',
  '[&_p]:my-2',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
  '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs',
  '[&_pre]:rounded-lg [&_pre]:bg-foreground [&_pre]:text-background [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-3',
  '[&_a]:text-primary [&_a]:underline',
].join(' ')

/**
 * Read-only TipTap render of a stored richtext field — shows the entry exactly
 * as the client editor authored it (same doc format, same node semantics).
 */
export function RichTextViewer({ value }: { value: unknown }) {
  const editor = useEditor({
    immediatelyRender: true,
    editable: false,
    extensions: [
      StarterKit,
      Link.configure({
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      MediaImagePlaceholder,
    ],
    content: toDoc(value),
    editorProps: { attributes: { class: CONTENT_CLASS } },
  })

  if (!editor) return null
  return <EditorContent editor={editor} />
}
