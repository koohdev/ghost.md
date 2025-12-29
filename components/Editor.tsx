import React, { useState, useEffect, useRef, useCallback } from "react";
import { compressMarkdown, DEFAULT_MARKDOWN, cn, MAX_SHAREABLE_URL_LENGTH, shortenUrl } from "../utils";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { CodeEditor } from "./CodeEditor";
import { Button, toast, ThemeToggle } from "./ui";
import {
  Share2,
  Upload,
  Copy,
  Eye,
  Edit3,
  X,
  Link as LinkIcon,
  Check,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Bold,
  Italic,
  Heading,
  List,
  ListOrdered,
  Quote,
  Code,
  Image as ImageIcon,
  Table,
  BookOpen,
  Zap,
  Sparkles,
  Terminal,
  Undo2,
  Redo2,
  FolderOpen,
  Download,
  FileText,
  FileDown,
  FileText as PdfIcon,
  Sigma,
  GitGraph,
  GripVertical,
  AlertTriangle,
  Clipboard,
  Loader2,
} from "lucide-react";

interface SearchState {
  isOpen: boolean;
  searchTerm: string;
  replaceTerm: string;
  matchCase: boolean;
  currentIndex: number;
  results: { start: number; end: number }[];
}

type ExportFormat = "md" | "pdf";

const STORAGE_KEY = "ghost-md-draft";

const MD_REFERENCE = [
  {
    group: "Basics",
    items: [
      {
        name: "H1 Header",
        syntax: "# Heading 1",
        description: "Main page title",
      },
      {
        name: "H2 Header",
        syntax: "## Heading 2",
        description: "Section title",
      },
      {
        name: "Bold",
        syntax: "**Bold Text**",
        description: "Emphasize strongly",
      },
      {
        name: "Italic",
        syntax: "*Italic Text*",
        description: "Emphasize lightly",
      },
    ],
  },
  {
    group: "Structure",
    items: [
      {
        name: "Unordered List",
        syntax: "- Item 1\n- Item 2",
        description: "Bullet points",
      },
      {
        name: "Ordered List",
        syntax: "1. First\n2. Second",
        description: "Numbered steps",
      },
      {
        name: "Blockquote",
        syntax: "> Insightful quote here",
        description: "Callouts or quotes",
      },
      {
        name: "Horizontal Rule",
        syntax: "---\n",
        description: "Section separator",
      },
    ],
  },
  {
    group: "Visuals & Data",
    items: [
      {
        name: "Code Block",
        syntax: '```javascript\nconsole.log("Ghosted");\n```',
        description: "Syntax highlighted code",
      },
      {
        name: "Link",
        syntax: "[Link Text](https://google.com)",
        description: "External reference",
      },
      {
        name: "Table",
        syntax: "| Name | Type |\n| --- | --- |\n| Ghost | Spirit |",
        description: "Data grid",
      },
      {
        name: "Task List",
        syntax: "- [x] Completed\n- [ ] Pending",
        description: "Checklist",
      },
    ],
  },
  {
    group: "Diagrams & Math",
    items: [
      {
        name: "Flowchart",
        syntax: "```mermaid\ngraph TD;\nA-->B;\nA-->C;\n```",
        description: "Mermaid Flowchart",
      },
      {
        name: "Math (Inline)",
        syntax: "$E = mc^2$",
        description: "LaTeX Equation",
      },
      {
        name: "Math (Block)",
        syntax: "$$\n\\frac{1}{2}mv^2\n$$",
        description: "LaTeX Block",
      },
    ],
  },
];

