import { io } from "socket.io-client";

const URL = import.meta.env.DEV ? "http://localhost:3000" : window.location.origin;

const socket = io(URL, {
  withCredentials: true,
});

export default socket;