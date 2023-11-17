import http from "http";
import express, { Express, Request, Response } from "express";
import { Server as SocketServer, Socket } from "socket.io";
import socketController from "../socket/socketController";

const createServer: Express = express();

createServer.get("/", (req: Request, res: Response): Response<string> => {
  return res.status(200).send("Server Online!");
});

createServer.use((req: Request, res: Response): Response<string> => {
  return res.status(404).send("404 - Not Found");
});

const mainServer = http.createServer(createServer);
const io = new SocketServer(mainServer, {
  cors: {
    origin: "*",
  },
});
io.on("connection", (socket: Socket) => {
  socket.join("global");

  socketController(io, socket);
});

export default mainServer;
