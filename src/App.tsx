import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { EditorState, StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, LanguageDescription, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { languages } from "@codemirror/language-data";
import { basicSetup } from "codemirror";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open, save } from "@tauri-apps/plugin-dialog";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { ChevronDown, ChevronRight, Folder, FolderOpen, File, FileCode2, FileJson, FileText, FileImage, FileArchive, FileSpreadsheet, FileVideo, FileAudio, FileTerminal, FileType, FileCog, PanelLeftClose, PanelLeftOpen, Settings, Check } from "lucide-react";
import { themes, themeIds, type ThemeId, type EditorTheme } from "./themes";
import type { LucideIcon } from "lucide-react";

type Doc = { id: number; path: string | null; name: string; content: string; dirty: boolean };
type Entry = { name: string; path: string; is_dir: boolean };
const base = (p: string) => p.split(/[\\/]/).filter(Boolean).pop() || p;
const languageFor = (name: string) =>
  LanguageDescription.matchFilename(languages, name) ??
  (/\\.vh$/i.test(name) ? languages.find(language => language.name === "Verilog") : undefined);

const fileIconFor = (filename: string): { Icon: LucideIcon; color: string } => {
  const name = filename.toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop()! : "";
  if (["v", "vh", "sv", "svh", "c", "h", "cc", "cpp", "cxx", "hpp", "hxx", "rs", "go", "java"].includes(ext)) return { Icon: FileCode2, color: "#89b4fa" };
  if (["py", "js", "jsx", "ts", "tsx", "php", "rb", "lua", "swift", "kt", "kts"].includes(ext)) return { Icon: FileCode2, color: "#f9e2af" };
  if (["json", "jsonc", "json5"].includes(ext)) return { Icon: FileJson, color: "#f9e2af" };
  if (["html", "htm", "xml", "svg"].includes(ext)) return { Icon: FileCode2, color: "#fab387" };
  if (["css", "scss", "sass", "less"].includes(ext)) return { Icon: FileType, color: "#89dceb" };
  if (["md", "mdx", "txt", "log", "rst"].includes(ext)) return { Icon: FileText, color: "#bac2de" };
  if (["yaml", "yml", "toml", "ini", "conf", "config", "env"].includes(ext) || ["dockerfile", "makefile", ".gitignore", ".editorconfig"].includes(name)) return { Icon: FileCog, color: "#a6e3a1" };
  if (["sh", "bash", "zsh", "fish"].includes(ext)) return { Icon: FileTerminal, color: "#a6e3a1" };
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "ico"].includes(ext)) return { Icon: FileImage, color: "#cba6f7" };
  if (["zip", "tar", "gz", "7z", "rar", "xz"].includes(ext)) return { Icon: FileArchive, color: "#fab387" };
  if (["csv", "xls", "xlsx", "ods"].includes(ext)) return { Icon: FileSpreadsheet, color: "#a6e3a1" };
  if (["mp4", "mkv", "mov", "webm"].includes(ext)) return { Icon: FileVideo, color: "#cba6f7" };
  if (["mp3", "wav", "flac", "ogg"].includes(ext)) return { Icon: FileAudio, color: "#f38ba8" };
  if (ext === "pdf") return { Icon: FileText, color: "#f38ba8" };
  return { Icon: File, color: "#a6adc8" };
};


