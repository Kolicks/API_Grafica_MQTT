///////////////////////////////////////////////////////////////////
//                                                               //
//                                                               //
//                        API Gràfica MQTT                       //
//                                                               //
//                                                               //
///////////////////////////////////////////////////////////////////


const express = require("express");//Servidor HTTP
const axios = require("axios").default;//Client HTTP per possible enviament al TTS
const WebSocket = require('ws'); // WebSocket
const mqtt = require('mqtt')// MQTT de recepció
var options = { // Configuració i certificats del client MQTT
    port: 1883,
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: 'udg-practiques-ad@ttn',
    password: 'NNSXS.5IJO52APVPDRLPAACRRBFRKXOG5KMUFLPLXXD6Q.3LIJ5GMMEO4TJSNS2Y6EOHVX5LIBFBAVQGVGMFX5DJFMMYXCKD7Q',
    keepalive: 60,
    reconnectPeriod: 1000,
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    clean: true,
    encoding: 'utf8'
};


//------------------------Executem el servidor i client WEB---------------------------------//
const app = express(); // La seva execució
const port = 40300; // Port de l'API Gràfica

let portWS = 40301; // Port del WebSocket
const wss= new WebSocket.Server({host: "localhost",port: portWS}); // Servidor WebSocket
const ws = new WebSocket('ws://localhost:' + portWS);// Client WebSocket
//Declara l'estructura de rebuda com a JSON
app.use(express.json());


//-------------------------------------- MQTT setup-----------------------------------------//

// Client MQTT subscrit al Servidor MQTT de LoRaWAN
const client  = mqtt.connect('https://eu1.cloud.thethings.network', options)

// Poseu aquí l'ID del vostre dispositiu (End Device ID)
// Quedareu subscrits ÚNICAMENT a aquest
let DeviceID = 'eui-70b3d57ed0053311'; // 

client.on('connect', function() {
    console.log('Client connectat a TTN')
    client.subscribe(`v3/udg-practiques-ad@ttn/devices/${DeviceID}/up`)
});

client.on('error', function(err) {
    console.log(err);
});

client.on('message', function(topic, message) {
    // La rebem i volquem a una variable objecte
    var getDataFromTTN = JSON.parse(message);
    console.log("Dades de TTN: ", getDataFromTTN.uplink_message.decoded_payload);
    
    /* Exemple que serveix per observar que podriem prescindir del Decoder de la API
    var getFrmPayload = getDataFromTTN.uplink_message.frm_payload;
    globalMQTT = Buffer.from(getFrmPayload, 'base64');
    console.log(globalMQTT);*/
    
    //Utilitzem les ja descodificades i les enviem per WebSocket

    ws.send(JSON.stringify(getDataFromTTN.uplink_message.decoded_payload));

});


//-----------------------Conneció del servidor WebSocketServer amb el Client---------------//

wss.on('connection', function connection(ws){
    //console.log('Nova connexió' + ws.__socket.remoteAddress + ':' + ws.__socket.remotePort);
    ws.on('message', function incoming(message){
        console.log(message.toString());
        wss.clients.forEach(function each(client){
            if (client.readyState === WebSocket.OPEN){
                client.send(message.toString());
            }
        });

    });
});


//------------------------------------- Pàgina Web ----------------------------------------//

app.get("/", (req, res) =>  {// Responem a la petició del buscador web
    res.sendFile(`${__dirname}/Grafic.html`)
});


//------------------------------------- Rebuda Express ------------------------------------//

// Errors no descrits a l'aplicació
app.use((error, req, res, next) => {
    res.status(500)
    res.send({error: error})
    console.error(error.stack)
    next(error)
})

// Missatge d'avís, per la connexió del port
app.listen(port, () =>
    console.log(`Aplicació executada a la direcicó http://localhost:${port}`)
);