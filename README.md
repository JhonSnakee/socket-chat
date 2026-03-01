# 💬 Socket Chat

Chat web en tiempo real construido con **Node.js**, **Express** y **Socket.IO**.  
Permite a los usuarios unirse a distintas salas, enviar mensajes públicos o privados y ver quién está conectado… todo al instante.

---

## 🚀 Funcionalidades
- Salas de chat ilimitadas.
- Mensajes públicos (sala) y privados (1:1).
- Lista dinámica de usuarios online.
- Notificaciones de conexión y desconexión.
- Scroll inteligente al último mensaje.
- UI ligera con HTML, CSS y jQuery.

---

## 🛠️ Tecnologías principales
| Back‑end | Front‑end | Dev tools |
|----------|-----------|-----------|
| Node.js  | HTML5     | Nodemon |
| Express  | CSS3      | npm      |
| Socket.IO| jQuery    | Git      |

---

## 📂 Estructura de carpetas

```
socket-chat/
├── classes/ # Gestión de usuarios (usuarios.js)
├── public/ # Front estático (HTML, CSS, JS, assets)
│ ├── index.html
│ ├── chat.html
│ └── js/
├── sockets/ # Lógica de eventos Socket.IO
│ └── socket.js
├── utils/ # Helpers (crear-mensaje.js)
├── server.js # Servidor Express + Socket.IO
├── package.json
└── .gitignore
```

---

## 📦 Instalación y ejecución

1. **Clona el repo**
```bash
   git clone https://github.com/tu-usuario/socket-chat.git
   cd socket-chat
```
2. **Instala dependencias**
```bash
    npm install
```
3. **Arranca el servidor**
```bash    
    npm start
```
4. **Abre tu navegador** 
    en http://localhost:8000, pon tu nombre y la sala… ¡y a conversar! Para probar en grupo, abre otra pestaña/ventana (o dispositivo) con otro nombre y la misma sala.

---

## 🧪 Scripts útiles

Comando	Descripción
npm start	Inicia servidor en PORT (por defecto 8000).
npm run dev	Inicia servidor con nodemon para recarga en caliente.

---

## 📬 Contacto

> Desarrollado con cariño por [@JhonSnakee](https://github.com/JhonSnakee)