const createHighlightStyle = (theme: EditorTheme) => HighlightStyle.define([
  { tag: tags.comment, color: theme.syntax.comment, fontStyle: "italic" },
  { tag: [tags.string, tags.docString, tags.character, tags.attributeValue], color: theme.syntax.string },
  { tag: [tags.number, tags.integer, tags.float, tags.bool], color: theme.syntax.number },
  { tag: [tags.keyword, tags.controlKeyword, tags.definitionKeyword, tags.moduleKeyword, tags.operatorKeyword], color: theme.syntax.keyword },
  { tag: tags.definition(tags.function(tags.variableName)), color: theme.syntax.function, fontWeight: "bold" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: theme.syntax.function },
  { tag: tags.definition(tags.variableName), color: theme.syntax.definition, fontWeight: "bold" },
  { tag: tags.constant(tags.variableName), color: theme.syntax.constant },
  { tag: tags.standard(tags.variableName), color: theme.syntax.property },
  { tag: tags.special(tags.variableName), color: theme.syntax.tag },
  { tag: tags.local(tags.variableName), color: "var(--text)", fontWeight: "bold" },
  { tag: [tags.variableName, tags.self], color: "var(--text)" },
  { tag: [tags.typeName, tags.className], color: theme.syntax.type },
  { tag: tags.namespace, color: theme.syntax.keyword },
  { tag: [tags.propertyName, tags.attributeName], color: theme.syntax.property },
  { tag: [tags.macroName, tags.annotation, tags.meta], color: theme.syntax.number },
  { tag: [tags.operator, tags.punctuation, tags.separator], color: theme.syntax.operator },
  { tag: tags.tagName, color: theme.syntax.tag },
  { tag: [tags.regexp, tags.escape], color: theme.syntax.regexp },
  { tag: [tags.heading, tags.heading1, tags.heading2, tags.heading3], color: theme.syntax.function, fontWeight: "bold" },
  { tag: tags.invalid, color: theme.syntax.tag, textDecoration: "underline wavy" }
]);


