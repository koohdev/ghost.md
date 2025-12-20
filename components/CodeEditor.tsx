import React, { useMemo, useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown';
import { WrapText } from 'lucide-react';
import { cn } from '../utils';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  currentMatchIndex?: number;
  matches?: { start: number; end: number }[];
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

const SearchDecorations = ({ 
  value, 
  matches, 
  currentIndex, 
  wordWrap 
}: { 
  value: string; 
  matches: { start: number; end: number }[]; 
  currentIndex: number;
  wordWrap: boolean;
}) => {
  const renderedMatches = useMemo(() => {
    if (!matches || matches.length === 0) return value;

    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, i) => {
      if (match.start < lastIndex || match.start > value.length) return;

      result.push(value.substring(lastIndex, match.start));
      result.push(
        <span 
          key={i} 
          id={i === currentIndex ? 'current-editor-match' : undefined}
          className={cn(
            "rounded-sm transition-all duration-200 inline-block",
            i === currentIndex 
              ? "bg-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)] text-black font-bold z-20 shadow-[0_0_15px_rgba(215,153,33,0.4)]" 
              : "bg-yellow-500/30 border-b-2 border-yellow-500 z-10"
          )}
        >
          {value.substring(match.start, match.end)}
        </span>
      );
      lastIndex = match.end;
    });

    result.push(value.substring(lastIndex));
    return result;
  }, [value, matches, currentIndex]);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none z-0" aria-hidden="true">
      <pre
        className="font-mono text-base leading-relaxed m-0"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '1rem',
          lineHeight: '1.625',
          padding: '16px',
          whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
          wordBreak: wordWrap ? 'break-word' : 'normal',
          color: 'transparent',
          border: 'none',
        }}
      >
        {renderedMatches}
      </pre>
    </div>
  );
};

export const CodeEditor = React.forwardRef<HTMLDivElement, CodeEditorProps>(({ 
  value, 
  onChange, 
  className,
  currentMatchIndex = 0,
  matches = [],
  onScroll
}, ref) => {
  const [wordWrap, setWordWrap] = useState(true);
  const editorRef = useRef<any>(null);

  const highlight = (code: string) => {
    return Prism.highlight(
      code,
      Prism.languages.markdown || Prism.languages.extend('markdown', {}),
      'markdown'
    );
  };

  useEffect(() => {
    if (matches.length > 0 && currentMatchIndex >= 0) {
      const timer = setTimeout(() => {
        const currentElement = document.getElementById('current-editor-match');
        if (currentElement) {
          currentElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentMatchIndex, matches]);

  const lineCount = useMemo(() => value.split('\n').length, [value]);
  const lines = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);

  return (
    <div className="flex h-full bg-[var(--bg-primary)] relative font-mono text-base group/editor overflow-hidden">
      <style>{`
        .token.comment { color: #928374; font-style: italic; }
        .token.punctuation { color: #abb2bf; opacity: 0.8; }
        .token.property, .token.tag, .token.boolean, .token.number { color: #d3869b; }
        .token.string { color: #b8bb26; }
        .token.operator, .token.keyword { color: #fb4934; font-weight: bold; }
        .token.function { color: #fabd2f; }
        .token.title.important { color: #fe8019; font-weight: bold; }
        .token.bold { font-weight: bold; }
        .token.italic { font-style: italic; }
        
        [data-theme="one-dark"] .token.comment { color: #5c6370; }
        [data-theme="one-dark"] .token.string { color: #98c379; }
        [data-theme="one-dark"] .token.keyword { color: #c678dd; }
        [data-theme="one-dark"] .token.function { color: #61afef; }
        [data-theme="one-dark"] .token.title.important { color: #e06c75; }

        .editor-container pre { background-color: transparent !important; }
        .editor-container textarea { caret-color: var(--accent-primary); }
        
        .no-horizontal-scrollbar::-webkit-scrollbar:horizontal {
          display: none;
        }
        .no-horizontal-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>

      <button
        onClick={() => setWordWrap(!wordWrap)}
        className={cn(
          "absolute top-2 right-4 z-30 p-1.5 rounded-md transition-all duration-200 border border-transparent",
          "hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]",
          "opacity-20 group-hover/editor:opacity-100",
          wordWrap ? "bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--fg-primary)] opacity-100" : "text-[var(--fg-secondary)]"
        )}
        title="Toggle Word Wrap"
      >
        <WrapText className="w-4 h-4" />
      </button>

      {!wordWrap && (
        <div 
          className="flex-shrink-0 flex flex-col items-end bg-[var(--bg-secondary)] text-[var(--fg-secondary)] select-none pt-4 pr-4 pl-2 text-right sticky left-0 z-20 border-r border-[var(--border-primary)] opacity-50 h-full overflow-hidden"
          style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1rem', lineHeight: '1.625', minWidth: '3.5rem' }}
        >
          {lines.map(line => <div key={line} className="hover:text-[var(--fg-primary)] transition-colors cursor-default">{line}</div>)}
        </div>
      )}

      <div 
        ref={ref}
        onScroll={onScroll}
        className="flex-1 min-w-0 relative editor-container overflow-y-auto overflow-x-auto custom-scrollbar no-horizontal-scrollbar h-full"
      >
        <div className="relative">
          <SearchDecorations 
            value={value} 
            matches={matches} 
            currentIndex={currentMatchIndex} 
            wordWrap={wordWrap}
          />

          <Editor
            ref={editorRef}
            value={value}
            onValueChange={onChange}
            highlight={highlight}
            padding={16}
            className="font-mono text-base leading-relaxed relative z-10"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '1rem',
              lineHeight: '1.625',
              backgroundColor: 'transparent',
              color: 'var(--fg-primary)',
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              wordBreak: wordWrap ? 'break-word' : 'normal',
            }}
            textareaClassName="focus:outline-none z-10 selection:bg-[var(--accent-primary)]/30"
          />
        </div>
      </div>
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';