use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use serde::Serialize;
use std::{io::{Read, Write}, path::PathBuf, sync::Mutex, thread};
use tauri::{AppHandle, Emitter, State};

struct Session {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    _child: Box<dyn portable_pty::Child + Send + Sync>,
}
#[derive(Default)]
struct TerminalState(Mutex<Option<Session>>);

#[derive(Serialize)]
struct DirectoryEntry {
    name: String,
    path: String,
    is_dir: bool,
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| format!("{}: {e}", path))
}
#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    let p = PathBuf::from(&path);
    std::fs::write(&p, content).map_err(|e| format!("{}: {e}", p.display()))
}
#[tauri::command]
fn list_dir(path: String) -> Result<Vec<DirectoryEntry>, String> {
    let mut entries = Vec::new();
    for item in std::fs::read_dir(&path).map_err(|e| format!("{}: {e}", path))? {
        let item = item.map_err(|e| e.to_string())?;
        let file_type = item.file_type().map_err(|e| e.to_string())?;
        let name = item.file_name().to_string_lossy().to_string();
        entries.push(DirectoryEntry {
            name,
            path: item.path().to_string_lossy().to_string(),
            is_dir: file_type.is_dir(),
        });
    }
    entries.sort_by(|a, b| b.is_dir.cmp(&a.is_dir).then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase())));
    Ok(entries)
}

#[tauri::command]
fn start_terminal(app: AppHandle, state: State<'_, TerminalState>, cwd: Option<String>) -> Result<(), String> {
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    if slot.is_some() { return Ok(()); }
    let pair = native_pty_system().openpty(PtySize { rows: 24, cols: 80, pixel_width: 0, pixel_height: 0 }).map_err(|e| e.to_string())?;
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string());
    let mut cmd = CommandBuilder::new(&shell);
    if let Some(path) = cwd.filter(|path| std::path::Path::new(path).is_dir()) {
        cmd.cwd(path);
    }
    let shell_name = std::path::Path::new(&shell).file_name().and_then(|name| name.to_str()).unwrap_or("");
    match shell_name {
        "fish" => { cmd.arg("--no-config"); }
        "bash" => { cmd.arg("--noprofile"); cmd.arg("--norc"); }
        "zsh" => { cmd.arg("--no-rcs"); }
        _ => {}
    }
    // Keep AppImage's private loader paths out of the integrated shell and
    // programs it launches. Do not change Milize's own process environment.
    #[cfg(target_os = "linux")]
    {
        let app_dir = std::env::var_os("APPDIR").map(PathBuf::from);
        let is_appimage_path = |path: &std::path::Path| {
            let inside_appdir = app_dir.as_ref().is_some_and(|dir| path.starts_with(dir));
            let inside_mount = path.components().any(|component| {
                component.as_os_str().to_str().is_some_and(|part| part.starts_with(".mount_"))
            });
            inside_appdir || inside_mount
        };

        if let Some(value) = std::env::var_os("LD_LIBRARY_PATH") {
            let paths = std::env::split_paths(&value)
                .filter(|path| !is_appimage_path(path))
                .collect::<Vec<_>>();
            if paths.is_empty() {
                cmd.env_remove("LD_LIBRARY_PATH");
            } else if let Ok(cleaned) = std::env::join_paths(paths) {
                cmd.env("LD_LIBRARY_PATH", cleaned);
            }
        }

        // The loader treats LD_PRELOAD and LD_AUDIT as whitespace/colon
        // separated lists, not as PATH-style lists.
        for variable in ["LD_PRELOAD", "LD_AUDIT"] {
            if let Some(value) = std::env::var(variable).ok() {
                let entries = value
                    .split(|character: char| character.is_whitespace() || character == ':')
                    .filter(|entry| !entry.is_empty())
                    .filter(|entry| !is_appimage_path(std::path::Path::new(entry)))
                    .collect::<Vec<_>>();
                if entries.is_empty() {
                    cmd.env_remove(variable);
                } else {
                    cmd.env(variable, entries.join(" "));
                }
            }
        }
    }

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
                Ok(n) => {
                    let text = String::from_utf8_lossy(&buf[..n]).to_string();
                    if app.emit("terminal-output", text).is_err() { break; }
                }
                Err(_) => break,
            }
        }
        let _ = app.emit("terminal-exit", ());
    });
    Ok(())
}
#[tauri::command]
fn terminal_change_directory(path: String, state: State<'_, TerminalState>) -> Result<(), String> {
    if !std::path::Path::new(&path).is_dir() {
        return Err(format!("Not a directory: {path}"));
    }
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    let session = slot.as_mut().ok_or("Terminal is not running")?;
    session.writer.write_all(format!("cd '{}'\n", path.replace('\'', "'\\''")).as_bytes()).map_err(|e| e.to_string())?;
    session.writer.flush().map_err(|e| e.to_string())
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
        .invoke_handler(tauri::generate_handler![read_file, write_file, list_dir, start_terminal, terminal_change_directory, terminal_write, terminal_resize, terminal_close])
        .run(tauri::generate_context!())
        .expect("error while running Milize");
}
