import express from 'express';
import swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import mysql from 'mysql2';
import fs from 'fs'; // Módulo para leer archivos
import cors from 'cors'; // Módulo para habilitar CORS

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
      url: 'https://lromero-apilibros.onrender.com', // Cambia localhost por la URL de Render
      description: 'Servidor en Render',
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
  paths: {
    '/libros': {
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
          201: {
            description: 'Libro creado',
          },
        },
      },
    },
    '/libro/{id}': {
      put: {
        summary: 'Actualizar un libro',
        tags: ['Libros'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'ID del libro a actualizar',
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Libro' },
            },
          },
        },
        responses: {
          200: {
            description: 'Libro actualizado',
          },
        },
      },
      delete: {
        summary: 'Eliminar un libro',
        tags: ['Libros'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'ID del libro a eliminar',
          },
        ],
        responses: {
          200: {
            description: 'Libro eliminado',
          },
        },
      },
    },
  },
};

// Opciones para Swagger-jsdoc
const opcionesSwaggerJsdoc = {
  definition: definicionSwagger,
  apis: ['./server.js'], // Ruta a este archivo
};

// Generar la especificación Swagger
const especificacionSwagger = swaggerJsDoc(opcionesSwaggerJsdoc);

// Verificar la especificación Swagger
console.log(JSON.stringify(especificacionSwagger, null, 2)); // Esto imprime la especificación generada para depuración

// Middleware para habilitar CORS globalmente
const corsOptions = {
  origin: '*', // Permite solicitudes desde cualquier origen
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
};
app.use(cors(corsOptions));

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

// Ruta GET para la raíz ("/") que redirige a la documentación Swagger
app.get('/', (req, res) => {
  res.redirect('/api-docs'); // Redirige a Swagger UI
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

// Rutas de libros con la documentación Swagger
app.post('/libros', (req, res) => {
  const { titulo, autor, anio } = req.body;

  // Validación de los datos de entrada
  if (!titulo || !autor || !anio) {
    return res.status(400).send('Faltan datos requeridos (titulo, autor, anio)');
  }

  // Asegurarnos de que 'anio' sea un número válido
  if (isNaN(anio)) {
    return res.status(400).send('El año debe ser un número válido');
  }

  // Consulta para insertar el libro en la base de datos
  connection.query(
    'INSERT INTO libros (titulo, autor, anio) VALUES (?, ?, ?)',
    [titulo, autor, anio],
    (err, result) => {
      if (err) {
        console.error('Error al agregar el libro: ', err);
        return res.status(500).send('Error al agregar el libro');
      }

      // Respuesta exitosa con el libro creado
      res.status(201).json({
        id: result.insertId,
        titulo,
        autor,
        anio,
      });
    }
  );
});





app.put('/libro/:id', (req, res) => {
  const { id } = req.params;
  const { titulo, autor, anio } = req.body;

  // Validar datos de entrada
  if (!titulo || !autor || !anio) {
    return res.status(400).send('Faltan datos requeridos (titulo, autor, anio)');
  }

  // Consulta para actualizar el libro
  connection.query(
    'UPDATE libros SET titulo = ?, autor = ?, anio = ? WHERE id = ?',
    [titulo, autor, anio, id],
    (err, result) => {
      if (err) {
        console.error('Error al actualizar el libro: ', err);
        return res.status(500).send('Error al actualizar el libro');
      }

      // Verificar si se actualizó alguna fila
      if (result.affectedRows === 0) {
        return res.status(404).send('No se encontró un libro con el ID proporcionado');
      }

      res.status(200).send({
        mensaje: 'Libro actualizado correctamente',
        id,
        titulo,
        autor,
        anio,
      });
    }
  );
});



app.delete('/libro/:id', (req, res) => {
  const { id } = req.params;
  connection.query(
    'DELETE FROM libros WHERE id = ?',
    [id],
    (err, result) => {
      if (err) {
        console.error('Error al eliminar el libro: ', err);
        return res.status(500).send('Error al eliminar el libro');
      }
      res.status(200).send('Libro eliminado');
    }
  );
});

// Ruta para servir el archivo swagger.json
app.get('/swagger.json', (req, res) => {
  res.json(especificacionSwagger);
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor en ejecución en http://localhost:${port}`);
});
