# Socket Chat

Chat en tiempo real multi-sala construido con **Node.js**, **Express** y **Socket.IO**.

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-blue)
![License](https://img.shields.io/badge/license-ISC-lightgrey)

---

## Características

- **Salas independientes** — cada usuario elige un nombre de sala; los mensajes son aislados por sala
- **Mensajes privados** — haz clic en un usuario de la lista para enviarle un mensaje directo
- **Historial de mensajes** — los últimos 50 mensajes de cada sala se entregan al conectarse
- **Indicador de escritura** — notificación en tiempo real cuando alguien está escribiendo
- **Selección de avatar** — 7 avatares predeterminados o foto personalizada (sesión actual, ≤ 220 KB)
- **Cambio de avatar en el chat** — modal de selector disponible desde la cabecera del chat
- **Botón de salida** — abandona la sala limpiamente sin cerrar el navegador
- **Protección XSS** — todos los mensajes se insertan via DOM, nunca `innerHTML` con strings
- **Content Security Policy** — Helmet CSP configurado con cabeceras estrictas
- **Rate limiting** — 200 peticiones por ventana de 15 minutos
- **Health check** — `GET /health` para balanceadores de carga o Docker

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Servidor | Node.js ≥ 18, Express 4 |
| WebSockets | Socket.IO 4.8 |
| Seguridad | Helmet, CORS, express-rate-limit |
| Logging | Winston + Morgan |
| Validación | validator.js + sanitización propia |
| Frontend | Bootstrap 4, jQuery 3, Font Awesome |
| Variables de entorno | dotenv |
| Dev | nodemon |

---

## Requisitos previos

- **Node.js ≥ 18**
- **npm ≥ 9**

---

## Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/tu-usuario/socket-chat.git
cd socket-chat

# 2. Instala las dependencias
npm install
```

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto (opcional — todos los valores tienen default):

```env
NODE_ENV=development
PORT=8000
HOST=0.0.0.0

# En producción, lista de orígenes permitidos separados por coma
CORS_ORIGINS=https://chat.ejemplo.com

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000   # 15 minutos
RATE_LIMIT_MAX=200

# Límites del chat
MAX_MESSAGE_LENGTH=500
MAX_USERNAME_LENGTH=30
MAX_ROOM_NAME_LENGTH=30
HISTORY_SIZE=50
TYPING_DEBOUNCE_MS=3000
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor en modo producción |
| `npm run dev` | Inicia el servidor con nodemon (auto-reinicio) |
| `npm run lint` | Ejecuta el linter (configura ESLint para habilitar) |
| `npm test` | Ejecuta los tests (configura Jest/Mocha para habilitar) |

---

## Uso

```bash
npm run dev
```

Abre el navegador en [http://localhost:8000](http://localhost:8000).

1. Ingresa tu **nombre** y el **nombre de una sala**
2. Elige un **avatar** (uno de los 7 predeterminados o sube tu propia foto)
3. Haz clic en **Entrar**
4. Para chatear en privado, haz clic en el nombre de otro usuario en la lista

---

## Estructura del proyecto

```
socket-chat/
├── server/
│   ├── server.js               # Punto de entrada — Express + Socket.IO
│   ├── config/
│   │   └── config.js           # Configuración centralizada (lee .env)
│   ├── classes/
│   │   ├── UserManager.js      # Registro de usuarios en memoria (Map)
│   │   └── MessageHistory.js   # Historial de mensajes por sala
│   ├── middleware/
│   │   └── security.js         # Helmet CSP, CORS, rate limiter, Morgan
│   ├── sockets/
│   │   └── socket.js           # Todos los handlers de Socket.IO
│   └── utils/
│       ├── logger.js           # Winston logger
│       ├── messageUtils.js     # Factory de mensajes
│       └── sanitize.js         # Validación y sanitización de payloads
└── public/
    ├── index.html              # Página de login
    ├── chat.html               # Interfaz del chat
    ├── css/
    │   ├── login.css           # Estilos de la página de login
    │   └── chat-custom.css     # Estilos del chat
    └── js/
        ├── login.js            # Comportamiento de la página de login
        ├── socket-chat-jquery.js  # Módulo ChatUI (manipulación del DOM)
        ├── socket-chat.js         # Módulo Socket (conexión Socket.IO)
        └── chat-init.js           # Inicialización de la página de chat
```

---

## Eventos Socket.IO

| Evento (cliente → servidor) | Descripción |
|---|---|
| `entrarChat` | Unirse a una sala con `{ nombre, sala, avatar }` |
| `crearMensaje` | Enviar mensaje público con `{ mensaje }` |
| `mensajePrivado` | Enviar mensaje privado con `{ para, mensaje }` |
| `actualizarAvatar` | Cambiar avatar con `{ avatar }` |
| `escribiendo` | Notificar que el usuario está escribiendo |

| Evento (servidor → cliente) | Descripción |
|---|---|
| `crearMensaje` | Nuevo mensaje (público, privado o de sistema) |
| `listaPersonas` | Lista actualizada de usuarios en la sala |
| `escribiendo` | Nombre del usuario que está escribiendo |

---

## Seguridad

- **CSP** — restringe orígenes de scripts, estilos, fuentes e imágenes
- **XSS** — sin `innerHTML` con datos de usuario; todo via nodos DOM
- **Rate limiting** — 200 req / 15 min por IP
- **Validación doble** — cliente y servidor validan todos los payloads
- **Avatar base64** — verificado por prefijo MIME y limitado a 307 200 chars (~220 KB)

---

## 👤 Autor

> Desarrollado con cariño por [@JhonSnakee](https://github.com/JhonSnakee)