// backend/setup_db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("🔄 Initializing RBAC Database Setup...");

    // Helper to add missing column to a table safely
    const addColumn = (tableName, columnName, columnType, defaultValue = "''") => {
        return new Promise((resolve) => {
            const query = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType} DEFAULT ${defaultValue}`;
            db.run(query, (err) => {
                if (err) {
                    if (err.message.includes("duplicate column name")) {
                        console.log(`ℹ️ Column '${columnName}' already exists in '${tableName}'. Skipping...`);
                    } else {
                        console.error(`❌ Error adding '${columnName}' to '${tableName}':`, err.message);
                    }
                } else {
                    console.log(`✅ Added '${columnName}' column to '${tableName}' table.`);
                }
                resolve();
            });
        });
    };

    // Ensure default Admin / Owner account exists in the database
    const seedDefaultAdmin = () => {
        return new Promise((resolve) => {
            const checkAdminQuery = `SELECT * FROM user WHERE Role = 'Admin' OR UserName = 'admin'`;
            
            db.get(checkAdminQuery, [], (err, row) => {
                if (err) {
                    console.error("❌ Error checking admin user:", err.message);
                    return resolve();
                }

                if (!row) {
                    const defaultPassword = 'admin123'; 
                    const insertAdminQuery = `
                        INSERT INTO user (UserName, password, contact, Role, email, nic, address, birthday, phone)
                        VALUES (?, ?, ?, 'Admin', ?, ?, ?, ?, ?)
                    `;

                    db.run(insertAdminQuery, [
                        'admin',
                        defaultPassword,
                        '0700000000',
                        'admin@system.com',
                        '000000000V',
                        'Head Office',
                        '1990-01-01',
                        '0700000000'
                    ], (insertErr) => {
                        if (insertErr) {
                            console.error("❌ Error creating default Admin user:", insertErr.message);
                        } else {
                            console.log("👑 Default Admin Account created successfully!");
                            console.log("👉 Username: admin | Password: admin123");
                        }
                        resolve();
                    });
                } else {
                    console.log("ℹ️ Admin Account already exists in DB. Skipping creation...");
                    resolve();
                }
            });
        });
    };

    async function runDatabaseUpdates() {
        // Ensure Role column exists with default 'Assistant'
        await addColumn('user', 'Role', 'TEXT', "'Assistant'");
        
        // Seed default system Admin (Owner)
        await seedDefaultAdmin();

        db.close((closeErr) => {
            if (closeErr) console.error("❌ DB Close Error:", closeErr.message);
            else console.log("🔒 RBAC Database setup completed successfully!");
        });
    }

    runDatabaseUpdates();
});