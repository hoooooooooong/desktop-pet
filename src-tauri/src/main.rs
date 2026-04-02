#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, RunEvent,
};

static QUIT_REQUESTED: AtomicBool = AtomicBool::new(false);

#[tauri::command]
fn move_window(window: tauri::Window, x: f64, y: f64) -> Result<(), String> {
    use tauri::LogicalPosition;
    window
        .set_position(LogicalPosition::new(x, y))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn resize_window(window: tauri::Window, width: f64, height: f64) -> Result<(), String> {
    use tauri::LogicalSize;
    window
        .set_size(LogicalSize::new(width, height))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn reset_window_size(window: tauri::Window) -> Result<(), String> {
    use tauri::LogicalSize;
    window
        .set_size(LogicalSize::new(320.0, 400.0))
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            move_window,
            resize_window,
            reset_window_size
        ])
        .setup(|app| {
            let show_item = MenuItem::with_id(app, "show", "显示小龙", true, None::<&str>)?;
            let hide_item = MenuItem::with_id(app, "hide", "隐藏小龙", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&show_item, &hide_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("像素小龙桌面宠物")
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "hide" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.hide();
                            }
                        }
                        "quit" => {
                            QUIT_REQUESTED.store(true, Ordering::SeqCst);
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            // Set transparent background color for the webview
            if let Some(window) = app.get_webview_window("main") {
                use tauri::window::Color;
                let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            if let RunEvent::ExitRequested { api, .. } = event {
                if !QUIT_REQUESTED.load(Ordering::SeqCst) {
                    api.prevent_exit();
                }
            }
        });
}
