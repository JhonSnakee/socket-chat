var socket = io();

var params = new URLSearchParams(window.location.search);
if (!params.has('nombre') || !params.has('sala')) {
    
    window.location = 'index.html'
    throw new Error('El nombre y sala son necesario')

};

var usuario = {
    nombre: params.get('nombre'),
    sala: params.get('sala')
};

socket.on('connect', function() {
    console.log('Concectado al servidor');

    socket.emit('entrarChat', usuario, function(res) {
        console.log('Usuarios conectados', res);
    });
});

socket.on('disconnect', function() {
    console.log('Perdimos conexion con el server'); 
});

// socket.emit('crearMensaje', {mensaje: 'hola atodos'});

//Escuchar info
socket.on('crearMensaje', function(mensaje) {
    console.log('Servidor: ', mensaje);
});

//Escuchar cambios de usuarios
//Cuando un usuario entra o sale del chat
socket.on('listaPersonas', function(personas) {
    console.log(personas);
});

// socket.emit('mensajePrivado', {mensaje: 'hola atodos', para:'_id'});

//Mensajes privados
socket.on('mensajePrivado', function() {
    console.log('Mensaje Privado:', mensaje);
});