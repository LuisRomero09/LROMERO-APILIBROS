import express from 'express';
import swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise'; // Usar promesas para manejar la base de datos
import cors from 'cors';
import fs from 'fs';

// Cargar variables de entorno
dotenv.config();

// Configuración de Express
const app = express();
const port = process.env.PORT || 8083;

// Middleware para parsear JSON
app.use(express.json());

// Configuración de CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Configuración de Swagger
const readmeContent = fs.existsSync('./README.md') 
  ? fs.readFileSync('./README.md', 'utf-8') 
  : 'Documentación API Libros';

const definicionSwagger = {
  openapi: '3.0.0',
  info: {
    title: 'API Libros',
    version: '1.0.0',
    description: readmeContent,
    license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
    contact: { name: 'Soporte', url: 'https://soporte.ejemplo.com' },
  },
  servers: [
    {
      url: process.env.HOST_URL || `http://localhost:${port}`,
      description: 'Servidor local',
    },
  ],
  components: {
    schemas: {
      Libro: {
        type: 'object',
        required: ['titulo', 'autor', 'anio'],
        properties: {
          id: { type: 'integer', description: 'ID del libro' },
          titulo: { type: 'string', description: 'Título del libro' },
          autor: { type: 'string', description: 'Autor del libro' },
          anio: { type: 'integer', description: 'Año de publicación' },
        },
      },
    },
  },
  paths: {
    '/libro': {
      get: {
        summary: 'Obtener todos los libros',
        tags: ['Libros'],
        responses: {
          200: {
            description: 'Lista de libros',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Libro' } },
              },
            },
          },
        },
      },
      post: {
        summary: 'Crear un nuevo libro',
        tags: ['Libros'],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Libro' },
            },
          },
        },
        responses: { 201: { description: 'Libro creado' } },
      },
      put: {
        summary: 'Actualizar un libro',
        tags: ['Libros'],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Libro' },
            },
          },
        },
        responses: { 200: { description: 'Libro actualizado' } },
      },
      delete: {
        summary: 'Eliminar un libro',
        tags: ['Libros'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: { 200: { description: 'Libro eliminado' } },
      },
    },
  },
};
const opcionesSwaggerJsdoc = {
  definition: definicionSwagger,
  apis: ['./server.js'],
};
const especificacionSwagger = swaggerJsDoc(opcionesSwaggerJsdoc);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(especificacionSwagger));

// Conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'biblioteca',
  port: process.env.DB_PORT || 3306,
};
const pool = mysql.createPool(dbConfig);

// Rutas API
app.get('/libro', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM libros');
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener los libros:', err);
    res.status(500).send('Error al obtener los libros');
  }
});

app.post('/libro', async (req, res) => {
  const { titulo, autor, anio } = req.body;
  if (!titulo || !autor || !anio) {
    return res.status(400).send('Faltan campos obligatorios');
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO libros (titulo, autor, anio) VALUES (?, ?, ?)',
      [titulo, autor, anio]
    );
    res.status(201).json({ id: result.insertId, titulo, autor, anio });
  } catch (err) {
    console.error('Error al crear el libro:', err);
    res.status(500).send('Error al crear el libro');
  }
});

app.put('/libro', async (req, res) => {
  const { id, titulo, autor, anio } = req.body;
  if (!id || !titulo || !autor || !anio) {
    return res.status(400).send('Faltan campos obligatorios');
  }
  try {
    await pool.query(
      'UPDATE libros SET titulo = ?, autor = ?, anio = ? WHERE id = ?',
      [titulo, autor, anio, id]
    );
    res.send('Libro actualizado');
  } catch (err) {
    console.error('Error al actualizar el libro:', err);
    res.status(500).send('Error al actualizar el libro');
  }
});

app.delete('/libro/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM libros WHERE id = ?', [id]);
    res.send('Libro eliminado');
  } catch (err) {
    console.error('Error al eliminar el libro:', err);
    res.status(500).send('Error al eliminar el libro');
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor en ejecución en http://localhost:${port}`);
});
