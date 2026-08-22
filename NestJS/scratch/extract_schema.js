const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('sena.db');

db.all("SELECT sql FROM sqlite_master WHERE type='table';", [], (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  rows.forEach(row => {
    if (row.sql) {
      console.log(row.sql + ";\n");
    }
  });
  db.close();
});
