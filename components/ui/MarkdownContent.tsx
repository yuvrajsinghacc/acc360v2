'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { ChartBlock } from '@/components/ui/ChartBlock'

interface Props {
  children: string
  className?: string
}

export function MarkdownContent({ children, className }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn('space-y-2 text-sm text-light', className)}
      components={{
        // ── Headings ──────────────────────────────────────────────────────────
        h1: ({ children }) => (
          <h1 className="text-base font-bold text-light mt-4 mb-2 first:mt-0 leading-snug">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-bold text-light mt-4 mb-1.5 first:mt-0 leading-snug border-b border-border/40 pb-1">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-[#A7BDB1] mt-3 mb-1 first:mt-0">{children}</h3>
        ),

        // ── Block elements ────────────────────────────────────────────────────
        p: ({ children }) => (
          <p className="text-sm text-light leading-relaxed">{children}</p>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[#A7BDB1] pl-3 my-2 text-muted italic text-sm">
            {children}
          </blockquote>
        ),

        // ── Lists ─────────────────────────────────────────────────────────────
        ul: ({ children }) => (
          <ul className="list-disc list-outside pl-5 space-y-0.5 text-sm text-light">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside pl-5 space-y-0.5 text-sm text-light">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),

        // ── Inline ────────────────────────────────────────────────────────────
        strong: ({ children }) => (
          <strong className="font-semibold text-[#FFA300]">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-[#DFD5CC]/80">{children}</em>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FFA300] hover:underline underline-offset-2"
          >
            {children}
          </a>
        ),

        // ── Code ─────────────────────────────────────────────────────────────
        // Chart blocks bypass pre/code entirely and render a Recharts widget.
        // During streaming the JSON may be incomplete — ChartBlock shows a
        // loading placeholder in that case and renders the chart once valid.
        pre: ({ children, ...rest }) => {
          // Detect if the sole child is a language-chart code element
          const child = Array.isArray(children) ? children[0] : children
          if (
            child &&
            typeof child === 'object' &&
            'props' in child &&
            (child as any).props?.className === 'language-chart'
          ) {
            return <>{children}</>
          }
          return (
            <pre
              className="bg-[#1e1e20] rounded-lg px-4 py-3 my-2 overflow-x-auto text-xs font-mono leading-relaxed text-[#DFD5CC]"
              {...rest}
            >
              {children}
            </pre>
          )
        },
        code: ({ children, className: cls }) => {
          if (cls === 'language-chart') {
            return <ChartBlock content={String(children)} />
          }
          const isBlock = !!cls || String(children).includes('\n')
          if (isBlock) {
            return <code className={cn('font-mono text-[#DFD5CC]', cls)}>{children}</code>
          }
          return (
            <code className="text-[#FECD42] bg-[#1e1e20] px-1.5 py-0.5 rounded text-[11px] font-mono">
              {children}
            </code>
          )
        },

        // ── Tables (requires remark-gfm) ──────────────────────────────────────
        table: ({ children }) => (
          <div className="overflow-x-auto my-3 rounded-lg border border-border">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-[#111827]">{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-border/40 last:border-0 odd:bg-card/20">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wider whitespace-nowrap">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2.5 text-sm text-light">{children}</td>
        ),

        // ── HR ────────────────────────────────────────────────────────────────
        hr: () => <hr className="border-border/50 my-3" />,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
