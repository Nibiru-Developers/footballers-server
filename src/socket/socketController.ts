import { Server as SocketServer, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import UsersData, { UserType } from "./data/UsersData";
import questions from "../question/questions.json";

const usersOnline = new UsersData();
const usersWaiting = new UsersData();

let gameTimer: NodeJS.Timeout | undefined;

export default async function socketController(
  io: SocketServer,
  socket: Socket
): Promise<void> {
  // ### ADD USER TO ONLINE LIST
  let { userName, userId } = socket.handshake.query;
  userId = typeof userId === "string" ? userId : "";
  userName = typeof userName === "string" ? userName : "";

  if (!usersOnline.checkUser(userId)) {
    usersOnline.addUser({ userId, userName, socket });
    console.log(`Client with ID ${socket.id} connected!`);
    console.log(
      "USER ONLINE: ",
      usersOnline.users.map(
        (user) => `${user.userId} - ${user.userName} - ${user.socket.id}`
      )
    );

    io.to("global").emit("userOnlineUpdate", {
      message: `Client with ID ${socket.id} connected!`,
      users: usersOnline.users.map((user) => ({
        userId: user.userId,
        userName: user.userName,
        socketId: user.socket.id,
      })),
    });
  }
  // ### ADD USER TO ONLINE LIST

  // ### MATCHMAKING
  socket.on("matchmaking", async ({ userId, userName }) => {
    if (!usersWaiting.checkUser(userId)) {
      usersWaiting.addUser({ userId, userName, socket });
      console.log(`Client with ID ${socket.id} waiting for match!`);
      console.log(
        "USER WAITING FOR MATCH: ",
        usersWaiting.users.map(
          (user) => `${user.userId} - ${user.userName} - ${user.socket.id}`
        )
      );

      if (usersWaiting.users.length >= 3) {
        const roomId = `room_${uuidv4()}`;
        const playerSelectedToMatch = usersWaiting.users.splice(0, 3);
        playerSelectedToMatch.forEach((user: UserType) => {
          user.socket.join(roomId);
          user.socket.emit("matchFound", {
            message: "Match Found",
            roomId,
            questions: _.sampleSize(questions, 5),
          });
        });

        let gameTime = 10;
        gameTimer = setInterval(() => {
          io.to(roomId).emit("matchStarted", {
            message: "Match Started",
            timeRemaining: gameTime,
          });
          if (gameTime === 0) {
            if (gameTimer) clearInterval(gameTimer);
            io.to(roomId).emit("matchFinished", {
              message: "Match Finished",
            });
          }
          gameTime--;
        }, 1000);
      } else {
        socket.emit("findingMatch", {
          message: "Finding Match, Please Wait",
        });
      }
    }
  });
  // ### MATCHMAKING

  // ### DISCONNECT
  socket.on("disconnect", async () => {
    usersOnline.deleteUser(socket.id);
    usersWaiting.deleteUser(socket.id);
    console.log(`Client with ID ${socket.id} disconnected!`);
    console.log(
      "USER ONLINE: ",
      usersOnline.users.map(
        (user) => `${user.userId} - ${user.userName} - ${user.socket.id}`
      )
    );
    console.log(
      "USER WAITING FOR MATCH: ",
      usersWaiting.users.map(
        (user) => `${user.userId} - ${user.userName} - ${user.socket.id}`
      )
    );

    io.to("global").emit("userOnlineUpdate", {
      message: `Client with ID ${socket.id} disconnected!`,
      users: usersOnline.users.map((user) => ({
        userId: user.userId,
        userName: user.userName,
        socketId: user.socket.id,
      })),
    });
  });
  // ### DISCONNECT
}
