"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  language: string;
  value: string;
}

/**
 * Enhanced CodeBlock component for syntax highlighting
 * Uses react-syntax-highlighter for better compatibility with React Markdown
 *
 * @param language - The programming language for syntax highlighting
 * @param value - The code string to be highlighted
 */
export function CodeBlock({ language, value }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  const normalizedLanguage = language || "text";

  const supportedLanguages = [
    "javascript",
    "typescript",
    "jsx",
    "tsx",
    "html",
    "css",
    "python",
    "bash",
    "shell",
    "json",
    "markdown",
    "sql",
    "text",
    "java",
    "c",
    "cpp",
    "csharp",
    "go",
    "rust",
    "php",
    "ruby",
  ];

  // Use text if language is not supported
  const safeLanguage = supportedLanguages.includes(normalizedLanguage)
    ? normalizedLanguage
    : "text";

  const formattedValue = value.trim() || " ";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedValue);
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  return (
    <div className="not-prose my-4 relative group">
      <div className="bg-gray-900 rounded-t-md py-2">
        {" "}
        <div className="absolute left-2 top-2 text-xs text-gray-400 font-mono bg-gray-700 px-2 py-1 rounded">
          {safeLanguage}
        </div>
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 p-1.5 rounded-md bg-[#1e293b]/80 text-gray-400 hover:text-white hover:bg-[#1e293b] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          aria-label={isCopied ? "Copied" : "Copy code"}
          title={isCopied ? "Copied" : "Copy code"}
        >
          {isCopied ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
        </button>
      </div>

      <SyntaxHighlighter
        language={safeLanguage}
        style={vscDarkPlus}
        customStyle={{
          background: "#1e293b",
          borderRadius: "0.375rem",
          borderTopRightRadius: "0",
          borderTopLeftRadius: "0",
          fontSize: "0.875rem",
          margin: 0,
          padding: "1rem",
        }}
        showLineNumbers={formattedValue.split("\n").length > 1}
        wrapLongLines={false}
      >
        {formattedValue}
      </SyntaxHighlighter>
    </div>
  );
}
