import { transformerColorizedBrackets } from "@shikijs/colorized-brackets";
import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import React, { ReactNode } from "react";
import { createHighlighter, Highlighter } from "shiki";
import theme from "./src/app/syntax-theme.json";

function getTextContent(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";

  if (Array.isArray(node)) {
    return node.map(getTextContent).join("");
  }

  if (typeof node === "object" && "props" in node) {
    return getTextContent(
      (node as { props: { children: ReactNode } }).props.children,
    );
  }

  return "";
}

function generateId(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

let highlighter: Highlighter | null = null;

async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      langs: ["javascript", "css", "html", "typescript"],
      themes: [theme],
    });
  }
  return highlighter;
}

async function CodeBlock({ code, lang }: { code: string; lang: string }) {
  let out = (await getHighlighter()).codeToHtml(code, {
    lang,
    theme: theme.name,
    transformers: [
      transformerColorizedBrackets({
        themes: {
          "Tailwind CSS": [
            "var(--color-purple-200)",
            "var(--color-cyan-300)",
            "var(--color-blue-300)",
            "var(--color-emerald-300)",
            "var(--color-pink-300)",
            "var(--color-amber-200)",
          ],
        },
      }),
    ],
  });

  return <div dangerouslySetInnerHTML={{ __html: out }} />;
}

const IMAGE_DIMENSION_REGEX = /^[^|]+\|\d+x\d+$/;

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => {
      let id = generateId(getTextContent(children));
      return <h1 id={id}>{children}</h1>;
    },
    h2: ({ children }) => {
      let id = generateId(getTextContent(children));
      return <h2 id={id}>{children}</h2>;
    },
    h3: ({ children }) => {
      let id = generateId(getTextContent(children));
      return <h3 id={id}>{children}</h3>;
    },
    h4: ({ children }) => {
      let id = generateId(getTextContent(children));
      return <h4 id={id}>{children}</h4>;
    },
    img: ({ alt, ...props }) => {
      let schemePlaceholder = encodeURIComponent("{scheme}");
      let width, height;
      if (IMAGE_DIMENSION_REGEX.test(alt)) {
        [width, height] = alt.split("|")[1].split("x").map(Number);
        alt = alt.split("|")[0];
      }
      if (props.src.includes(schemePlaceholder)) {
        return (
          <>
            <Image
              {...props}
              alt={alt}
              width={width}
              height={height}
              src={props.src.replace(schemePlaceholder, "light")}
              className="dark:hidden"
            />
            <Image
              {...props}
              alt={alt}
              width={width}
              height={height}
              src={props.src.replace(schemePlaceholder, "dark")}
              className="not-dark:hidden"
            />
          </>
        );
      } else {
        return <Image {...props} alt={alt} width={width} height={height} />;
      }
    },
    async pre(props) {
      let child = React.Children.only(props.children);
      if (!child) return null;
      let { children: code, className } = child.props;
      let lang = className ? className.replace("language-", "") : "";

      return <CodeBlock code={code} lang={lang} />;
    },
    table: ({ children, className, ...props }) => (
      <div className="overflow-x-auto">
        <table
          className={`w-full border-collapse ${className || ""}`}
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, className, ...props }) => (
      <thead
        className={`bg-gray-50 dark:bg-gray-800 ${className || ""}`}
        {...props}
      >
        {children}
      </thead>
    ),
    tbody: ({ children, className, ...props }) => (
      <tbody className={className || ""} {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, className, ...props }) => (
      <tr
        className={`border-b border-gray-200 dark:border-gray-700 ${className || ""}`}
        {...props}
      >
        {children}
      </tr>
    ),
    th: ({ children, className, ...props }) => (
      <th
        className={`px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 ${className || ""}`}
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, className, ...props }) => (
      <td
        className={`px-4 py-3 text-sm text-gray-700 dark:text-gray-300 ${className || ""}`}
        {...props}
      >
        {children}
      </td>
    ),
    ...components,
  };
}
