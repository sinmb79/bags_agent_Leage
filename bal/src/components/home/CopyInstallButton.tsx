"use client";

import { useState } from "react";
import { INSTALL_COMMAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function CopyInstallButton() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(INSTALL_COMMAND);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return <Button onClick={handleCopy}>{copied ? "Copied" : "Copy"}</Button>;
}

