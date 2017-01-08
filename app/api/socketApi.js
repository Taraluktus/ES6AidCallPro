import {SERVER_URL} from "./fetchUtils";
const io = require("socket.io-client");


export function createSocket() {
  return io.connect(SERVER_URL);
}

export function onSocket(socket, onNearby, onUserId, onDisconnect) {
  socket.on("shownearbyusers", onNearby);
  socket.on("senduserid", onUserId);
  socket.on("disconnect", onDisconnect);
}

export function disconnect(socket) {
  socket.disconnect();
}

export function submitUserId(socket, userId) {
  socket.emit("userid", {
    userId: userId
  });
}
