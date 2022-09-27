const port = 8080;
const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const socketio = require('socket.io');
const { initializeApp } = require('firebase/app');
var turn;
var sign;
var players = {};

const firebaseConfig = {
    apiKey: "AIzaSyBUuCS0jLAcQq0ZFjhQqWJkZf5YSsyy96c",
    authDomain: "morpion-f55d6.firebaseapp.com",
    projectId: "morpion-f55d6",
    storageBucket: "morpion-f55d6.appspot.com",
    messagingSenderId: "530083223786",
    appId: "1:530083223786:web:ca433ff45208e6b5629f93"
};

const appf = initializeApp(firebaseConfig);

const clientPath = __dirname+'/../';
console.log('Serving static from', clientPath);

app.use(express.static(clientPath));

const io = socketio(server);

function SendMessageBothPlayers(player1ID, player2ID, event, msg)
{
    io.to(player1ID).emit(event, msg);
    io.to(player2ID).emit(event, msg);
}

function CheckForConnections()
{
    for(let i=0;i<Object.keys(players).length;i+=2)
    {
        if(Object.keys(players)[i+1] && !players[Object.keys(players)[i]] && !players[Object.keys(players)[i+1]])
        {
            console.log("Connection de",Object.keys(players)[i+1],"et de", Object.keys(players)[i]);
            turn = Math.floor(Math.random()*2);
            sign = Math.floor(Math.random()*2);

            io.to(Object.keys(players)[i]).emit('otherid_info', Object.keys(players)[i+1]);
            io.to(Object.keys(players)[i+1]).emit('otherid_info', Object.keys(players)[i]);

            io.to(Object.keys(players)[i]).emit('indexSign_info', sign);
            sign == 0 ? sign++ : sign--;
            io.to(Object.keys(players)[i+1]).emit('indexSign_info', sign);

            SendMessageBothPlayers(Object.keys(players)[i], Object.keys(players)[i+1], 'indexTurn_info', turn);

            players[Object.keys(players)[i+1]] = players[Object.keys(players)[i]]= true;
        }
    }
}

const SendPacketsArgMessage = (infos) => {
    io.to(infos[1]).emit("re"+infos[0], infos[2]);
    console.log("Sent: 're"+infos[0]+"' for", infos[2]);
}

const SendPacketsNoArg = (event_infos) => {
    io.to(event_infos[1]).emit('re'+event_infos[0]);
    console.log("Sent without args event:", event_infos[0]);
}

io.on('connection', socket => {
    console.warn("Quelqu'un s'est connecté avec l'ID:", socket.id);
    players[socket.id] = false;
    io.to(socket.id).emit('myid_info', socket.id);
    CheckForConnections();
    console.log(players);

    socket.on('message', SendPacketsArgMessage);
    socket.on('message_ng', SendPacketsArgMessage);
    socket.on('message_wa', SendPacketsNoArg);

    socket.on('disconnect', () => {
        console.warn("Deconnection de", socket.id);
        if(Object.keys(players).indexOf(socket.id) % 2 == 0 && Object.keys(players).length >= 2 && players[Object.keys(players)[Object.keys(players).indexOf(socket.id)]])
        {   
            players[Object.keys(players)[Object.keys(players).indexOf(socket.id)+1]] = false;
            io.to(Object.keys(players)[Object.keys(players).indexOf(socket.id)+1]).emit('disconnection_info')
        }
        else if(Object.keys(players).length >= 2 && players[Object.keys(players)[Object.keys(players).indexOf(socket.id)]])
        {
            players[Object.keys(players)[Object.keys(players).indexOf(socket.id)-1]] = false;
            io.to(Object.keys(players)[Object.keys(players).indexOf(socket.id)-1]).emit('disconnection_info');
        }
        delete players[socket.id];
        CheckForConnections();
        console.warn(players);
    });
});

server.on('error', (err) => {
    console.error('Erreur du serveur:', err);
});

server.listen(port, () => {
    console.log('RPS démarré sur le port', port);
});