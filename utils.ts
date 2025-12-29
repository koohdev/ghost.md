import LZString from "lz-string";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind Merge Helper
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// URL Length Limit for Sharing
// Most browsers support ~2000-8000 chars, social media/SMS support less
export const MAX_SHAREABLE_URL_LENGTH = 2000;

// Compression Logic
export const compressMarkdown = (markdown: string): string => {
  if (!markdown) return "";
  return LZString.compressToEncodedURIComponent(markdown);
};

export const decompressMarkdown = (compressed: string): string | null => {
  if (!compressed) return null;
  // Fix for URL encoded spaces: Browser's URL decoding turns '+' into ' '.
  // LZString.compressToEncodedURIComponent uses '+' but no spaces.
  // So any space in the 'compressed' string read from URL query param was originally a '+'.
  const safeCompressed = compressed.replace(/ /g, "+");
  return LZString.decompressFromEncodedURIComponent(safeCompressed);
};

// URL Shortening via is.gd API
export const shortenUrl = async (longUrl: string): Promise<string> => {
  const encoded = encodeURIComponent(longUrl);
  const apiUrl = `https://is.gd/create.php?format=json&url=${encoded}`;
  
  // Use CORS proxy for client-side requests
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
  
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.shorturl) {
    return data.shorturl;
  }
  
  throw new Error(data.errormessage || 'Failed to shorten URL');
};

// Default Markdown Template
export const DEFAULT_MARKDOWN = `# Welcome to GHOST.md

GHOST.md is a **client-side** Markdown viewer that mimics VS Code. 

## Features
- 🔒 **Secure**: No database. Content is stored in the URL.
- 🎨 **VS Code Theme**: Matches your favorite editor's aesthetic.
- ⚡ **Fast**: Built with React & Tailwind.
- 💾 **Auto-Save**: Content persists locally so you never lose work.

## Code Example

\`\`\`javascript
function ghost() {
  console.log("Boo! I'm purely client-side.");
}
\`\`\`

## New! Diagrams & Math

### Mermaid Charts
\`\`\`mermaid
graph TD;
    A[Start] --> B{Is it Ghosts?};
    B -- Yes --> C[Run!];
    B -- No --> D[Relax];
\`\`\`

### LaTeX Math
The mass-energy equivalence is described by $E=mc^2$.

$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## Tables

| Feature | Status |
| :--- | :--- |
| Privacy | ✅ 100% |
| Tracking | ❌ None |

---
### 👨‍💻 Developed by [@gellovesualways](https://instagram.com/gellovesualways)
Check out my [Portfolio](https://subject-27.vercel.app/) for more projects!

Try pasting your own markdown!
`;
