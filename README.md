# Socket Chat

Aplicación de chat en tiempo real construida con Node.js, Express y Socket.IO. Permite a múltiples usuarios unirse a salas de chat, enviar mensajes y comunicarse de forma privada.

## Características

- Unirse a salas de chat con nombre de usuario personalizado
- Múltiples salas de chat simultáneas
- Mensajes en tiempo real mediante WebSockets
- Lista de usuarios conectados por sala
- Notificaciones cuando un usuario entra o abandona la sala
- Mensajes privados entre usuarios
- Interfaz responsive con Bootstrap

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Backend | Node.js, Express, Socket.IO |
| Frontend | HTML5, CSS3, Bootstrap 4, jQuery |
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