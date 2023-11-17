import { Server as SocketServer, Socket } from "socket.io";
import { Mutex } from "async-mutex";

// ###
const mutex = new Mutex();
export type UserOnlineType = {
  socket: Socket;
  userId: string;
  userName: string;
};
let usersOnline: UserOnlineType[] = [];

export async function addUser(user: UserOnlineType) {
  const release = await mutex.acquire();
  try {
    usersOnline.push(user);
  } finally {
    release();
  }
}

export async function deleteUser(socketId: string) {
  const release = await mutex.acquire();
  try {
    usersOnline = usersOnline.filter((user) => user.socket.id !== socketId);
  } finally {
    release();
  }
}
// ###

export default async function socketController(
  io: SocketServer,
  socket: Socket
): Promise<void> {
  // ###
  let { userName, userId } = socket.handshake.query;
  userId = typeof userId === "string" ? userId : "";
  userName = typeof userName === "string" ? userName : "";

  const promises = [addUser({ socket, userId, userName })];
  await Promise.all(promises);
  console.log(`Client with ID ${socket.id} connected!`);
  console.log(usersOnline.map((user) => user.userName));

  io.to("global").emit("userOnlineUpdate", {
    users: usersOnline.map((user) => ({
      userId: user.userId,
      userName: user.userName,
      socketId: user.socket.id,
    })),
  });
  // ###

  // ###
  socket.on("disconnect", async () => {
    const promises = [deleteUser(socket.id)];
    await Promise.all(promises);
    console.log(`Client with id ${socket.id} disconnected!`);
    console.log(usersOnline.map((user) => user.userName));

    io.to("global").emit("userOnlineUpdate", {
      users: usersOnline.map((user) => ({
        userId: user.userId,
        userName: user.userName,
        socketId: user.socket.id,
      })),
    });
  });
  // ###
}
