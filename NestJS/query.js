const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:@localhost:5432/stimi_db' });
client.connect().then(() => {
  return client.query("SELECT p.id_usuario, p.nombre_completo, p.correo, p.id_area, r.nombre_rol FROM usuarios p LEFT JOIN roles r ON p.id_rol = r.id_rol WHERE p.correo IN ('coordinador@gmail.com', 'instructor@gmail.com')");
}).then(res => {
  console.log('Usuarios:', res.rows);
  client.end();
}).catch(err => {
  console.error('Error:', err.message);
  client.end();
});
