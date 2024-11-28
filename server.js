import express from 'express';
import swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import mysql from 'mysql2';
import fs from 'fs';
import cors from 'cors';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

// Leer el archivo README.md
const readmeContent = fs.existsSync('./README.md')
  ? fs.readFileSync('./README.md', 'utf-8')
  : 'API para gestionar libros';

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
    },
  },
};

const opcionesSwaggerJsdoc = {
  definition: definicionSwagger,
  apis: ['./server.js'],
};
const especificacionSwagger = swaggerJsDoc(opcionesSwaggerJsdoc);

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(express.json());
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(especificacionSwagger));

// Ruta raíz
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Conexión a la base de datos
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

connection.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err.message);
    console.error('Detalles:', err);
    process.exit(1); // Salir si no se puede conectar
  }
  console.log('Conexión exitosa a la base de datos');
});

// Endpoints
app.get('/libro', (req, res) => {
  connection.query('SELECT * FROM libros', (err, results) => {
    if (err) {
      console.error('Error al obtener los libros:', err.message);
      return res.status(500).json({ error: 'Error al obtener los libros' });
    }
    res.json(results);
  });
});

app.post('/libro', (req, res) => {
  const { titulo, autor, anio } = req.body;
  if (!titulo || !autor || !anio) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }
  connection.query(
    'INSERT INTO libros (titulo, autor, anio) VALUES (?, ?, ?)',
    [titulo, autor, anio],
    (err, result) => {
      if (err) {
        console.error('Error al agregar el libro:', err.message);
        return res.status(500).json({ error: 'Error al agregar el libro' });
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

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor en ejecución en http://localhost:${port}`);
});
