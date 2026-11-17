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
import { ChevronDown, ChevronRight, Folder, FolderOpen, File, FileCode2, FileJson, FileText, FileImage, FileArchive, FileSpreadsheet, FileVideo, FileAudio, FileTerminal, FileType, FileCog, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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

const catppuccinHighlight = HighlightStyle.define([
  { tag: tags.comment, color: "#6c7086", fontStyle: "italic" },
  { tag: [tags.string, tags.docString, tags.character, tags.attributeValue], color: "#a6e3a1" },
  { tag: [tags.number, tags.integer, tags.float, tags.bool], color: "#fab387" },
  { tag: [tags.keyword, tags.controlKeyword, tags.definitionKeyword, tags.moduleKeyword, tags.operatorKeyword], color: "#cba6f7" },
  { tag: [tags.typeName, tags.className, tags.namespace], color: "#f9e2af" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "#89b4fa" },
  { tag: [tags.variableName, tags.self, tags.special(tags.variableName)], color: "#cdd6f4" },
  { tag: [tags.propertyName, tags.attributeName], color: "#89dceb" },
  { tag: [tags.operator, tags.punctuation, tags.separator], color: "#94e2d5" },
  { tag: [tags.tagName], color: "#f38ba8" },
  { tag: [tags.regexp, tags.escape], color: "#f5c2e7" },
  { tag: [tags.meta, tags.annotation], color: "#fab387" },
  { tag: [tags.heading, tags.heading1, tags.heading2, tags.heading3], color: "#89b4fa", fontWeight: "bold" },
  { tag: [tags.invalid], color: "#f38ba8", textDecoration: "underline wavy" }
]);

function App() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [root, setRoot] = useState<string | null>(null);
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
    if (!editorHost.current || !active) { editor.current?.destroy(); editor.current = null; return; }
    const state = EditorState.create({
      doc: active.content,
      extensions: [
        basicSetup, EditorView.lineWrapping, syntaxHighlighting(catppuccinHighlight),
        EditorView.theme({
          "&": { height: "100%", backgroundColor: "#1e1e2e", color: "#cdd6f4", fontSize: editorFontSize + "px" },
          ".cm-content": { fontFamily: "'JetBrains Mono', 'Iosevka Term', monospace", padding: "12px 0", caretColor: "#f5e0dc" },
          ".cm-line": { paddingLeft: "4px" },
          ".cm-gutters": { backgroundColor: "#181825", color: "#6c7086", border: "none", minWidth: "48px" },
          ".cm-activeLineGutter": { backgroundColor: "#313244", color: "#b4befe" },
          ".cm-activeLine": { backgroundColor: "#242438" },
          ".cm-cursor": { borderLeftColor: "#f5e0dc" },
          ".cm-selectionBackground, ::selection": { backgroundColor: "#45475a !important" },
          ".cm-focused .cm-selectionBackground": { backgroundColor: "#45475a" },
          ".cm-tooltip": { backgroundColor: "#313244", border: "1px solid #585b70", color: "#cdd6f4" },
          ".cm-tooltip-autocomplete ul li[aria-selected]": { backgroundColor: "#45475a", color: "#cdd6f4" },
          ".cm-panels": { backgroundColor: "#181825", color: "#cdd6f4" },
          ".cm-searchMatch": { backgroundColor: "#f9e2af55", outline: "1px solid #f9e2af" },
          ".cm-searchMatch-selected": { backgroundColor: "#f9e2af88" }
        }),
        EditorView.updateListener.of(update => {
          if (update.docChanged) patchDoc(activeId!, { content: update.state.doc.toString(), dirty: true });
          if (update.selectionSet) {
            const pos = update.state.selection.main.head;
            const line = update.state.doc.lineAt(pos);
            setCursor({ line: line.number, column: pos - line.from + 1 });
          }
        })
      ]
    });
    const view = new EditorView({ state, parent: editorHost.current });
    editor.current = view;
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
  }, [activeId, editorFontSize]);

  useEffect(() => {
    if (!terminalHost.current || terminal.current) return;
    const term = new Terminal({
      cursorBlink: true, fontFamily: "'JetBrains Mono', 'Iosevka Term', monospace", fontSize: terminalFontSize,
      theme: { background: "#11111b", foreground: "#cdd6f4", cursor: "#f5e0dc", cursorAccent: "#11111b", selectionBackground: "#45475a", black: "#181825", red: "#f38ba8", green: "#a6e3a1", yellow: "#f9e2af", blue: "#89b4fa", magenta: "#cba6f7", cyan: "#89dceb", white: "#bac2de", brightBlack: "#585b70", brightRed: "#f38ba8", brightGreen: "#a6e3a1", brightYellow: "#f9e2af", brightBlue: "#89b4fa", brightMagenta: "#cba6f7", brightCyan: "#89dceb", brightWhite: "#a6adc8" }
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
    void invoke("start_terminal").then(() => {
      setTerminalReady(true);
      requestAnimationFrame(() => { try { fit.fit(); const size = fit.proposeDimensions(); if (size) void invoke("terminal_resize", { cols: size.cols, rows: size.rows }); } catch {} });
    }).catch(e => setStatus("Terminal failed: " + String(e)));
    return () => {
      data.dispose(); void unlisten.then(fn => fn()); observer.disconnect(); term.dispose(); terminal.current = null;
      void invoke("terminal_close"); setTerminalReady(false);
    };
  }, []);

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
