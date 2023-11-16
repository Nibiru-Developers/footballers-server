import express, { Express, Request, Response } from "express";
import cors from "cors";

const createServer: Express = express();

createServer.use(express.json());
createServer.use(cors());

createServer.get("/", (req: Request, res: Response): Response<string> => {
  return res.status(200).send("Server Online!");
});

createServer.use((req: Request, res: Response): Response<string> => {
  return res.status(404).send("404 - Not Found");
});

export default createServer;
