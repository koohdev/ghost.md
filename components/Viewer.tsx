import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { decompressMarkdown } from '../utils';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Button, toast, ThemeToggle } from './ui';
import { Copy, PenLine } from 'lucide-react';

export const Viewer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const encoded = searchParams.get('c');
    
    if (encoded === null) {
      setError('No content found in the URL. The link might be incomplete.');
      setLoading(false);
      return;
    }

    if (encoded.trim() === '') {
      setError('The shared link content is empty. Please check the URL.');
      setLoading(false);
      return;
    }

    try {
      const decoded = decompressMarkdown(encoded);
      if (decoded) {
        setContent(decoded);
        setError(null);
      } else {
        setError('Failed to load content. The link data might be corrupted or invalid.');
      }
    } catch (e) {
      console.error("Decompression error:", e);
      setError('An error occurred while processing the content.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const handleCopyMarkdown = async () => {
     try {
      await navigator.clipboard.writeText(content);
      toast.success('Raw markdown copied!');
    } catch (err) {
      toast.error('Failed to copy.');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center text-[var(--accent-primary)] bg-[var(--bg-primary)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-[var(--bg-primary)] px-4">
        <div className="bg-[var(--bg-secondary)] p-6 md:p-8 rounded border border-[var(--border-primary)] flex flex-col items-center w-full max-w-md text-center shadow-2xl">
          <h2 className="text-xl text-red-500 font-bold mb-2">Unable to Load Document</h2>
          <p className="text-[var(--fg-primary)] text-sm mb-6">{error}</p>
          <Link to="/" className="w-full">
            <Button variant="primary" className="w-full">Create New Document</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="h-14 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] flex items-center justify-between px-3 md:px-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <img 
            src="https://icons.iconarchive.com/icons/microsoft/fluentui-emoji-3d/512/Ghost-3d-icon.png" 
            alt="GHOST.md" 
            className="w-6 h-6 md:w-8 md:h-8 object-contain hover:scale-110 transition-transform duration-200" 
          />
          <h1 className="text-xs md:text-lg font-bold tracking-tight text-[var(--fg-primary)] truncate flex items-center gap-2">
            GHOST.md
            <span className="hidden xs:inline-block text-[8px] md:text-[10px] font-normal text-[var(--fg-secondary)] border border-[var(--border-primary)] px-1 rounded bg-[var(--bg-secondary)] whitespace-nowrap">
              READ ONLY
            </span>
          </h1>
        </div>
        <div className="flex gap-1.5 md:gap-2 items-center shrink-0">
            <ThemeToggle />
            <div className="h-6 w-[1px] bg-[var(--border-primary)] mx-0.5 md:mx-1 hidden xs:block" />
            <Button variant="secondary" size="sm" onClick={handleCopyMarkdown} className="px-2 md:px-3">
                <Copy className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Copy Markdown</span>
            </Button>
            <Link to="/">
                <Button variant="primary" size="sm" className="px-2 md:px-3">
                    <PenLine className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-2" />
                    <span className="hidden md:inline">Create New</span>
                </Button>
            </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar">
        <article className="max-w-3xl mx-auto w-full">
            <MarkdownRenderer content={content} />
        </article>
      </main>
    </div>
  );
};