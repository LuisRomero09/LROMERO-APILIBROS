import express from 'express';
import swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import mysql from 'mysql2';
import fs from 'fs'; // Módulo para leer archivos

// Cargar variables de entorno desde el archivo .env
dotenv.config();

// Leer el archivo README.md
const readmeContent = fs.readFileSync('./README.md', 'utf-8');

// Crear la aplicación Express
const app = express();
const port = process.env.PORT || 8083; // Usa el puerto desde el archivo .env

// Configuración de Swagger
const definicionSwagger = {
  openapi: '3.0.0',
  info: {
    title: 'API Libros',
    version: '1.0.0',
    description: readmeContent, // Agregar contenido del README.md
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'Soporte',
      url: 'https://soporte.ejemplo.com',
    },
  },
  servers: [
    {
      url: process.env.HOST_URL || 'http://localhost:8083', // Usa la URL desde las variables de entorno
      description: 'Servidor local',
    },
  ],
  components: {
    schemas: {
      Libro: {
        type: 'object',
        required: ['id', 'titulo', 'autor', 'anio'],
        properties: {
          id: {
            type: 'integer',
            description: 'ID del libro',
          },
          titulo: {
            type: 'string',
            description: 'Título del libro',
          },
          autor: {
            type: 'string',
            description: 'Autor del libro',
          },
          anio: {
            type: 'integer',
            description: 'Año de publicación del libro',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Libros',
      description: 'Operaciones relacionadas con los libros',
    },
  ],
};

// Opciones para Swagger-jsdoc
const opcionesSwaggerJsdoc = {
  definition: definicionSwagger,
  apis: ['./server.js'], // Ruta a este archivo
};

// Generar la especificación Swagger
const especificacionSwagger = swaggerJsDoc(opcionesSwaggerJsdoc);

// Ruta para visualizar la documentación Swagger en la raíz
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(especificacionSwagger));

// Middleware para parsear los cuerpos de las solicitudes
app.use(express.json());

// Crear la conexión a la base de datos MySQL
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'autorack.proxy.rlwy.net',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'gdyeJxAyIROKBOyACzomwnshJbkTsmUH',
  database: process.env.DB_NAME || 'railway',
  port: process.env.DB_PORT || 36293,
});

// Conectar a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err.stack);
    return;
  }
  console.log('Conexión exitosa a la base de datos');
});

// Ruta GET para la raíz ("/")
app.get('/', (req, res) => {
  res.send('Bienvenido a la API de Libros');
});

// Ruta para obtener todas las tablas
app.get('/tables', (req, res) => {
  connection.query('SHOW TABLES', (err, results) => {
    if (err) {
      console.error('Error al obtener las tablas: ', err);
      return res.status(500).send('Error al obtener las tablas');
    }
    res.json(results);
  });
});

// Ruta GET para obtener todos los libros
/**
 * @swagger
 * /libro:
 *   get:
 *     summary: Obtiene todos los libros
 *     tags:
 *       - Libros
 *     responses:
 *       200:
 *         description: Lista de libros
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Libro'
 */
app.get('/libro', (req, res) => {
  connection.query('SELECT * FROM libros', (err, results) => {
    if (err) {
      console.error('Error al obtener los libros: ', err);
      return res.status(500).send('Error al obtener los libros');
    }
    res.json(results);
  });
});

// Ruta POST para crear un nuevo libro
/**
 * @swagger
 * /libro:
 *   post:
 *     summary: Crea un nuevo libro
 *     tags:
 *       - Libros
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Libro'
 *     responses:
 *       201:
 *         description: Libro creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Libro'
 */
app.post('/libro', (req, res) => {
  const { titulo, autor, anio } = req.body;
  connection.query(
    'INSERT INTO libros (titulo, autor, anio) VALUES (?, ?, ?)',
    [titulo, autor, anio],
    (err, result) => {
      if (err) {
        console.error('Error al agregar el libro: ', err);
        return res.status(500).send('Error al agregar el libro');
      }
      res.status(201).json({
        id: result.insertId,
        titulo,
        autor,
        anio,
      });
    }
  );
});

// Ruta PUT para actualizar un libro
/**
 * @swagger
 * /libro/{id}:
 *   put:
 *     summary: Actualiza un libro
 *     tags:
 *       - Libros
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID del libro a actualizar
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Libro'
 *     responses:
 *       200:
 *         description: Libro actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Libro'
 */
app.put('/libro/:id', (req, res) => {
  const libroId = parseInt(req.params.id, 10);
  const { titulo, autor, anio } = req.body;

  connection.query(
    'UPDATE libros SET titulo = ?, autor = ?, anio = ? WHERE id = ?',
    [titulo, autor, anio, libroId],
    (err, result) => {
      if (err) {
        console.error('Error al actualizar el libro: ', err);
        return res.status(500).send('Error al actualizar el libro');
      }
      if (result.affectedRows === 0) {
        return res.status(404).send('Libro no encontrado');
      }
      res.json({
        id: libroId,
        titulo,
        autor,
        anio,
      });
    }
  );
});

// Ruta DELETE para eliminar un libro
/**
 * @swagger
 * /libro/{id}:
 *   delete:
 *     summary: Elimina un libro
 *     tags:
 *       - Libros
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID del libro a eliminar
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Libro eliminado
 *       404:
 *         description: Libro no encontrado
 */
app.delete('/libro/:id', (req, res) => {
  const libroId = parseInt(req.params.id, 10);

  connection.query('DELETE FROM libros WHERE id = ?', [libroId], (err, result) => {
    if (err) {
      console.error('Error al eliminar el libro: ', err);
      return res.status(500).send('Error al eliminar el libro');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('Libro no encontrado');
    }
    res.json({
      message: `Libro con ID ${libroId} eliminado`,
    });
  });
});

// Levantar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:8083`);
});
