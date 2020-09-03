// create - create a session
// join - join a session
// leave - leave a session
// inspect - send user information and other DAW meta information
// note - send midi data and timecode data if avail
// control - send midi control messages and timecode if avail
// transport - send midi sync messages for transport
// declare - send the time now at location

import uws from 'uWebSockets.js'
import { v4 as uuidv4 } from 'uuid'
const { App, SSLApp, DEDICATED_COMPRESSOR_3KB } = uws

const {
  PORT,
  SSL_KEY,
  SSL_CERT,
  IDLE_TIMEOUT,
  MAX_BACKPRESSURE,
  MAX_PAYLOAD_LENGTH
} = process.env

// State
const sessions = {}

// Test session
const sessionId = uuidv4()
sessions[sessionId] = []

// App
const app = SSL_KEY && SSL_CERT
  ? SSLApp({
    key_file_name: SSL_KEY,
    cert_file_name: SSL_CERT
  }) : App()

app.ws('/*', {
  idleTimeout: IDLE_TIMEOUT || 0,
  maxBackpressure: MAX_BACKPRESSURE || 1024,
  maxPayloadLength: MAX_PAYLOAD_LENGTH || 512,
  compression: DEDICATED_COMPRESSOR_3KB,

  /* For brevity we skip the other events (upgrade, open, ping, pong, close) */
  open: (ws) => {
    ws.id = uuidv4()
    sessions[sessionId].push(ws)
  },
  close: (ws) => {
    sessions[sessionId] = sessions[sessionId].filter(socket => socket.id !== ws.id)
  },
  message: (ws, message, isBinary) => {
    // switch (message.channel) {
    //   case 'node':
    //     return midiNode(ws, message, isBinary)
    //   case 'control':
    //     return midiControl(ws, message, isBinary)
    //   case 'inspect':
    //     return midiInspect(ws, message, isBinary)
    //   case 'declare':
    //     return midiDeclare(ws, message, isBinary)
    // }

    sessions[sessionId].forEach(socket => {
      socket.send(message, isBinary)
    })
  }

})

app.post('/session', (res) => {
  const sessionId = uuidv4()
  sessions[sessionId] = []
  res
    .writeStatus('200 OK')
    .writeHeader('Content-Type', 'application/json')
    .end(JSON.stringify({ sessionId }))
})

app.get('/session/:id', (res, req) => {
  const sessionId = req.getParameter('id')
  const clients = sessions[sessionId]
  res.writeStatus('200 OK')
    .writeHeader('Content-Type', 'application/json')
    .end(JSON.stringify({ clients }))
})

app.post('/session/join/:id', (res, req) => {
  // const sessionId = req.getParameter('id')
})

app.get('/*', (res) => {
  /* It does Http as well */
  res.writeStatus('200 OK').writeHeader('IsExample', 'Yes').end('Hello there!')
})

app.listen(PORT || 9001, (listenSocket) => {
  if (listenSocket) {
    console.log('Listening to port 9001')
  }
})

const midiNode = (ws, message) => {}
const midiControl = (ws, message) => {}
const midiInspect = (ws, message) => {}
const midiDeclare = (ws, message) => {}
