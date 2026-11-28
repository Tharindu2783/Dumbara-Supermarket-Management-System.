import sqlite3, os
path = 'app.db'
print('DATABASE_PATH', os.path.abspath(path))
print('DATABASE_EXISTS', os.path.exists(path))
conn = sqlite3.connect(path)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
rows = cur.fetchall()
print('TABLE_COUNT', len(rows))
for (name,) in rows:
    print('TABLE', name)
    col_rows = cur.execute(f'PRAGMA table_info({name})').fetchall()
    for col in col_rows:
        print('  COLUMN', col)
    count = cur.execute(f'SELECT COUNT(*) FROM {name}').fetchone()[0]
    print('  ROW_COUNT', count)
    print('---')
conn.close()
