"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Radio,
  Bot,
  ShieldCheck,
  Terminal,
  Flame,
  Pause,
  Play,
  Hexagon,
  Bell,
  Command,
  CornerDownLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandItem {
  id: string;
  label: string;
  category: "navigate" | "action";
  icon: React.ReactNode;
  shortcut?: string;
}

interface CommandPaletteProps {
  onNavigate: (sectionId: string) => void;
  onInjectFault: () => void;
  onClearFault: () => void;
  onTogglePause: () => void;
  isPaused: boolean;
  faultActive: boolean;
}

export default function CommandPalette({
  onNavigate,
  onInjectFault,
  onClearFault,
  onTogglePause,
  isPaused,
  faultActive,
}: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    { id: "nav-feed", label: "Go to Transaction Feed", category: "navigate", icon: <Radio className="w-4 h-4" /> },
    { id: "nav-topology", label: "Go to Service Topology", category: "navigate", icon: <Hexagon className="w-4 h-4" /> },
    { id: "nav-triage", label: "Go to AI Triage", category: "navigate", icon: <Bot className="w-4 h-4" /> },
    { id: "nav-security", label: "Go to Security & Compliance", category: "navigate", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "nav-chatops", label: "Go to ChatOps Terminal", category: "navigate", icon: <Terminal className="w-4 h-4" /> },
    { id: "nav-webhooks", label: "Go to Escalation Log", category: "navigate", icon: <Bell className="w-4 h-4" /> },
    {
      id: "action-pause",
      label: isPaused ? "Resume Stream" : "Pause Stream",
      category: "action",
      icon: isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />,
      shortcut: "P",
    },
    {
      id: "action-fault",
      label: faultActive ? "Clear Fault Injection" : "Inject Fault",
      category: "action",
      icon: <Flame className="w-4 h-4" />,
      shortcut: "F",
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = useCallback(
    (cmd: CommandItem) => {
      setIsOpen(false);
      setQuery("");

      if (cmd.id.startsWith("nav-")) {
        const sectionId = cmd.id.replace("nav-", "");
        onNavigate(sectionId);
      } else if (cmd.id === "action-pause") {
        onTogglePause();
      } else if (cmd.id === "action-fault") {
        if (faultActive) {
          onClearFault();
        } else {
          onInjectFault();
        }
      }
    },
    [onNavigate, onTogglePause, onInjectFault, onClearFault, faultActive]
  );

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  };

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <>
      {/* Trigger hint */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono text-s-muted bg-s-surface/50 border border-s-border/50 rounded hover:border-s-cyan/30 hover:text-s-cyan transition-all duration-200"
      >
        <Command className="w-3 h-3" />K
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Palette */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg"
            >
              <div className="command-palette-container rounded-xl border border-s-border/80 shadow-2xl overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-s-border/50">
                  <Search className="w-4 h-4 text-s-muted flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Type a command..."
                    className="flex-1 bg-transparent text-s-text text-sm font-mono outline-none placeholder:text-s-muted/50"
                  />
                  <kbd className="text-[9px] font-mono text-s-muted bg-s-surface px-1.5 py-0.5 rounded border border-s-border/50">
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[320px] overflow-y-auto py-2">
                  {/* Navigate section */}
                  {filtered.some((c) => c.category === "navigate") && (
                    <div className="px-4 py-1">
                      <p className="text-[9px] font-display font-semibold uppercase tracking-widest text-s-muted mb-1">
                        Navigation
                      </p>
                    </div>
                  )}
                  {filtered
                    .filter((c) => c.category === "navigate")
                    .map((cmd) => {
                      const globalIdx = filtered.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => handleSelect(cmd)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-mono transition-colors ${
                            globalIdx === selectedIndex
                              ? "bg-s-cyan/10 text-s-cyan"
                              : "text-s-text/80 hover:bg-s-surface/50"
                          }`}
                        >
                          <span className={globalIdx === selectedIndex ? "text-s-cyan" : "text-s-muted"}>
                            {cmd.icon}
                          </span>
                          <span className="flex-1 text-left">{cmd.label}</span>
                          {globalIdx === selectedIndex && (
                            <CornerDownLeft className="w-3 h-3 text-s-muted" />
                          )}
                        </button>
                      );
                    })}

                  {/* Action section */}
                  {filtered.some((c) => c.category === "action") && (
                    <div className="px-4 py-1 mt-1">
                      <p className="text-[9px] font-display font-semibold uppercase tracking-widest text-s-muted mb-1">
                        Actions
                      </p>
                    </div>
                  )}
                  {filtered
                    .filter((c) => c.category === "action")
                    .map((cmd) => {
                      const globalIdx = filtered.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => handleSelect(cmd)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-mono transition-colors ${
                            globalIdx === selectedIndex
                              ? "bg-s-cyan/10 text-s-cyan"
                              : "text-s-text/80 hover:bg-s-surface/50"
                          }`}
                        >
                          <span className={globalIdx === selectedIndex ? "text-s-cyan" : "text-s-muted"}>
                            {cmd.icon}
                          </span>
                          <span className="flex-1 text-left">{cmd.label}</span>
                          {cmd.shortcut && (
                            <kbd className="text-[9px] font-mono text-s-muted bg-s-surface px-1.5 py-0.5 rounded border border-s-border/50">
                              {cmd.shortcut}
                            </kbd>
                          )}
                          {globalIdx === selectedIndex && (
                            <CornerDownLeft className="w-3 h-3 text-s-muted" />
                          )}
                        </button>
                      );
                    })}

                  {filtered.length === 0 && (
                    <div className="px-4 py-8 text-center text-s-muted text-sm font-mono">
                      No commands found
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-s-border/50 text-[9px] text-s-muted font-mono">
                  <span>↑↓ navigate · ↵ select · esc close</span>
                  <span>Kairos Command Palette</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
