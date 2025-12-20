<div align="center">
  <img src="https://icons.iconarchive.com/icons/microsoft/fluentui-emoji-3d/512/Ghost-3d-icon.png" width="150" alt="GHOST.md Logo" />
  <h1>GHOST.md</h1>
  <p>
    <b>A professional, client-side Markdown editor inspired by VS Code.</b>
  </p>
  
  ![License](https://img.shields.io/badge/license-MIT-blue.svg)
  ![React](https://img.shields.io/badge/React-19-61dafb.svg)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
  ![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38bdf8.svg)
</div>

<br />

**GHOST.md** is built to be secure, fast, and completely serverless, storing your content entirely within the URL for easy sharing without a database.

## ✨ Features

- **🔒 Serverless Architecture**: No database. Your data lives in the URL (LZ-String compression).
- **🎨 VS Code Aesthetics**: Beautiful, familiar Gruvbox and One Dark Pro themes.
- **⚡ Real-time Rendering**: Instant preview with GitHub Flavored Markdown support.
- **📱 Responsive**: Works seamlessly on desktop and mobile.
- **📊 Diagrams & Math**: Native support for Mermaid.js flowcharts and LaTeX/KaTeX equations.
- **💾 Auto-Save**: LocalStorage persistence ensures you never lose work.
- **🛠️ Power Tools**: Search & Replace, Pre-made Snippets, Drag-and-Drop file import.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ghost-md.git
   cd ghost-md
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
ghost.md/
├── components/          # React components
│   ├── CodeEditor.tsx   # Markdown code editor with syntax highlighting
│   ├── Editor.tsx       # Main editor component with toolbar
│   ├── MarkdownRenderer.tsx  # Markdown to HTML renderer
│   ├── Viewer.tsx       # Read-only viewer component
│   └── ui.tsx           # UI components (Button, ThemeToggle, Toast)
├── App.tsx              # Main app component with routing
├── index.tsx            # Application entry point
├── index.html           # HTML template
├── index.css            # Tailwind CSS imports
├── utils.ts             # Utility functions (compression, helpers)
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **Markdown Engine**: React-Markdown, Remark (GFM, Math), Rehype (KaTeX)
- **Syntax Highlighting**: Shiki (Code blocks), PrismJS (Editor)
- **Utilities**: LZ-String (Compression), Mermaid (Diagrams)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 💖 Credits

- **Logo**: [Microsoft Fluent UI Emoji](https://github.com/microsoft/fluentui-emoji)
- **Development**: [Gell](https://instagram.com/gellovesualways)
