use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Offline POS local database: products/customers are synced down from
  // Laravel for lookup while offline; pending_sales holds sales made while
  // offline, tagged with a UUID + terminal/cashier id so they can be synced
  // back up exactly once, from any of several POS terminals.
  let migrations = vec![Migration {
    version: 1,
    description: "create offline pos tables",
    sql: r#"
      CREATE TABLE IF NOT EXISTS products (
        stock_id TEXT PRIMARY KEY,
        barcode TEXT,
        description TEXT NOT NULL,
        unit_price REAL NOT NULL,
        updated_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

      CREATE TABLE IF NOT EXISTS customers (
        debtor_no TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        branch_code TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS pending_sales (
        uuid TEXT PRIMARY KEY,
        terminal_id TEXT NOT NULL,
        cashier_id TEXT NOT NULL,
        customer_id TEXT,
        payload TEXT NOT NULL,
        total REAL NOT NULL,
        created_at TEXT NOT NULL,
        synced_at TEXT,
        sync_error TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_pending_sales_synced ON pending_sales(synced_at);
    "#,
    kind: MigrationKind::Up,
  }, Migration {
    version: 2,
    // Cached logged-in users, synced down whenever online — lets the app
    // recognise an already-authenticated cashier and restore their session
    // (with permissions) when opened with no connection at all, instead of
    // relying on browser localStorage.
    description: "create offline users table",
    sql: r#"
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        name TEXT,
        user_json TEXT NOT NULL,
        permission_ids TEXT NOT NULL,
        edit_permission_ids TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    "#,
    kind: MigrationKind::Up,
  }];

  tauri::Builder::default()
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:pos.db", migrations)
        .build(),
    )
    // Auto-update: checks the endpoint configured in tauri.conf.json,
    // downloads and installs a newer signed build, then plugin-process
    // restarts the app to apply it — see src/offline/updater.ts for the
    // check/install call from the frontend.
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
