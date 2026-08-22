const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('sena.db');

console.log("--- ROLES ---");
db.all("SELECT * FROM roles", [], (err, rows) => {
  if (err) console.error(err);
  else console.log(rows);
});

console.log("--- AREAS ---");
db.all("SELECT * FROM areas", [], (err, rows) => {
  if (err) console.error(err);
  else console.log(rows);
});

console.log("--- USUARIOS ---");
db.all("SELECT id_usuario, nombre_completo, numero_documento, correo, id_rol, id_area FROM usuarios", [], (err, rows) => {
  if (err) console.error(err);
  else {
    console.log(rows);
    db.close();
  }
});
