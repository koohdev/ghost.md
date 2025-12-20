import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { createHighlighter } from 'shiki';
import mermaid from 'mermaid';
import { cn } from '../utils';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  searchMatch?: { start: number; end: number } | null;
}

// Singleton to cache the highlighter instance
let highlighterPromise: Promise<any> | null = null;

const getHighlighter = () => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['one-dark-pro', 'github-dark', 'dark-plus'],
      langs: [
        'javascript', 'typescript', 'tsx', 'jsx', 'json', 'css', 'html', 'markdown', 
        'bash', 'python', 'java', 'go', 'rust', 'c', 'cpp', 'csharp', 'php', 
        'sql', 'yaml', 'xml', 'dockerfile', 'shell', 'toml', 'ruby', 'swift', 'kotlin'
      ]
    });
  }
  return highlighterPromise;
};

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    fontFamily: 'Inter',
    primaryColor: '#d79921',
    primaryTextColor: '#ebdbb2',
    primaryBorderColor: '#d79921',
    lineColor: '#ebdbb2',
    secondaryColor: '#3c3836',
    tertiaryColor: '#282828',
  }
});

const MermaidBlock = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const render = async () => {
      if (!chart) return;
      try {
        const id = 'mermaid-' + Math.random().toString(36).substring(2, 9);
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        // console.error("Mermaid Render Error", err);
        // Mermaid throws errors easily on incomplete syntax, which is common while typing.
        // We capture it but might choose just to show the code until it fixes.
        setError('Invalid Mermaid Syntax');
      }
    };
    render();
  }, [chart]);

  if (error) {
    return (
      <div className="my-6 p-4 border border-red-500/50 bg-red-500/10 rounded text-red-400 text-xs font-mono">
         <p className="font-bold mb-2">Mermaid Diagram Error:</p>
         <pre>{chart}</pre>
      </div>
    );
  }

  return (
    <div 
      className="mermaid my-8 flex justify-center overflow-x-auto" 
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
};

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : null;
  const codeContent = String(children).replace(/\n$/, '');
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Handle Mermaid diagrams specifically
  if (!inline && lang === 'mermaid') {
    return <MermaidBlock chart={codeContent} />;
  }

  useEffect(() => {
    // Map application themes to Shiki themes that are guaranteed to be in the bundle
    const appTheme = document.documentElement.getAttribute('data-theme');
    let shikiTheme = 'github-dark';
    if (appTheme === 'one-dark') {
      shikiTheme = 'one-dark-pro';
    } else if (appTheme === 'gruvbox') {
      shikiTheme = 'dark-plus';
    }

    if (!inline && lang) {
      getHighlighter().then((highlighter) => {
        try {
          const html = highlighter.codeToHtml(codeContent, { 
            lang, 
            theme: shikiTheme 
          });
          setHighlightedHtml(html);
        } catch (error) {
          try {
             const html = highlighter.codeToHtml(codeContent, { 
               lang: 'text', 
               theme: shikiTheme 
             });
             setHighlightedHtml(html);
          } catch(e) {
             setHighlightedHtml(null);
          }
        }
      });
    } else {
        setHighlightedHtml(null); 
    }
  }, [codeContent, lang, inline]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code', err);
    }
  };

  if (inline) {
    return (
      <code className={cn("bg-[var(--bg-tertiary)] text-[var(--accent-primary)] rounded px-1.5 py-0.5 text-[0.9em] break-words whitespace-normal", className)} {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-6 rounded-sm border border-[var(--border-primary)] bg-[var(--bg-primary)] flex flex-col max-w-full overflow-hidden">
       <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] text-[10px] md:text-xs text-[var(--fg-primary)] select-none shrink-0">
          <span className="font-mono font-medium opacity-80 uppercase tracking-wider">{lang || 'text'}</span>
          <button 
             onClick={handleCopy}
             className="flex items-center gap-1.5 text-[var(--fg-primary)] hover:text-white transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
             title="Copy code"
          >
             {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-[10px] text-green-400 font-medium hidden xs:inline">Copied!</span>
                </>
             ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden xs:inline">Copy</span>
                </>
             )}
          </button>
       </div>
       <div className="overflow-x-auto bg-[var(--bg-primary)] custom-scrollbar">
         {highlightedHtml ? (
           <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} className="text-xs md:text-sm leading-relaxed min-w-full inline-block align-top" />
         ) : (
           <pre className="p-4 text-xs md:text-sm leading-relaxed text-[var(--fg-primary)] font-mono whitespace-pre">
             <code className={className} {...props}>{children}</code>
           </pre>
         )}
       </div>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className, searchMatch }) => {
  return (
    <div className={cn("markdown-body w-full min-w-0 max-w-full break-words selection:bg-[var(--accent-primary)]/30", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code: CodeBlock,
          table: ({ children, ...props }) => (
            <div className="w-full overflow-x-auto my-6 border border-[var(--border-primary)] rounded-sm bg-[var(--bg-secondary)]/30 custom-scrollbar shadow-inner">
              <table className="w-full text-left border-collapse min-w-max text-sm md:text-base" {...props}>
                {children}
              </table>
            </div>
          ),
          a: ({ node, className, ...props }) => (
             <a className={cn("text-[var(--accent-primary)] hover:underline break-all transition-colors", className)} {...props} />
          ),
          img: ({ node, className, ...props }) => (
            <span className="block my-6 text-center">
              <img className={cn("max-w-full h-auto rounded-sm border border-[var(--border-primary)] mx-auto shadow-lg", className)} {...props} alt={props.alt || 'Content image'} />
              {props.alt && <span className="block text-center text-[10px] mt-2 text-[var(--fg-secondary)] italic">{props.alt}</span>}
            </span>
          ),
          p: ({ node, className, ...props }) => (
             <p className={cn("mb-4 last:mb-0 leading-relaxed overflow-wrap-anywhere", className)} {...props} />
          ),
          ul: ({ node, className, ...props }) => (
            <ul className={cn("list-disc list-outside ml-5 mb-4 space-y-1.5", className)} {...props} />
          ),
          ol: ({ node, className, ...props }) => (
            <ol className={cn("list-decimal list-outside ml-5 mb-4 space-y-1.5", className)} {...props} />
          ),
          li: ({ node, className, ...props }) => (
            <li className={cn("leading-relaxed", className)} {...props} />
          ),
          blockquote: ({ node, className, ...props }) => (
            <blockquote className={cn("border-l-4 border-[var(--accent-primary)] bg-[var(--bg-secondary)]/50 pl-4 pr-2 py-1 my-6 italic text-[var(--fg-primary)]/90 rounded-r-sm", className)} {...props} />
          ),
          hr: ({ node, className, ...props }) => (
            <hr className={cn("border-0 border-t border-[var(--border-primary)] my-8 opacity-50", className)} {...props} />
          ),
          h1: ({ node, className, ...props }) => (
            <h1 className={cn("text-2xl md:text-3xl font-bold mb-6 mt-10 text-[var(--accent-primary)] border-b border-[var(--border-primary)] pb-2", className)} {...props} />
          ),
          h2: ({ node, className, ...props }) => (
            <h2 className={cn("text-xl md:text-2xl font-bold mb-4 mt-8 text-[var(--accent-primary)]", className)} {...props} />
          ),
          h3: ({ node, className, ...props }) => (
            <h3 className={cn("text-lg md:text-xl font-bold mb-3 mt-6 text-[var(--accent-primary)] opacity-90", className)} {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
