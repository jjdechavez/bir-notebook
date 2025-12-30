"use client";

import * as React from "react";

function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Fallback copy failed", err);
  }
  document.body.removeChild(textArea);
}

export function useCopyToClipboard({
  timeout = 2000,
  onCopy,
}: {
  timeout?: number;
  onCopy?: () => void;
} = {}) {
  const [isCopied, setIsCopied] = React.useState(false);

  const copyToClipboard = (value: string) => {
    if (typeof window === "undefined" || !navigator.clipboard.writeText) {
      fallbackCopyTextToClipboard(value);
      return;
    }

    if (!value) return;

    navigator.clipboard.writeText(value).then(
      () => {
        setIsCopied(true);

        if (onCopy) {
          onCopy();
        }

        if (timeout !== 0) {
          setTimeout(() => {
            setIsCopied(false);
          }, timeout);
        }
      },
      (e) => console.error("Failed to copy to clipboard: ", e),
    );
  };

  return { isCopied, copyToClipboard };
}
