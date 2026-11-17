use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use std::{io::{Read, Write}, path::PathBuf, sync::Mutex, thread};
use tauri::{AppHandle, Emitter, State};

struct Session {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    _child: Box<dyn portable_pty::Child + Send + Sync>,
}
#[derive(Default)]
struct TerminalState(Mutex<Option<Session>>);

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| format!("{}: {e}", path))
}
#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    let p = PathBuf::from(&path);
    if let Some(parent) = p.parent() { if !parent.as_os_str().is_empty() { std::fs::create_dir_all(parent).map_err(|e| e.to_string())?; } }
    std::fs::write(&p, content).map_err(|e| format!("{}: {e}", p.display()))
}

#[tauri::command]
fn start_terminal(app: AppHandle, state: State<'_, TerminalState>) -> Result<(), String> {
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    if slot.is_some() { return Ok(()); }
    let pty = native_pty_system();
    let pair = pty.openpty(PtySize { rows: 24, cols: 80, pixel_width: 0, pixel_height: 0 }).map_err(|e| e.to_string())?;
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string());
    let mut cmd = CommandBuilder::new(shell);
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    drop(pair.slave);
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    *slot = Some(Session { master: pair.master, writer, _child: child });
    thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => { let text = String::from_utf8_lossy(&buf[..n]).to_string(); if app.emit("terminal-output", text).is_err() { break; } }
                Err(_) => break,
            }
        }
        let _ = app.emit("terminal-exit", ());
    });
    Ok(())
}
#[tauri::command]
fn terminal_write(data: String, state: State<'_, TerminalState>) -> Result<(), String> {
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    let session = slot.as_mut().ok_or("Terminal is not running")?;
    session.writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
    session.writer.flush().map_err(|e| e.to_string())
}
#[tauri::command]
fn terminal_resize(cols: u16, rows: u16, state: State<'_, TerminalState>) -> Result<(), String> {
    let slot = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(session) = slot.as_ref() {
        session.master.resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 }).map_err(|e| e.to_string())?;
    }
    Ok(())
}
#[tauri::command]
fn terminal_close(state: State<'_, TerminalState>) -> Result<(), String> {
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    slot.take();
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(TerminalState::default())
        .invoke_handler(tauri::generate_handler![read_file, write_file, start_terminal, terminal_write, terminal_resize, terminal_close])
        .run(tauri::generate_context!())
        .expect("error while running Code");
}
fn main() { code_editor_lib::run(); }
