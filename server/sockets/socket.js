const {io} = require('../server');
const {Usuarios} = require('../classes/usuarios');
const {crearMensaje} = require('../utils/utils');


const usuarios = new Usuarios();

io.on('connection', (client) => {

    client.on('entrarChat',(data,callback) => {
        if(!data.nombre || !data.sala){
            return callback({
                error: true,
                mensaje: 'El nombre y/o sala es necesario'
            });
        };
        
        client.join(data.sala);

        usuarios.agregarPersona(client.id, data.nombre, data.sala);

        client.broadcast.to(data.sala).emit('listaPersonas', usuarios.getPersonasPorSala(data.sala));
        client.broadcast.to(data.sala).emit('crearMensaje',crearMensaje('Admin', `${data.nombre} entro al chat`));

        callback(usuarios.getPersonasPorSala(data.sala));
    });

    client.on('crearMensaje', (data, callback) => {

        let persona = usuarios.getPersona(client.id)

        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);

        callback(mensaje);
    });

    client.on('disconnect', () => {
        let pBorrada = usuarios.borrarPersona(client.id);
        
        client.broadcast.to(pBorrada.sala).emit('crearMensaje',crearMensaje('Admin', `${pBorrada.nombre} abandono el chat`));
        client.broadcast.to(pBorrada.sala).emit('listaPersonas', usuarios.getPersonasPorSala(pBorrada.sala));
    });

    client.on('mensajePrivado', data => {
        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
    });

});