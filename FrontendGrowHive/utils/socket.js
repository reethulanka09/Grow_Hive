// frontend/utils/socket.js
import { io } from 'socket.io-client';

// 🧠 Use your local IPv4 or deployed backend URL here
const SOCKET_URL = 'http://10.239.62.149:5000';

const socket = io(SOCKET_URL, {
  transports: ['websocket'],  // use WebSocket protocol
  autoConnect: false          // we will manually connect using socket.connect()
});

export default socket;
