import sqlite3
conn=sqlite3.connect('app.db')
cur=conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
for (name,) in cur.fetchall():
    print('TABLE ' + name)
    for row in cur.execute(f'PRAGMA table_info({name})'):
        print(row)
    print('ROW COUNT', cur.execute(f'SELECT COUNT(*) FROM {name}').fetchone()[0])
    print('---')
conn.close()
