# Socket Chat

Real-time, multi-room chat application built with **Node.js**, **Express** and **Socket.IO**.

---

## Features

- **Multi-room support** – users join independent rooms; zero cross-room bleed.
- **Message history** – last 50 messages are replayed to every new joiner (no DB required).
- **Typing indicators** – debounced "X is typing…" signal broadcast to room peers.
- **Private messages** – click any user in the sidebar to enter DM mode (Esc to cancel).
- **XSS-safe rendering** – all user-generated text is rendered via `textContent` / `createTextNode`; raw HTML injection is impossible.
- **Input validation & sanitisation** – server-side validator rejects empty, oversized, or HTML-encoded payloads.
- **Security hardened** – Helmet CSP headers, CORS restrictions, express-rate-limit, and proper HTTP security headers out of the box.
- **Structured logging** – Winston logger with colourised dev output and JSON production format.
- **Graceful shutdown** – SIGTERM / SIGINT handler closes Socket.IO and HTTP server cleanly.
- **Unread badge** – browser tab title shows unread count when the window is not focused.
- **Client-side search** – live filter on the connected-users sidebar.
- **Health endpoint** – `GET /health` for load-balancer / Docker readiness probes.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| HTTP server | Express 4 |
| WebSocket | Socket.IO 4 |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Winston, Morgan |
| Validation | validator.js |
| Frontend | HTML5, Bootstrap 4, jQuery 3 |
| Dev server | Nodemon |

---

## Project Structure

```
socket-chat/
├── server/
│   ├── server.js                  # Entry point – Express, middleware, graceful shutdown
│   ├── config/
│   │   └── config.js              # Centralised env-var configuration
│   ├── middleware/
│   │   └── security.js            # Helmet, CORS, rate-limit, Morgan
│   ├── classes/
│   │   ├── UserManager.js         # In-memory connected-user registry
│   │   └── MessageHistory.js      # Capped per-room message history
│   ├── sockets/
│   │   └── socket.js              # All Socket.IO event handlers
│   └── utils/
│       ├── logger.js              # Winston logger (dev + prod formats)
│       ├── messageUtils.js        # Message factory + time formatter
│       └── sanitize.js            # Input validation & sanitisation helpers
└── public/
    ├── index.html                 # Join screen – live validation, URLSearchParams nav
    ├── chat.html                  # Chat page – typing indicator, private mode, search
    ├── css/                       # Theme + custom styles
    └── js/
        ├── socket-chat-jquery.js  # UI module (XSS-safe DOM construction)
        └── socket-chat.js         # Socket.IO client + event wiring
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 — [nodejs.org](https://nodejs.org)
- **npm** ≥ 9 (bundled with Node)

### Installation

```bash
git clone <repo-url>
cd socket-chat
npm install
```

### Environment variables

Copy the example file and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` or `production` |
| `PORT` | `8000` | TCP port the server listens on |
| `HOST` | `0.0.0.0` | Bind address |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins |
| `RATE_LIMIT_MAX` | `200` | Max requests per window per IP |
| `MAX_MESSAGE_LENGTH` | `500` | Maximum chat message characters |
| `HISTORY_SIZE` | `50` | Messages replayed to new joiners |

### Running

```bash
# Development (hot-reload via Nodemon)
npm run dev

# Production
npm start
```

Open [http://localhost:8000](http://localhost:8000), enter a **username** and **room name**, then click **Ingresar al chat**.

---

## Socket.IO Event Reference

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `entrarChat` | `{ nombre, sala }` | Join a room. Callback receives `{ usuarios, historial }`. |
| `crearMensaje` | `{ mensaje }` | Broadcast a public message to the room. |
| `mensajePrivado` | `{ para, mensaje }` | Send a DM to the socket ID in `para`. |
| `escribiendo` | _(none)_ | Signal that the user is typing (debounced). |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `crearMensaje` | `{ nombre, mensaje, fecha, tipo }` | New public or system message. |
| `mensajePrivado` | `{ de, nombre, mensaje, fecha, tipo }` | Incoming private message. |
| `listaPersonas` | `Array<{ id, nombre, sala, joinedAt }>` | Updated user list for the room. |
| `escribiendo` | `{ nombre }` | Peer started typing. |
| `dejóDeEscribir` | `{ nombre }` | Peer stopped typing (auto after 3 s). |

---

## Health Check

```
GET /health
→ 200 { "status": "ok", "uptime": <seconds> }
```

---

## Architecture Notes

- **No circular dependency** — `server.js` creates the `io` instance and passes it **explicitly** to `registerSocketHandlers(io)`. The old pattern of `module.exports.io` + `require('../server')` inside `socket.js` created a circular require that could cause subtle boot-order bugs.
- **Separation of concerns** — config, logging, security middleware, business logic (UserManager, MessageHistory), and transport (socket handlers) are each in their own module.
- **Memory safety** — `MessageHistory.clearRoom()` is called automatically when the last user leaves a room, preventing unbounded accumulation.
- **Production upgrade path** — swapping `UserManager` and `MessageHistory` for Redis-backed implementations does not require changing any socket handler code.

---

| Dev tool | Nodemon |

## Estructura del proyecto

```
socket-chat/
├── server/
│   ├── server.js             # Servidor Express + Socket.IO
│   ├── classes/
│   │   └── usuarios.js       # Clase para gestión de usuarios conectados
│   ├── sockets/
│   │   └── socket.js         # Eventos de Socket.IO
│   └── utils/
│       └── utils.js          # Función helper para crear mensajes
└── public/
    ├── index.html            # Página de login (elegir nombre y sala)
    ├── chat.html             # Página principal del chat
    ├── css/                  # Estilos
    └── js/                   # Lógica del cliente
```

## Instalación

1. Clonar el repositorio:

```bash
git clone <url-del-repositorio>
cd socket-chat
```

2. Instalar dependencias:

```bash
npm install
```

## Uso

Iniciar el servidor:

```bash
npm start
```

El servidor se levanta en [http://localhost:8000](http://localhost:8000) por defecto.  
Se puede cambiar el puerto mediante la variable de entorno `PORT`:

```bash
PORT=3000 npm start
```

Luego abrir el navegador, ingresar un **nombre de usuario** y el nombre de la **sala** a la que se quiere unir.

## Eventos de Socket.IO

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `entrarChat` | Cliente → Servidor | Unirse a una sala con nombre y sala |
| `crearMensaje` | Bidireccional | Enviar/recibir mensajes en la sala |
| `listaPersonas` | Servidor → Cliente | Lista actualizada de usuarios en la sala |
| `mensajePrivado` | Cliente → Servidor | Enviar mensaje privado a otro usuario |
| `disconnect` | Automático | Notifica salida del usuario a la sala |

## Requisitos

- Node.js v12 o superior
- npm

---

## 👤 Autor

> Desarrollado con cariño por [@JhonSnakee](https://github.com/JhonSnakee)