function App() {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem("milize.theme.v1") as ThemeId | null;
    return saved && themes[saved] ? saved : "catppuccin";
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const currentTheme = themes[themeId];
  const highlightStyle = createHighlightStyle(currentTheme);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [root, setRoot] = useState<string | null>(null);
  const [workspaceRestored, setWorkspaceRestored] = useState(false);
  const [cursorPositions, setCursorPositions] = useState<Record<string, { line: number; column: number }>>({});
  const cursorPositionsRef = useRef(cursorPositions);
  cursorPositionsRef.current = cursorPositions;
  const [tree, setTree] = useState<Record<string, Entry[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [terminalHeight, setTerminalHeight] = useState(210);
  const [sidebarWidth, setSidebarWidth] = useState(246);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [terminalReady, setTerminalReady] = useState(false);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [terminalFontSize, setTerminalFontSize] = useState(13);
  const [focusedSurface, setFocusedSurface] = useState<"editor" | "terminal">("editor");
  const [status, setStatus] = useState("Ready");
  const editorHost = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const terminalHost = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const drag = useRef<"terminal" | "sidebar" | false>(false);
  const docsRef = useRef(docs);
  const activeIdRef = useRef(activeId);
  const saveRef = useRef<(d: Doc) => Promise<void>>(async () => {});
  docsRef.current = docs;
  activeIdRef.current = activeId;
  const active = docs.find(d => d.id === activeId) ?? null;

  useEffect(() => {
    const root = document.documentElement;
    const c = currentTheme.colors;
    const vars: Record<string, string> = {
      "--bg": c.bg, "--panel": c.panel, "--panel-alt": c.panelAlt, "--editor": c.editor,
      "--terminal": c.terminal, "--border": c.border, "--text": c.text, "--muted": c.muted,
      "--subtle": c.subtle, "--accent": c.accent, "--accent-alt": c.accentAlt,
      "--hover": c.hover, "--selection": c.selection, "--active-line": c.activeLine,
      "--gutter": c.gutter, "--gutter-active": c.gutterActive, "--cursor": c.cursor
    };
    Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
    root.dataset.theme = themeId;
    localStorage.setItem("milize.theme.v1", themeId);
  }, [themeId, currentTheme]);

  const patchDoc = useCallback((id: number, patch: Partial<Doc>) => {
    setDocs(old => old.map(d => d.id === id ? { ...d, ...patch } : d));
  }, []);

  const saveDoc = useCallback(async (doc: Doc) => {
    try {
      let path = doc.path;
      if (!path) {
        const chosen = await save({ defaultPath: doc.name });
        if (!chosen) return;
        path = chosen;
      }
      await invoke("write_file", { path, content: doc.content });
      patchDoc(doc.id, { path, name: base(path), dirty: false });
      setStatus("Saved");
    } catch (error) { setStatus("Save failed: " + String(error)); }
  }, [patchDoc]);
  saveRef.current = saveDoc;

  const openPath = useCallback(async (path: string) => {
    const existing = docsRef.current.find(d => d.path === path);
    if (existing) { setActiveId(existing.id); return; }
    try {
      const content = await invoke<string>("read_file", { path });
      const doc = { id: Date.now() + Math.random(), path, name: base(path), content, dirty: false };
      setDocs(old => [...old, doc]);
      setActiveId(doc.id);
      setStatus("Opened " + doc.name);
    } catch (error) { setStatus("Open failed: " + String(error)); }
  }, []);

  const openFile = useCallback(async () => {
    const selected = await open({ multiple: false });
    if (typeof selected === "string") await openPath(selected);
  }, [openPath]);

  const loadDirectory = useCallback(async (path: string) => {
    try {
      const entries = await invoke<Entry[]>("list_dir", { path });
      setTree(old => ({ ...old, [path]: entries }));
    } catch (error) { setStatus("Directory error: " + String(error)); }
  }, []);

  const openFolder = useCallback(async () => {
    const selected = await open({ directory: true, multiple: false });
    if (typeof selected !== "string") return;
    setRoot(selected);
    setExpanded(new Set([selected]));
    void invoke("terminal_change_directory", { path: selected }).catch(() => {});
    await loadDirectory(selected);
    setStatus("Opened folder " + base(selected));
  }, [loadDirectory]);

  const toggleDirectory = async (path: string) => {
    const next = new Set(expanded);
    if (next.has(path)) next.delete(path);
    else { next.add(path); if (!tree[path]) await loadDirectory(path); }
    setExpanded(next);
  };

  const newFile = () => {
    const doc = { id: Date.now() + Math.random(), path: null, name: "untitled.sv", content: "", dirty: false };
    setDocs(old => [...old, doc]);
    setActiveId(doc.id);
  };

  const closeDoc = (id: number) => {
    const doc = docsRef.current.find(d => d.id === id);
    if (doc?.dirty && !window.confirm("Discard unsaved changes?")) return;
    const remaining = docsRef.current.filter(d => d.id !== id);
    setDocs(remaining);
    if (activeIdRef.current === id) setActiveId((remaining.length ? remaining[remaining.length - 1].id : null));
  };


  useEffect(() => {
    let cancelled = false;
    const restoreWorkspace = async () => {
      try {
        const raw = localStorage.getItem("milize.workspace.v1") ?? localStorage.getItem("codeeditor.workspace.v1");
        const saved = raw ? JSON.parse(raw) as {
          root?: string | null;
          files?: string[];
          activePath?: string | null;
          cursors?: Record<string, { line: number; column: number }>;
        } : null;
        if (saved?.cursors) setCursorPositions(saved.cursors);
        if (saved?.root) {
          setRoot(saved.root);
          setExpanded(new Set([saved.root]));
          await loadDirectory(saved.root);
        }
        if (saved?.files?.length) {
          const restoredDocs: Doc[] = [];
          for (const path of saved.files) {
            try {
              const content = await invoke<string>("read_file", { path });
              restoredDocs.push({ id: Date.now() + Math.random(), path, name: base(path), content, dirty: false });
            } catch { /* Skip files deleted or moved since the previous session. */ }
          }
          if (!cancelled && restoredDocs.length) {
            setDocs(restoredDocs);
            const selected = restoredDocs.find(doc => doc.path === saved?.activePath) ?? restoredDocs[0];
            setActiveId(selected.id);
            const savedCursor = selected.path ? saved?.cursors?.[selected.path] : undefined;
            if (savedCursor) setCursor(savedCursor);
          }
        }
      } catch (error) {
        console.warn("Could not restore workspace:", error);
      } finally {
        if (!cancelled) setWorkspaceRestored(true);
      }
    };
    void restoreWorkspace();
    return () => { cancelled = true; };
  }, [loadDirectory]);

  useEffect(() => {
    if (!workspaceRestored) return;
    try {
      localStorage.setItem("milize.workspace.v1", JSON.stringify({
        root,
        files: docs.filter(doc => doc.path).map(doc => doc.path),
        activePath: docs.find(doc => doc.id === activeId)?.path ?? null,
        cursors: cursorPositions
      }));
      localStorage.removeItem("codeeditor.workspace.v1");
    } catch (error) {
      console.warn("Could not save workspace state:", error);
    }
  }, [workspaceRestored, root, docs, activeId, cursorPositions]);

  useEffect(() => {
    if (!workspaceRestored || !editorHost.current || !active) { editor.current?.destroy(); editor.current = null; return; }
    const state = EditorState.create({
      doc: active.content,
      extensions: [
        basicSetup, EditorView.lineWrapping, syntaxHighlighting(highlightStyle),
        EditorView.theme({
          "&": { height: "100%", backgroundColor: "var(--editor)", color: "var(--text)", fontSize: editorFontSize + "px" },
          ".cm-content": { fontFamily: "'JetBrains Mono', 'Iosevka Term', monospace", padding: "12px 0", caretColor: "var(--cursor)" },
          ".cm-line": { paddingLeft: "4px" },
          ".cm-gutters": { backgroundColor: "var(--gutter)", color: "var(--subtle)", border: "none", minWidth: "48px" },
          ".cm-activeLineGutter": { backgroundColor: "var(--gutter-active)", color: "var(--accent)" },
          ".cm-activeLine": { backgroundColor: "var(--active-line)" },
          ".cm-cursor": { borderLeftColor: "var(--cursor)" },
          ".cm-selectionBackground, ::selection": { backgroundColor: "var(--selection) !important" },
          ".cm-focused .cm-selectionBackground": { backgroundColor: "var(--selection)" },
          ".cm-tooltip": { backgroundColor: "var(--panel)", border: "1px solid var(--border)", color: "var(--text)" },
          ".cm-tooltip-autocomplete ul li[aria-selected]": { backgroundColor: "var(--selection)", color: "var(--text)" },
          ".cm-panels": { backgroundColor: "var(--panel)", color: "var(--text)" },
          ".cm-searchMatch": { backgroundColor: "var(--accent)55", outline: "1px solid var(--accent)" },
          ".cm-searchMatch-selected": { backgroundColor: "var(--accent)88" }
        }),
        EditorView.updateListener.of(update => {
          if (update.docChanged) patchDoc(activeId!, { content: update.state.doc.toString(), dirty: true });
          if (update.selectionSet) {
            const pos = update.state.selection.main.head;
            const line = update.state.doc.lineAt(pos);
            const nextCursor = { line: line.number, column: pos - line.from + 1 };
            setCursor(nextCursor);
            if (active.path) setCursorPositions(old => ({ ...old, [active.path!]: nextCursor }));
          }
        })
      ]
    });
    const view = new EditorView({ state, parent: editorHost.current });
    editor.current = view;
    if (active.path) {
      const saved = cursorPositionsRef.current[active.path];
      if (saved) {
        const line = state.doc.line(Math.max(1, Math.min(state.doc.lines, saved.line)));
        const pos = Math.min(line.to, line.from + Math.max(0, saved.column - 1));
        view.dispatch({ selection: { anchor: pos } });
        setCursor({ line: line.number, column: pos - line.from + 1 });
      }
    }
    let alive = true;
    const language = languageFor(active.name);
    if (language) {
      void language.load().then(support => {
        if (alive) view.dispatch({ effects: StateEffect.appendConfig.of(support) });
      }).catch(error => setStatus("Language loading failed: " + String(error)));
    }
    return () => { alive = false; view.destroy(); if (editor.current === view) editor.current = null; };
  // A fresh CodeMirror state is created when switching tabs or changing editor zoom.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, editorFontSize, workspaceRestored, themeId]);

  useEffect(() => {
    if (!workspaceRestored || !terminalHost.current || terminal.current) return;
    const term = new Terminal({
      cursorBlink: true, fontFamily: "'JetBrains Mono', 'Iosevka Term', monospace", fontSize: terminalFontSize,
      theme: currentTheme.terminal
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(terminalHost.current);
    terminal.current = term;
    const data = term.onData(value => { void invoke("terminal_write", { data: value }).catch(e => setStatus(String(e))); });
    const unlisten = listen<string>("terminal-output", event => term.write(event.payload));
    const observer = new ResizeObserver(() => {
      try { fit.fit(); const size = fit.proposeDimensions(); if (size) void invoke("terminal_resize", { cols: size.cols, rows: size.rows }); } catch {}
    });
    observer.observe(terminalHost.current);
    void invoke("start_terminal", { cwd: root }).then(() => {
      setTerminalReady(true);
      requestAnimationFrame(() => { try { fit.fit(); const size = fit.proposeDimensions(); if (size) void invoke("terminal_resize", { cols: size.cols, rows: size.rows }); } catch {} });
    }).catch(e => setStatus("Terminal failed: " + String(e)));
    return () => {
      data.dispose(); void unlisten.then(fn => fn()); observer.disconnect(); term.dispose(); terminal.current = null;
      void invoke("terminal_close"); setTerminalReady(false);
    };
  }, [workspaceRestored]);

  useEffect(() => {
    if (terminal.current) terminal.current.options.theme = currentTheme.terminal;
  }, [themeId, currentTheme]);

  useEffect(() => {
    if (terminal.current) terminal.current.options.fontSize = terminalFontSize;
  }, [terminalFontSize]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "b") { e.preventDefault(); setSidebarVisible(v => !v); }
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); const d = docsRef.current.find(x => x.id === activeIdRef.current); if (d) void saveRef.current({ ...d, content: editor.current?.state.doc.toString() ?? d.content }); }
      if (mod && e.key.toLowerCase() === "o" && e.shiftKey) { e.preventDefault(); void openFolder(); }
      else if (mod && e.key.toLowerCase() === "o") { e.preventDefault(); void openFile(); }
      if (mod && e.key.toLowerCase() === "n") { e.preventDefault(); newFile(); }
      if (mod && e.key.toLowerCase() === "w") { e.preventDefault(); if (activeIdRef.current !== null) closeDoc(activeIdRef.current); }
      if (mod && e.key === "`") { e.preventDefault(); terminal.current?.focus(); }
      if (mod && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        if (focusedSurface === "terminal") setTerminalFontSize(v => Math.min(24, v + 1));
        else setEditorFontSize(v => Math.min(24, v + 1));
      }
      if (mod && e.key === "-") {
        e.preventDefault();
        if (focusedSurface === "terminal") setTerminalFontSize(v => Math.max(8, v - 1));
        else setEditorFontSize(v => Math.max(10, v - 1));
      }
      if (mod && e.key === "0") {
        e.preventDefault();
        if (focusedSurface === "terminal") setTerminalFontSize(13);
        else setEditorFontSize(14);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openFile, openFolder, focusedSurface]);

  useEffect(() => {
    const move = (e: MouseEvent) => { if (drag.current === "terminal") setTerminalHeight(Math.max(100, Math.min(window.innerHeight - 170, window.innerHeight - e.clientY - 22)));
      if (drag.current === "sidebar") setSidebarWidth(Math.max(160, Math.min(420, e.clientX))); };
    const up = () => { drag.current = false; };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, []);

  const renderTree = (entries: Entry[], depth = 0): ReactNode => entries.map(entry =>
    <div key={entry.path}>
      <button className={"tree-entry " + (entry.is_dir ? "directory" : "file")} style={{ paddingLeft: 10 + depth * 14 }} onClick={() => entry.is_dir ? void toggleDirectory(entry.path) : void openPath(entry.path)}>
        <span className="tree-arrow">{entry.is_dir ? (expanded.has(entry.path) ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : null}</span>
        <span className="tree-icon">
          {entry.is_dir
            ? (expanded.has(entry.path) ? <FolderOpen size={15} color="#89b4fa" /> : <Folder size={15} color="#89b4fa" />)
            : (() => { const { Icon, color } = fileIconFor(entry.name); return <Icon size={14} color={color} strokeWidth={1.8} />; })()}
        </span>
        <span className="tree-name">{entry.name}</span>
      </button>
      {entry.is_dir && expanded.has(entry.path) && tree[entry.path] && renderTree(tree[entry.path], depth + 1)}
    </div>
  );

  const startTerminalDrag = (e: ReactMouseEvent) => { e.preventDefault(); drag.current = "terminal"; };
  const startSidebarDrag = (e: ReactMouseEvent) => { e.preventDefault(); drag.current = "sidebar"; };

  return <main className="app-shell">
    <div className="tabs">
      {docs.map(doc => <div key={doc.id} className={"tab " + (doc.id === activeId ? "active" : "")} onClick={() => setActiveId(doc.id)}>
        <span className="tab-icon">{doc.name.endsWith(".sv") || doc.name.endsWith(".v") ? "◆" : "▤"}</span>
        <span className="tab-name">{doc.name}</span>{doc.dirty && <i className="dirty"/>}
        <button className="tab-close" title="Close tab" onClick={e => { e.stopPropagation(); closeDoc(doc.id); }}>×</button>
      </div>)}
      <div className="tabs-fill" data-tauri-drag-region/>
      <button className="sidebar-toggle" title={sidebarVisible ? "Hide sidebar (Ctrl+B)" : "Show sidebar (Ctrl+B)"} onClick={() => setSidebarVisible(v => !v)}>{sidebarVisible ? <PanelLeftClose size={15}/> : <PanelLeftOpen size={15}/>}</button>
    </div>
    <div className="workspace">
      {sidebarVisible && <>
        <aside className="explorer" style={{ width: sidebarWidth }}>
          <div className="explorer-root" title={root ?? "Open a folder"} onClick={() => void openFolder()}>
            <span className="tree-icon">{root ? <FolderOpen size={15} color="#89b4fa" /> : <Folder size={15} color="#89b4fa" />}</span><span className="root-name">{root ? base(root) : "OPEN FOLDER"}</span>
          </div>
          {root && tree[root] ? <div className="tree-list">{renderTree(tree[root])}</div> : <div className="empty-tree">Ctrl+Shift+O<br/>to open a folder</div>}
          <div className="explorer-footer">
            {settingsOpen && <div className="theme-picker" role="dialog" aria-label="Choose color theme">
              <div className="theme-picker-heading"><span>COLOR THEME</span><span>{Object.keys(themes).length} themes</span></div>
              {themeIds.map(id => {
                const theme = themes[id];
                const selected = themeId === id;
                return <button key={id} className={"theme-option " + (selected ? "selected" : "")} onClick={() => setThemeId(id)} aria-pressed={selected}>
                  <span className="theme-swatches"><i style={{background:theme.colors.bg}}/><i style={{background:theme.colors.accent}}/><i style={{background:theme.syntax.string}}/><i style={{background:theme.syntax.keyword}}/></span>
                  <span className="theme-option-copy"><strong>{theme.name}</strong><small>{theme.description}</small></span>
                  {selected && <Check size={15} className="theme-check"/>}
                </button>;
              })}
            </div>}
            <button className={"explorer-settings " + (settingsOpen ? "open" : "")} title="Appearance and themes" aria-label="Appearance and themes" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(value => !value)}>
              <Settings size={16}/>
            </button>
          </div>
        </aside>
        <div className="sidebar-resize" onMouseDown={startSidebarDrag} title="Drag to resize explorer"><span/></div>
      </>}
      <section className="editor-column">
        <div className="editor-host" ref={editorHost} onFocusCapture={() => setFocusedSurface("editor")} onMouseDown={() => setFocusedSurface("editor")} onWheel={e => { if (e.ctrlKey) { e.preventDefault(); setFocusedSurface("editor"); setEditorFontSize(v => Math.max(10, Math.min(24, v + (e.deltaY < 0 ? 1 : -1)))); } }}>
          {!active && <div className="empty-editor">Open a file or create a new one<br/><span>Ctrl+O · Ctrl+N</span></div>}
        </div>
        <div className="terminal-resize" onMouseDown={startTerminalDrag}><span/></div>
        <section className="terminal-panel" style={{ height: terminalHeight }}>
          <div className="terminal-heading"><span>TERMINAL</span><span className="terminal-state">{terminalReady ? "●" : "○"}</span></div>
          <div className="terminal-host" ref={terminalHost} onFocusCapture={() => setFocusedSurface("terminal")} onMouseDown={() => setFocusedSurface("terminal")} onWheel={e => { if (e.ctrlKey) { e.preventDefault(); setFocusedSurface("terminal"); setTerminalFontSize(v => Math.max(8, Math.min(24, v + (e.deltaY < 0 ? 1 : -1)))); } }}/>
        </section>
      </section>
    </div>
    <footer className="statusbar"><span>{status}</span><div><span>Ln {cursor.line}, Col {cursor.column}</span><span>UTF-8</span><span>{active?.name.split(".").pop()?.toUpperCase() ?? "TEXT"}</span></div></footer>
  </main>;
}
export default App;
