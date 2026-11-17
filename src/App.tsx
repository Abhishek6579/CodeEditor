import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { StreamLanguage } from "@codemirror/language";
import { verilog } from "@codemirror/legacy-modes/mode/verilog";
import { cpp } from "@codemirror/lang-cpp";
import { basicSetup } from "codemirror";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open, save } from "@tauri-apps/plugin-dialog";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { ChevronDown, ChevronRight, Folder, FolderOpen, File, FileCode2, PanelLeftClose, PanelLeftOpen } from "lucide-react";

type Doc = { id: number; path: string | null; name: string; content: string; dirty: boolean };
type Entry = { name: string; path: string; is_dir: boolean };
const base = (p: string) => p.split(/[\\/]/).filter(Boolean).pop() || p;
const modeFor = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["v", "vh", "sv", "svh"].includes(ext || "")) return StreamLanguage.define(verilog);
  if (["c", "h", "cc", "cpp", "cxx", "hpp", "hh"].includes(ext || "")) return cpp();
  return [];
};

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
  const [fontSize, setFontSize] = useState(14);
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
        basicSetup, modeFor(active.name), EditorView.lineWrapping,
        EditorView.theme({
          "&": { height: "100%", backgroundColor: "#191a26", color: "#c0c1d2", fontSize: fontSize + "px" },
          ".cm-content": { fontFamily: "'JetBrains Mono', 'Iosevka Term', monospace", padding: "10px 0", caretColor: "#b7a0e5" },
          ".cm-gutters": { backgroundColor: "#191a26", color: "#666b85", border: "none", minWidth: "42px" },
          ".cm-activeLineGutter": { backgroundColor: "#222438", color: "#c2b2e7" },
          ".cm-activeLine": { backgroundColor: "#202235" },
          ".cm-cursor": { borderLeftColor: "#b7a0e5" },
          ".cm-selectionBackground, ::selection": { backgroundColor: "#45415f !important" },
          ".cm-focused .cm-selectionBackground": { backgroundColor: "#45415f" },
          ".cm-tooltip": { backgroundColor: "#252638", border: "1px solid #3b3b54" },
          ".cm-panels": { backgroundColor: "#202235", color: "#c0c1d2" }
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
    editor.current = new EditorView({ state, parent: editorHost.current });
    return () => { editor.current?.destroy(); editor.current = null; };
  // A fresh CodeMirror state is created when switching tabs or changing editor zoom.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, fontSize]);

  useEffect(() => {
    if (!terminalHost.current || terminal.current) return;
    const term = new Terminal({
      cursorBlink: true, fontFamily: "'JetBrains Mono', 'Iosevka Term', monospace", fontSize,
      theme: { background: "#1f2130", foreground: "#c0c1d2", cursor: "#b7a0e5", selectionBackground: "#45415f", black: "#191a26", red: "#d88791", green: "#b1c384", yellow: "#cdb27e", blue: "#9ba9d5", magenta: "#b7a0e5", cyan: "#8db9b4", white: "#c0c1d2" }
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
    if (terminal.current) terminal.current.options.fontSize = fontSize;
  }, [fontSize]);

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
      if (mod && (e.key === "=" || e.key === "+")) { e.preventDefault(); setFontSize(v => Math.min(24, v + 1)); }
      if (mod && e.key === "-") { e.preventDefault(); setFontSize(v => Math.max(10, v - 1)); }
      if (mod && e.key === "0") { e.preventDefault(); setFontSize(14); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openFile, openFolder]);

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
        <span className="tree-arrow">{entry.is_dir ? (expanded.has(entry.path) ? "▾" : "▸") : ""}</span>
        <span className="tree-icon">{entry.is_dir ? "▰" : "▤"}</span><span className="tree-name">{entry.name}</span>
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
      <aside className="explorer">
        <div className="explorer-root" title={root ?? "Open a folder"} onClick={() => void openFolder()}>
          <span>{root ? "▾" : "▸"}</span><span className="root-name">{root ? base(root) : "OPEN FOLDER"}</span>
        </div>
        {root && tree[root] ? <div className="tree-list">{renderTree(tree[root])}</div> : <div className="empty-tree">Ctrl+Shift+O<br/>to open a folder</div>}
      </aside>
      <section className="editor-column">
        <div className="editor-host" ref={editorHost}>
          {!active && <div className="empty-editor">Open a file or create a new one<br/><span>Ctrl+O · Ctrl+N</span></div>}
        </div>
        <div className="terminal-resize" onMouseDown={startTerminalDrag}><span/></div>
        <section className="terminal-panel" style={{ height: terminalHeight }}>
          <div className="terminal-heading"><span>TERMINAL</span><span className="terminal-state">{terminalReady ? "●" : "○"}</span></div>
          <div className="terminal-host" ref={terminalHost}/>
        </section>
      </section>
    </div>
    <footer className="statusbar"><span>{status}</span><div><span>Ln {cursor.line}, Col {cursor.column}</span><span>UTF-8</span><span>{active?.name.split(".").pop()?.toUpperCase() ?? "TEXT"}</span></div></footer>
  </main>;
}
export default App;
