///////////////////////////////////////////////////////////////////
//                                                               //
//                                                               //
//                  API Gestió dels aparcaments                  //
//                         Servidor UdG                          //
//                                                               //
///////////////////////////////////////////////////////////////////


const express = require("express");//Servidor HTTP
const axios = require("axios").default;//Client HTTP per enviar al TTN
const WebSocket = require('ws');


//----------------------Executem el servidor i client--------------------------//
const app = express();
const port = 40300;
const wss= new WebSocket.Server({host: "localhost",port: 40301});
const ws = new WebSocket('ws://localhost:40301');
//Declara l'estructura de rebuda com a JSON
app.use(express.json());


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


//------------------------------------ Pàgina Web ------------------------------------//

app.get("/", (req, res) =>  {
    res.sendFile(`${__dirname}/Grafic.html`)
});

//------------------------------------ Rebuda POST de TTN ------------------------------------//

app.post("/sensors", (req, res) => {
    console.log('Dades del sensor rebudes');

    let obj = req.body.uplink_message.decoded_payload;

    //console.log(obj);
    ws.send(JSON.stringify(obj));

    res.status(200).send();
})


//------------------------------------ Rebuda POST de TTN ------------------------------------//
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