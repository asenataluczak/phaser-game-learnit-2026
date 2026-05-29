import { nanoid } from "nanoid";
import { Server } from "socket.io";
import { getBallPosition, createBall, physics } from "./physics.js";

const io = new Server({
  cors: {
    origin: "http://localhost:4200",
  },
});

const INITIAL_POSITIONS_TEAM_A = [
  { x: 100, y: 100 },
  { x: 200, y: 200 },
];

const INITIAL_POSITIONS_TEAM_B = [
  { x: 500, y: 300 },
  { x: 600, y: 300 },
];

let allConnectedUsers = [];
const getUsersInTheRoom = (gameId) => {
  const allUsersInTheRoom = allConnectedUsers.filter(
    (user) => user.gameId === gameId,
  );
  const allUsersInTheRoomMapped = allUsersInTheRoom.map((user) => ({
    id: user.id,
    name: user.name,
    team: user.team,
    host: user.host,
  }));
  return allUsersInTheRoomMapped;
};

const lobbies = {};
io.on("connection", (socket) => {
  const { username, userId, gameId: _gameId } = socket.handshake.query;

  console.log("New connection:", { username, userId, _gameId });
  if (!userId) {
    socket.disconnect(true);
    return;
  }

  const gameId = _gameId || nanoid(6);

  socket.join(gameId);

  const currentUserIndex = allConnectedUsers.findIndex((user) => {
    return user.id === userId;
  });
  if (currentUserIndex < 0) {
    const team = getCalculatedTeam(gameId);
    allConnectedUsers.push({
      id: userId.toString(),
      name: username.toString(),
      gameId: gameId,
      team,
      host: !getUsersInTheRoom(gameId).length,
    });
  }

  io.sockets.to(gameId).emit("USERS_IN_LOBBY_CHANGE", {
    users: getUsersInTheRoom(gameId),
    gameId: gameId,
  });

  socket.on("START_GAME", ({ gameId }) => {
    if (!gameId) return;
    const usersInTheRoom = getUsersInTheRoom(gameId);
    const playersTeamA = usersInTheRoom.filter((u) => u.team === 1);
    const playersTeamB = usersInTheRoom.filter((u) => u.team === 2);
    const playersWithPositions = [
      ...playersTeamA.map((p, i) => ({
        ...p,
        position: {
          ...INITIAL_POSITIONS_TEAM_A[i],
        },
      })),
      ...playersTeamB.map((p, i) => ({
        ...p,
        position: {
          ...INITIAL_POSITIONS_TEAM_B[i],
        },
      })),
    ];
    lobbies[gameId] = { players: playersWithPositions };
    const ball = createBall();
    const ballPosition = getBallPosition(ball);

    io.sockets.to(gameId).emit("GAME_STARTED", {
      users: playersWithPositions,
      gameId: gameId,
      ballPosition,
    });

    const FIXED = 1000 / 60; // ms
    let simTime = 0;

    setInterval(() => {
      simTime += FIXED;

      // Step Arcade Physics manually
      physics.world.update(simTime, FIXED);

      console.log("ball position:", getBallPosition(ball));
      io.sockets.to(gameId).emit("BALL_POSITION_UPDATE", {
        ballPosition: getBallPosition(ball),
      });
    }, FIXED);
  });

  socket.on("disconnect", (reason) => {
    console.log("DISCONNECTED", socket.id, reason);
    allConnectedUsers = allConnectedUsers.filter((user) => user.id !== userId);
    io.sockets.to(gameId).emit("USERS_IN_LOBBY_CHANGE", {
      users: getUsersInTheRoom(gameId),
      gameId: gameId,
    });
  });
});

io.listen(3000);
console.log("server is listening");

const getCalculatedTeam = (gameId) => {
  const usersInTheRoom = getUsersInTheRoom(gameId);
  const teamACount = usersInTheRoom.filter((u) => u.team === 1).length;
  const teamBCount = usersInTheRoom.filter((u) => u.team === 2).length;
  return teamACount <= teamBCount ? 1 : 2;
};
