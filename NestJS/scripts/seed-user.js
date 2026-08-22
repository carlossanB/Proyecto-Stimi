const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');
const path = require('path');

(async () => {
  const ds = new DataSource({
    type: 'sqljs',
    autoSave: true,
    location: path.join(process.cwd(), 'sena.db'),
    entities: [path.join(process.cwd(), 'dist', '**', '*.entity.js')],
    synchronize: true,
  });

  await ds.initialize();
  const repo = ds.getRepository(require(path.join(process.cwd(), 'dist', 'personas', 'entities', 'persona.entity.js')).Persona);
  const existing = await repo.findOne({ where: { correo: 'instructor@sena.edu.co' } });

  if (!existing) {
    await repo.save(repo.create({
      nombre_completo: 'Instructor Demo',
      tipo_documento: 'CC',
      numero_documento: '1234567890',
      correo: 'instructor@sena.edu.co',
      contrasena_hash: bcrypt.hashSync('Sena1234', 10),
      estado_cuenta: 'aprobado',
    }));
    console.log('Usuario demo creado');
  } else {
    console.log('Usuario demo ya existe');
  }

  await ds.destroy();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