export const Editor: React.FC = () => {
  // Initialize with saved draft or default
  const [markdown, setMarkdown] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? saved : DEFAULT_MARKDOWN;
  });

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("md");
  const [fileName, setFileName] = useState("document");
  const [shareUrl, setShareUrl] = useState("");
  const [isUrlTooLarge, setIsUrlTooLarge] = useState(false);
  const [isShortening, setIsShortening] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date>(new Date());

  // Resize State
  const [splitRatio, setSplitRatio] = useState(50);
  const isResizing = useRef(false);

  const editorScrollRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const syncSourceRef = useRef<"editor" | "preview" | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dragCounter = useRef(0);

  const historyRef = useRef<{ past: string[]; future: string[] }>({
    past: [],
    future: [],
  });
  // Initialize with current markdown value - this ref will be updated as markdown changes
  const lastSavedMarkdown = useRef<string>(markdown);
  const historyTimeoutRef = useRef<number | null>(null);
  const autoSaveTimeoutRef = useRef<number | null>(null);

  const [searchState, setSearchState] = useState<SearchState>({
    isOpen: false,
    searchTerm: "",
    replaceTerm: "",
    matchCase: false,
    currentIndex: 0,
    results: [],
  });

  const editorWrapperRef = useRef<HTMLDivElement>(null);

  // Auto-save Effect
  useEffect(() => {
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, markdown);
      setLastSavedTime(new Date());
    }, 1000); // Debounce save every 1s
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [markdown]);

  const handleScroll = useCallback((source: "editor" | "preview") => {
    if (syncSourceRef.current && syncSourceRef.current !== source) return;
    const editor = editorScrollRef.current;
    const preview = previewScrollRef.current;
    if (!editor || !preview) return;
    syncSourceRef.current = source;
    if (source === "editor") {
      const editorMax = editor.scrollHeight - editor.clientHeight;
      if (editorMax > 0) {
        const percentage = editor.scrollTop / editorMax;
        preview.scrollTop =
          percentage * (preview.scrollHeight - preview.clientHeight);
      }
    } else {
      const previewMax = preview.scrollHeight - preview.clientHeight;
      if (previewMax > 0) {
        const percentage = preview.scrollTop / previewMax;
        editor.scrollTop =
          percentage * (editor.scrollHeight - editor.clientHeight);
      }
    }
    if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = window.setTimeout(() => {
      syncSourceRef.current = null;
    }, 50);
  }, []);

  const pushToHistory = useCallback((value: string) => {
    if (value === lastSavedMarkdown.current) return;
    historyRef.current.past.push(lastSavedMarkdown.current);
    if (historyRef.current.past.length > 50) historyRef.current.past.shift();
    historyRef.current.future = [];
    lastSavedMarkdown.current = value;
  }, []);

  const handleUndo = useCallback(() => {
    if (historyRef.current.past.length === 0) return;
    const previous = historyRef.current.past.pop()!;
    historyRef.current.future.push(markdown);
    lastSavedMarkdown.current = previous;
    setMarkdown(previous);
  }, [markdown]);

  const handleRedo = useCallback(() => {
    if (historyRef.current.future.length === 0) return;
    const next = historyRef.current.future.pop()!;
    historyRef.current.past.push(markdown);
    lastSavedMarkdown.current = next;
    setMarkdown(next);
  }, [markdown]);

  const onMarkdownChange = useCallback((newVal: string) => {
    setMarkdown(newVal);
    if (historyTimeoutRef.current)
      window.clearTimeout(historyTimeoutRef.current);
    historyTimeoutRef.current = window.setTimeout(() => {
      pushToHistory(newVal);
    }, 500);
  }, [pushToHistory]);

  const performSearch = useCallback(
    (text: string, term: string, matchCase: boolean) => {
      if (!term) return [];
      try {
        const regex = new RegExp(term, matchCase ? "g" : "gi");
        const matches = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
          });
          if (match.index === regex.lastIndex) regex.lastIndex++;
        }
        return matches;
      } catch (e) {
        return [];
      }
    },
    []
  );

  useEffect(() => {
    const results = performSearch(
      markdown,
      searchState.searchTerm,
      searchState.matchCase
    );
    setSearchState((s) => ({
      ...s,
      results,
      currentIndex:
        results.length > 0
          ? s.currentIndex >= results.length
            ? 0
            : s.currentIndex
          : 0,
    }));
  }, [markdown, searchState.searchTerm, searchState.matchCase, performSearch]);

  const insertSnippet = useCallback(
    (syntax: string, type: "wrap" | "line" | "block" = "wrap") => {
      const textarea = editorWrapperRef.current?.querySelector("textarea");
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selection = markdown.substring(start, end);
      let newContent = "";
      let newCursorPos = 0;
      if (type === "wrap") {
        const parts = syntax.split("Text");
        const prefix = parts[0] || "";
        const suffix = parts[1] || "";
        const textToUse = selection || "text";
        newContent =
          markdown.substring(0, start) +
          prefix +
          textToUse +
          suffix +
          markdown.substring(end);
        newCursorPos = start + prefix.length + textToUse.length + suffix.length;
      } else if (type === "line") {
        const lineStart = markdown.lastIndexOf("\n", start - 1) + 1;
        newContent =
          markdown.substring(0, lineStart) +
          syntax +
          markdown.substring(lineStart);
        newCursorPos =
          lineStart + syntax.length + (selection ? selection.length : 0);
      } else {
        newContent =
          markdown.substring(0, start) +
          "\n" +
          syntax +
          "\n" +
          markdown.substring(end);
        newCursorPos = start + syntax.length + 2;
      }
      onMarkdownChange(newContent);
      pushToHistory(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [markdown, pushToHistory]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;
    if (cmdKey && e.key === "z") {
      e.preventDefault();
      e.shiftKey ? handleRedo() : handleUndo();
    }
    if (cmdKey && e.key === "y") {
      e.preventDefault();
      handleRedo();
    }
    if (cmdKey && e.key === "f") {
      e.preventDefault();
      setSearchState((s) => ({ ...s, isOpen: true }));
    }
    if (cmdKey && e.key === "o") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
    if (cmdKey && e.key === "s") {
      e.preventDefault();
      setIsExportModalOpen(true);
    }
  };

  const processFile = React.useCallback(
    (file: File) => {
      if (file && (file.name.endsWith(".md") || file.name.endsWith(".txt"))) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const text = ev.target?.result as string;
            if (text !== null && text !== undefined && text.length >= 0) {
              // Update all state synchronously to prevent hook order issues
              const newFileName = file.name.replace(/\.[^/.]+$/, "");
              
              // Clear history first
              historyRef.current = { past: [], future: [] };
              
              // Update refs
              lastSavedMarkdown.current = text;
              
              // Update state - all in one batch
              setFileName(newFileName);
              setMarkdown(text);
              
              // Show success message
              toast.success(`Imported: ${file.name}`);
            }
          } catch (error) {
            console.error("Error processing file:", error);
            toast.error("Failed to process file.");
          }
        };
        reader.onerror = () => {
          toast.error("Failed to read file.");
        };
        reader.readAsText(file);
      } else {
        toast.error("Invalid file type.");
      }
    },
    [] // No dependencies - function is stable
  );

  const handleShare = async () => {
    const compressed = compressMarkdown(markdown);
    const generatedUrl = `${window.location.origin}/#/view?c=${compressed}`;
    
    if (generatedUrl.length > MAX_SHAREABLE_URL_LENGTH) {
      // URL is too long - try to shorten it
      setIsShortening(true);
      setIsShareModalOpen(true);
      
      try {
        const shortUrl = await shortenUrl(generatedUrl);
        setShareUrl(shortUrl);
        setIsUrlTooLarge(false);
        toast.success("Short link generated!");
      } catch (error) {
        console.error("Failed to shorten URL:", error);
        setShareUrl(generatedUrl);
        setIsUrlTooLarge(true);
        // URL too large even for shortener - show fallback options
        toast.error("Document too large for URL sharing");
      } finally {
        setIsShortening(false);
      }
    } else {
      // URL is short enough to use directly
      setShareUrl(generatedUrl);
      setIsUrlTooLarge(false);
      setIsShareModalOpen(true);
      toast.success("Sharable link generated!");
    }
  };

  const handleExport = () => {
    if (exportFormat === "md") {
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName.trim() || "document"}.md`;
      link.click();
      URL.revokeObjectURL(url);
      setIsExportModalOpen(false);
      toast.success("File exported!");
    } else if (exportFormat === "pdf") {
      setIsExportModalOpen(false);
      setTimeout(() => {
        window.print();
        toast.success("Opening print dialog for PDF generation...");
      }, 500);
    }
  };

  // Drag & Drop Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only accept file drops to avoid triggering on text selection
    if (!e.dataTransfer.types.includes("Files")) return;

    dragCounter.current += 1;
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only track if we are actually dragging a file
    if (!isDraggingFile) return;

    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDraggingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Resizing Logic
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newRatio = (e.clientX / window.innerWidth) * 100;
    // Limit to 20% - 80% to prevent panels from disappearing
    if (newRatio > 20 && newRatio < 80) {
      setSplitRatio(newRatio);
    }
  }, []);

  const onMouseUp = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".md,.txt"
        onChange={(e) => {
          if (e.target.files?.[0]) processFile(e.target.files[0]);
        }}
      />

      {isDraggingFile && (
        <div className="absolute inset-0 z-[100] bg-[var(--accent-primary)]/10 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-[var(--bg-secondary)] border-2 border-[var(--accent-primary)] p-12 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => {
                setIsDraggingFile(false);
                dragCounter.current = 0;
              }}
              className="absolute top-2 right-2 p-1 hover:text-red-500 text-[var(--fg-secondary)]"
            >
              <X size={20} />
            </button>
            <Upload className="w-10 h-10 text-[var(--accent-primary)]" />
            <h2 className="text-2xl font-bold text-[var(--fg-primary)]">
              Drop to Load
            </h2>
          </div>
        </div>
      )}

      <header className="h-14 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] flex items-center justify-between px-3 md:px-4 shrink-0 z-40">
        <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
          <img
            src="https://icons.iconarchive.com/icons/microsoft/fluentui-emoji-3d/512/Ghost-3d-icon.png"
            alt="GHOST.md"
            className="w-8 h-8 md:w-9 md:h-9 object-contain hover:scale-110 transition-transform duration-200"
          />
          <div className="min-w-0">
            <h1 className="text-xs md:text-sm font-bold tracking-tight text-[var(--fg-primary)] leading-none mb-0.5 md:mb-1 truncate">
              GHOST.md
            </h1>
            <p className="hidden xs:block text-[8px] md:text-[10px] text-[var(--fg-secondary)] uppercase tracking-widest opacity-60">
              Professional Markdown Editor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="hidden sm:flex"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Open
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="hidden sm:flex"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsReferenceOpen(!isReferenceOpen)}
            className={cn(
              "hidden lg:flex",
              isReferenceOpen && "bg-[var(--bg-tertiary)]"
            )}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Learn
          </Button>
          <div className="h-6 w-[1px] bg-[var(--border-primary)] mx-0.5 md:mx-1 hidden xs:block" />
          <Button
            variant="cyber"
            size="sm"
            onClick={handleShare}
            className="px-2 md:px-3 text-[10px] md:text-xs"
          >
            <Share2 className="w-3.5 h-3.5 md:mr-2" />
            <span className="hidden xs:inline">Share Link</span>
          </Button>
        </div>
      </header>

      <main
        className="flex-1 flex flex-col md:flex-row overflow-hidden relative"
        style={{ "--split-ratio": `${splitRatio}%` } as React.CSSProperties}
      >
        <div
          className={cn(
            "flex flex-col border-r md:border-r-0 border-[var(--border-primary)] relative bg-[var(--bg-primary)] h-full overflow-hidden",
            activeTab === "edit" ? "flex w-full" : "hidden md:flex",
            "md:w-[var(--split-ratio)] md:flex-none"
          )}
        >
          <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] h-10 px-2 flex items-center gap-0.5 shrink-0 overflow-x-auto no-scrollbar">
            <ToolbarButton
              icon={<Undo2 size={16} />}
              onClick={handleUndo}
              title="Undo"
            />
            <ToolbarButton
              icon={<Redo2 size={16} />}
              onClick={handleRedo}
              title="Redo"
            />
            <div className="w-[1px] h-4 bg-[var(--border-primary)] mx-1 opacity-50" />
            <ToolbarButton
              icon={<Heading size={16} />}
              onClick={() => insertSnippet("# ", "line")}
              title="H1"
            />
            <ToolbarButton
              icon={<Bold size={16} />}
              onClick={() => insertSnippet("**Text**", "wrap")}
              title="Bold"
            />
            <ToolbarButton
              icon={<Italic size={16} />}
              onClick={() => insertSnippet("*Text*", "wrap")}
              title="Italic"
            />
            <div className="w-[1px] h-4 bg-[var(--border-primary)] mx-1 opacity-50" />
            <ToolbarButton
              icon={<List size={16} />}
              onClick={() => insertSnippet("- ", "line")}
              title="List"
            />
            <ToolbarButton
              icon={<ListOrdered size={16} />}
              onClick={() => insertSnippet("1. ", "line")}
              title="Ordered"
            />
            <ToolbarButton
              icon={<Check size={16} />}
              onClick={() => insertSnippet("- [ ] ", "line")}
              title="Tasks"
            />
            <div className="w-[1px] h-4 bg-[var(--border-primary)] mx-1 opacity-50 hidden sm:block" />
            <ToolbarButton
              icon={<Quote size={16} />}
              onClick={() => insertSnippet("> ", "line")}
              title="Quote"
            />
            <ToolbarButton
              icon={<Code size={16} />}
              onClick={() => insertSnippet("```\n\n```", "block")}
              title="Code"
            />
            <ToolbarButton
              icon={<LinkIcon size={16} />}
              onClick={() => insertSnippet("[Title](url)", "wrap")}
              title="Link"
            />
            <ToolbarButton
              icon={<ImageIcon size={16} />}
              onClick={() => insertSnippet("![Alt](url)", "wrap")}
              title="Image"
            />
            <ToolbarButton
              icon={<Table size={16} />}
              onClick={() =>
                insertSnippet(
                  "| Col | Col |\n| --- | --- |\n| Val | Val |",
                  "block"
                )
              }
              title="Table"
            />
            <div className="ml-auto pr-2">
              <button
                onClick={() =>
                  setSearchState((s) => ({ ...s, isOpen: !s.isOpen }))
                }
                className={cn(
                  "p-1.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors",
                  searchState.isOpen && "text-[var(--accent-primary)]"
                )}
              >
                <Search size={14} />
              </button>
            </div>
          </div>

          {searchState.isOpen && (
            <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] p-2 shadow-xl animate-in slide-in-from-top-2 duration-150">
              <div className="max-w-xl mx-auto flex items-center gap-2">
                <input
                  autoFocus
                  className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] text-sm px-3 py-1.5 outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  placeholder="Find..."
                  value={searchState.searchTerm}
                  onChange={(e) =>
                    setSearchState((s) => ({
                      ...s,
                      searchTerm: e.target.value,
                    }))
                  }
                />
                <button
                  onClick={() =>
                    setSearchState((s) => ({ ...s, isOpen: false }))
                  }
                  className="p-1.5 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <div
            ref={editorWrapperRef}
            className="flex-1 w-full bg-[var(--bg-primary)] overflow-hidden relative h-full"
          >
            <CodeEditor
              ref={editorScrollRef}
              value={markdown}
              onChange={onMarkdownChange}
              matches={searchState.results}
              currentMatchIndex={searchState.currentIndex}
              onScroll={() => handleScroll("editor")}
            />
          </div>
        </div>

        {/* Drag Handle (Desktop Only) */}
        <div
          className="hidden md:flex w-1 bg-[var(--border-primary)] hover:bg-[var(--accent-primary)] cursor-col-resize transition-colors z-10 hover:w-1.5 active:bg-[var(--accent-primary)] items-center justify-center group/resizer"
          onMouseDown={startResizing}
        >
          <div className="h-8 w-0.5 bg-[var(--fg-secondary)] rounded-full opacity-0 group-hover/resizer:opacity-100 transition-opacity" />
        </div>

        <div
          className={cn(
            "flex flex-col bg-[var(--bg-primary)] relative h-full overflow-hidden",
            activeTab === "preview" ? "flex w-full" : "hidden md:flex",
            "md:flex-1" // Takes remaining space
          )}
        >
          <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] h-10 px-4 flex items-center shrink-0 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-[var(--fg-secondary)] uppercase font-bold">
                Live Output
              </span>
            </div>
            <span className="text-[9px] text-[var(--fg-secondary)] font-mono opacity-60">
              Last saved: {lastSavedTime.toLocaleTimeString()}
            </span>
          </div>
          <div
            ref={previewScrollRef}
            onScroll={() => handleScroll("preview")}
            className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar scroll-smooth h-full bg-[var(--bg-primary)]"
          >
            <div id="preview-content" className="max-w-3xl mx-auto p-4">
              <MarkdownRenderer content={markdown} />
            </div>
          </div>
        </div>

        <aside
          className={cn(
            "bg-[var(--bg-secondary)] transition-all duration-300 flex flex-col z-50 overflow-hidden border-l border-[var(--border-primary)]",
            // Mobile: Absolute positioning (Drawer style)
            "absolute right-0 top-0 h-full shadow-2xl md:shadow-none",
            // Desktop: Static positioning (Flex layout)
            "md:static md:h-auto",
            isReferenceOpen ? "w-80" : "w-0 border-none"
          )}
        >
          <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center sticky top-0 bg-[var(--bg-secondary)] z-10 shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--accent-primary)]" />
              <h3 className="text-xs font-bold uppercase">Guide</h3>
            </div>
            <button
              onClick={() => setIsReferenceOpen(false)}
              className="hover:text-red-500"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
            {MD_REFERENCE.map((group, gIdx) => (
              <div key={gIdx} className="flex flex-col gap-2">
                <h4 className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-widest opacity-60">
                  {group.group}
                </h4>
                <div className="grid gap-2">
                  {group.items.map((item, iIdx) => (
                    <button
                      key={iIdx}
                      onClick={() =>
                        insertSnippet(
                          item.syntax,
                          item.syntax.includes("\n") ? "block" : "wrap"
                        )
                      }
                      className="group p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] rounded text-left transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[var(--fg-primary)] group-hover:text-[var(--accent-primary)]">
                          {item.name}
                        </span>
                        <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[var(--accent-primary)]" />
                      </div>
                      <code className="mt-2 text-[9px] bg-[var(--bg-tertiary)] p-1 rounded font-mono block truncate opacity-60 group-hover:opacity-100">
                        {item.syntax.split("\n")[0]}
                      </code>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </main>

      <footer className="h-8 md:h-7 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] text-[var(--fg-secondary)] text-[9px] md:text-[10px] flex items-center px-2 md:px-4 justify-between shrink-0 select-none z-40">
        <div className="flex items-center gap-3 md:gap-6 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
            <span className="font-bold text-[var(--fg-primary)]">GHOST</span>
          </div>
          <span className="hidden sm:flex items-center gap-1 opacity-70 font-mono">
            <Terminal size={12} />{" "}
            {markdown.split(/\s+/).filter(Boolean).length} WORDS
          </span>
        </div>
        <div className="flex items-center h-full">
          <div className="flex md:hidden items-center h-full mr-2">
            <button
              onClick={() => setActiveTab("edit")}
              className={cn(
                "px-3 h-full text-[8px] font-bold uppercase",
                activeTab === "edit" && "text-[var(--accent-primary)]"
              )}
            >
              Code
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={cn(
                "px-3 h-full text-[8px] font-bold uppercase",
                activeTab === "preview" && "text-[var(--accent-primary)]"
              )}
            >
              View
            </button>
          </div>
          <span className="text-[var(--accent-primary)] bg-[var(--bg-primary)]/40 px-3 h-full flex items-center font-mono">
            LN {markdown.split("\n").length}, COL {markdown.length}
          </span>
        </div>
      </footer>

      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-6 md:p-8 rounded-xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {isShortening ? (
                  <>
                    <Loader2 className="w-5 h-5 text-[var(--accent-primary)] animate-spin" />
                    Shortening URL...
                  </>
                ) : isUrlTooLarge ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    Document Too Large
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5 text-[var(--accent-primary)]" />
                    Link Ready
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-[var(--fg-secondary)] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            {isShortening ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-10 h-10 text-[var(--accent-primary)] animate-spin mb-4" />
                <p className="text-sm text-[var(--fg-secondary)]">Generating short link...</p>
              </div>
            ) : isUrlTooLarge ? (
              <>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-[var(--fg-secondary)] leading-relaxed mb-2">
                    <strong>This document is too large for URL sharing.</strong>
                  </p>
                  <p className="text-xs text-[var(--fg-secondary)] opacity-70">
                    {markdown.split(/\s+/).filter(Boolean).length} words • URL-based sharing only works for shorter documents.
                  </p>
                </div>
                <div className="flex flex-col gap-3 mb-6">
                  <Button
                    variant="primary"
                    className="w-full justify-center"
                    onClick={() => {
                      navigator.clipboard.writeText(markdown);
                      toast.success("Content copied to clipboard!");
                    }}
                  >
                    <Clipboard className="w-4 h-4 mr-2" />
                    Copy Content to Clipboard
                  </Button>
                  <Button
                    variant="cyber"
                    className="w-full justify-center"
                    onClick={() => {
                      const blob = new Blob([markdown], { type: "text/markdown" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `${fileName.trim() || "document"}.md`;
                      link.click();
                      URL.revokeObjectURL(url);
                      toast.success("File downloaded!");
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download as .md File
                  </Button>
                </div>
                <p className="text-[10px] text-[var(--fg-secondary)] text-center mb-4 opacity-60">
                  Share the downloaded file via email, cloud storage, or messaging apps.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--fg-secondary)] mb-6 leading-relaxed">
                  Your content is encoded directly into this URL. Privacy by
                  design—no database used.
                </p>
                <div className="flex gap-2 mb-8 group">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] p-3 rounded text-[10px] font-mono group-hover:border-[var(--accent-primary)] transition-colors min-w-0"
                  />
                  <Button
                    variant="primary"
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      toast.success("Copied!");
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </>
            )}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setIsShareModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-6 md:p-8 rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Download className="w-5 h-5 text-[var(--accent-primary)]" />
                Export
              </h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-[var(--fg-secondary)] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--fg-secondary)] uppercase tracking-widest ml-1">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportFormat("md")}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded border transition-all gap-2",
                      exportFormat === "md"
                        ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                        : "border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--fg-secondary)]"
                    )}
                  >
                    <FileDown size={20} />
                    <span className="text-[10px] font-bold">Markdown</span>
                  </button>
                  <button
                    onClick={() => setExportFormat("pdf")}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded border transition-all gap-2",
                      exportFormat === "pdf"
                        ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                        : "border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--fg-secondary)]"
                    )}
                  >
                    <PdfIcon size={20} />
                    <span className="text-[10px] font-bold">PDF (Print)</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--fg-secondary)] uppercase tracking-widest ml-1">
                  Filename
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] p-3 rounded text-sm outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setIsExportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ToolbarButton = ({
  icon,
  onClick,
  title,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
}) => (
  <button
    onClick={onClick}
    className="p-1.5 hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-primary)] rounded transition-all text-[var(--fg-secondary)]"
    title={title}
  >
    {icon}
  </button>
);
