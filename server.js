import express from 'express';
import swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import mysql from 'mysql2';
import fs from 'fs';
import cors from 'cors';

// Cargar variables de entorno
dotenv.config();

// Leer contenido del archivo README.md
const readmeContent = fs.readFileSync('./README.md', 'utf-8');

// Crear la aplicación Express
const app = express();
const port = process.env.PORT || 8083;

// Configuración de Swagger
const definicionSwagger = {
  openapi: '3.0.0',
  info: {
    title: 'API Libros',
    version: '1.0.0',
    description: readmeContent,
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
      url: process.env.HOST_URL || `http://localhost:${port}`,
      description: 'Servidor local',
    },
  ],
  components: {
    schemas: {
      Libro: {
        type: 'object',
        required: ['id', 'titulo', 'autor', 'anio'],
        properties: {
          id: { type: 'integer', description: 'ID del libro' },
          titulo: { type: 'string', description: 'Título del libro' },
          autor: { type: 'string', description: 'Autor del libro' },
          anio: { type: 'integer', description: 'Año de publicación del libro' },
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
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Libro' },
                },
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
        responses: {
          201: { description: 'Libro creado' },
        },
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
        responses: {
          200: { description: 'Libro actualizado' },
        },
      },
      delete: {
        summary: 'Eliminar un libro',
        tags: ['Libros'],
        responses: {
          200: { description: 'Libro eliminado' },
        },
      },
    },
  },
};

// Opciones para Swagger-jsdoc
const opcionesSwaggerJsdoc = {
  definition: definicionSwagger,
  apis: ['./server.js'],
};
const especificacionSwagger = swaggerJsDoc(opcionesSwaggerJsdoc);

// Middleware para habilitar CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Middleware para parsear JSON
app.use(express.json());

// Configuración de base de datos
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Verificar conexión a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err.stack);
    return;
  }
  console.log('Conexión exitosa a la base de datos');
});

// Rutas
app.get('/', (req, res) => res.redirect('/api-docs'));

app.get('/tables', (req, res) => {
  connection.query('SHOW TABLES', (err, results) => {
    if (err) return res.status(500).send('Error al obtener las tablas');
    res.json(results);
  });
});

app.get('/libro', (req, res) => {
  connection.query('SELECT * FROM libros', (err, results) => {
    if (err) return res.status(500).send('Error al obtener los libros');
    res.json(results);
  });
});

app.post('/libro', (req, res) => {
  const { titulo, autor, anio } = req.body;
  connection.query(
    'INSERT INTO libros (titulo, autor, anio) VALUES (?, ?, ?)',
    [titulo, autor, anio],
    (err, result) => {
      if (err) return res.status(500).send('Error al agregar el libro');
      res.status(201).json({ id: result.insertId, titulo, autor, anio });
    }
  );
});

app.put('/libro', (req, res) => {
  const { id, titulo, autor, anio } = req.body;
  connection.query(
    'UPDATE libros SET titulo = ?, autor = ?, anio = ? WHERE id = ?',
    [titulo, autor, anio, id],
    (err) => {
      if (err) return res.status(500).send('Error al actualizar el libro');
      res.status(200).send('Libro actualizado');
    }
  );
});

app.delete('/libro', (req, res) => {
  const { id } = req.body;
  connection.query('DELETE FROM libros WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).send('Error al eliminar el libro');
    res.status(200).send('Libro eliminado');
  });
});

// Ruta para la documentación de Swagger
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(especificacionSwagger));

// Iniciar el servidor
app.listen(port, () => console.log(`Servidor en ejecución en http://localhost:${port}`));
