import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";


import { cpp } from "@codemirror/lang-cpp";
import { StreamLanguage } from "@codemirror/language";
import { verilog } from "@codemirror/legacy-modes/mode/verilog";
import { basicSetup } from "codemirror";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open, save } from "@tauri-apps/plugin-dialog";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Activity, ChevronDown, ChevronRight, Code2, FileCode2, FilePlus2, FolderOpen, PanelBottom, PanelLeft, Save, Search, Settings2, X } from "lucide-react";

type Document = { id: number; path: string | null; name: string; content: string; dirty: boolean };
const languageFor = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["v", "vh", "sv", "svh"].includes(ext ?? "")) return StreamLanguage.define(verilog);
  if (["c", "h", "cc", "cpp", "cxx", "hpp", "hh"].includes(ext ?? "")) return cpp();
  return [];
};
const basename = (path: string) => path.split(/[\\/]/).pop() || path;

function App() {
  const [docs, setDocs] = useState<Document[]>([{ id: 1, path: null, name: "untitled.sv", content: "", dirty: false }]);
  const [activeId, setActiveId] = useState(1);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [terminalReady, setTerminalReady] = useState(false);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [status, setStatus] = useState("Ready");
  const [terminalHeight, setTerminalHeight] = useState(230);
  const editorHost = useRef<HTMLDivElement>(null);
  const editorView = useRef<EditorView | null>(null);
  const terminalHost = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const dragRef = useRef(false);
  const active = docs.find(d => d.id === activeId) ?? docs[0];

  const updateDoc = useCallback((id: number, patch: Partial<Document>) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  }, []);

  const saveDoc = useCallback(async (doc: Document) => {
    try {
      let path = doc.path;
      if (!path) {
        const chosen = await save({ defaultPath: doc.name, filters: [{ name: "Source files", extensions: ["v","vh","sv","svh","c","h","cpp","hpp","txt"] }] });
        if (!chosen) return;
        path = chosen;
      }
      await invoke("write_file", { path, content: doc.content });
      updateDoc(doc.id, { path, name: basename(path), dirty: false });
      setStatus("Saved " + basename(path));
    } catch (e) { setStatus("Save failed: " + String(e)); }
  }, [updateDoc]);

  const openFile = useCallback(async () => {
    try {
      const selected = await open({ multiple: false, filters: [{ name: "Source files", extensions: ["v","vh","sv","svh","c","h","cpp","hpp","cc","txt","md","json","toml","rs"] }] });
      if (!selected || Array.isArray(selected)) return;
      const existing = docs.find(d => d.path === selected);
      if (existing) { setActiveId(existing.id); return; }
      const content = await invoke<string>("read_file", { path: selected });
      const doc = { id: Date.now(), path: selected, name: basename(selected), content, dirty: false };
      setDocs(prev => [...prev, doc]); setActiveId(doc.id); setStatus("Opened " + doc.name);
    } catch (e) { setStatus("Open failed: " + String(e)); }
  }, [docs]);

  const newFile = () => {
    const doc = { id: Date.now(), path: null, name: "untitled.sv", content: "", dirty: false };
    setDocs(prev => [...prev, doc]); setActiveId(doc.id);
  };

  useEffect(() => {
    if (!editorHost.current) return;
    const saveKey = keymap.of([{ key: "Mod-s", run: () => { const d = docs.find(x => x.id === activeId); if (d) void saveDoc(d); return true; } }]);
    const state = EditorState.create({
      doc: active.content,
      extensions: [
        basicSetup, languageFor(active.name), EditorView.lineWrapping, saveKey,
        EditorView.theme({
          "&": { height: "100%", backgroundColor: "#191a26", color: "#c0c1d2", fontSize: "14px" },
          ".cm-content": { fontFamily: "'JetBrains Mono', 'Iosevka Term', monospace", padding: "18px 0", caretColor: "#b7a0e5" },
          ".cm-gutters": { backgroundColor: "#191a26", color: "#666b85", border: "none", minWidth: "54px" },
          ".cm-activeLineGutter": { backgroundColor: "#222438", color: "#c2b2e7" },
          ".cm-activeLine": { backgroundColor: "#202235" },
          ".cm-cursor": { borderLeftColor: "#b7a0e5" },
          ".cm-selectionBackground, ::selection": { backgroundColor: "#45415f !important" },
          ".cm-focused .cm-selectionBackground": { backgroundColor: "#45415f" },
          ".cm-tooltip": { backgroundColor: "#252638", border: "1px solid #3b3b54" },
          ".cm-panels": { backgroundColor: "#202235", color: "#c0c1d2" }
        }),
        EditorView.updateListener.of(update => {
          if (update.docChanged) updateDoc(activeId, { content: update.state.doc.toString(), dirty: true });
          if (update.selectionSet) {
            const pos = update.state.selection.main.head;
            const line = update.state.doc.lineAt(pos);
            setCursor({ line: line.number, column: pos - line.from + 1 });
          }
        }),
      ],
    });
    editorView.current = new EditorView({ state, parent: editorHost.current });
    return () => { editorView.current?.destroy(); editorView.current = null; };
  // Recreate only when switching documents; edits are persisted by update listener.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    const view = editorView.current;
    if (view && view.state.doc.toString() !== active.content) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: active.content } });
    }
  }, [active.content, activeId]);

  useEffect(() => {
    if (!terminalOpen || !terminalHost.current || terminalRef.current) return;
    const term = new Terminal({
      cursorBlink: true, fontFamily: "'JetBrains Mono', 'Iosevka Term', monospace",
      fontSize: 13, theme: { background: "#1f2130", foreground: "#c0c1d2", cursor: "#b7a0e5", selectionBackground: "#45415f", black: "#191a26", red: "#d88791", green: "#b1c384", yellow: "#cdb27e", blue: "#9ba9d5", magenta: "#b7a0e5", cyan: "#8db9b4", white: "#c0c1d2" },
    });
    const fit = new FitAddon(); term.loadAddon(fit); term.open(terminalHost.current); term.write("\r\n  Code terminal · CachyOS\r\n");
    terminalRef.current = term; fitRef.current = fit;
    const data = term.onData(value => { void invoke("terminal_write", { data: value }).catch(e => setStatus(String(e))); });
    const unlisten = listen<string>("terminal-output", event => term.write(event.payload));
    const ro = new ResizeObserver(() => { try { fit.fit(); const dims = fit.proposeDimensions(); if (dims) void invoke("terminal_resize", { cols: dims.cols, rows: dims.rows }); } catch {} });
    ro.observe(terminalHost.current);
    void invoke("start_terminal").then(() => { setTerminalReady(true); setTimeout(() => { try { fit.fit(); const d = fit.proposeDimensions(); if (d) void invoke("terminal_resize", { cols: d.cols, rows: d.rows }); } catch {} }, 80); }).catch(e => setStatus("Terminal failed: " + String(e)));
    return () => { data.dispose(); void unlisten.then(fn => fn()); ro.disconnect(); term.dispose(); terminalRef.current = null; fitRef.current = null; void invoke("terminal_close"); setTerminalReady(false); };
  }, [terminalOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") { e.preventDefault(); void openFile(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") { e.preventDefault(); newFile(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "`") { e.preventDefault(); setTerminalOpen(v => !v); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openFile]);

  useEffect(() => {
    const move = (e: MouseEvent) => { if (dragRef.current) setTerminalHeight(Math.max(120, Math.min(window.innerHeight - 250, window.innerHeight - e.clientY - 32))); };
    const up = () => { dragRef.current = false; };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, []);

  const startDrag = (e: ReactMouseEvent) => { e.preventDefault(); dragRef.current = true; };
  const closeDoc = (id: number) => {
    if (docs.find(d => d.id === id)?.dirty && !window.confirm("Discard unsaved changes?")) return;
    const next = docs.filter(d => d.id !== id);
    if (!next.length) { const fresh = { id: Date.now(), path: null, name: "untitled.sv", content: "", dirty: false }; setDocs([fresh]); setActiveId(fresh.id); }
    else { setDocs(next); if (activeId === id) setActiveId(next[next.length - 1].id); }
  };

  return <main className="app-shell">
    <header className="titlebar">
      <div className="brand"><div className="brand-mark"><Code2 size={16}/></div><span>code</span><span className="brand-dot">.</span></div>
      <div className="titlebar-center">CodeEditor <span className="title-muted">— Linux</span></div>
      <div className="title-actions">
        <button title="New file (Ctrl+N)" onClick={newFile}><FilePlus2 size={16}/></button>
        <button title="Open file (Ctrl+O)" onClick={() => void openFile()}><FolderOpen size={16}/></button>
        <button title="Save (Ctrl+S)" onClick={() => void saveDoc(active)}><Save size={16}/></button>
      </div>
    </header>
    <div className="workspace">
      {sidebarOpen && <aside className="sidebar">
        <div className="side-heading"><span>EXPLORER</span><button title="New file" onClick={newFile}><FilePlus2 size={14}/></button></div>
        <div className="tree-root"><ChevronDown size={13}/><span>OPEN EDITORS</span></div>
        {docs.map(d => <button key={d.id} className={"tree-file " + (d.id === activeId ? "selected" : "")} onClick={() => setActiveId(d.id)}><FileCode2 size={14}/><span>{d.name}</span>{d.dirty && <i/>}</button>)}
        <div className="side-footer"><span>LINUX WORKSPACE</span><Activity size={13}/></div>
      </aside>}
      <section className="main-column">
        <div className="tabs">
          <button className="sidebar-toggle" title="Toggle explorer" onClick={() => setSidebarOpen(v => !v)}><PanelLeft size={15}/></button>
          {docs.map(d => <div key={d.id} className={"tab " + (d.id === activeId ? "active" : "")} onClick={() => setActiveId(d.id)}><FileCode2 size={14}/><span>{d.name}</span>{d.dirty && <i/>}<button title="Close tab" onClick={e => { e.stopPropagation(); closeDoc(d.id); }}><X size={13}/></button></div>)}
          <div className="tabs-spacer"/>
          <button className="icon-button" title="Toggle terminal" onClick={() => setTerminalOpen(v => !v)}><PanelBottom size={16}/></button>
          <button className="icon-button" title="Settings (coming later)" onClick={() => setStatus("Settings are not implemented yet")}><Settings2 size={16}/></button>
        </div>
        <div className="editor-area"><div className="breadcrumbs"><span>workspace</span><ChevronRight size={12}/><span className="crumb-active">{active.name}</span></div><div className="editor-host" ref={editorHost}/></div>
        {terminalOpen && <>
          <div className="terminal-resize" onMouseDown={startDrag}><span/></div>
          <section className="terminal-panel" style={{ height: terminalHeight }}>
            <div className="terminal-heading"><div className="terminal-tabs"><span className="terminal-active">TERMINAL</span><span>OUTPUT</span></div><div className="terminal-controls"><span className="terminal-state">{terminalReady ? "● CONNECTED" : "○ STARTING"}</span><button title="Close terminal" onClick={() => setTerminalOpen(false)}><X size={14}/></button></div></div>
            <div className="terminal-host" ref={terminalHost}/>
          </section>
        </>}
      </section>
    </div>
    <footer className="statusbar"><div className="status-left"><span className="status-branch">⌁</span><span>{status}</span></div><div className="status-right"><span>Ln {cursor.line}, Col {cursor.column}</span><span>UTF-8</span><span>{active.name.split(".").pop()?.toUpperCase() ?? "TEXT"}</span><span>Linux</span></div></footer>
  </main>;
}
export default App;