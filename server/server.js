import { nanoid } from "nanoid";
import { Server } from "socket.io";
import { readFileSync } from "fs";
import * as https from "node:https";
import * as http from "node:http";
import {
  getBallPosition,
  createBall,
  getPlayersPositions,
  createPlayerSprite,
  physics,
} from "./physics.js";

const isProd = process.env.NODE_ENV === "production";

const httpsServer = isProd
  ? https.createServer({
      key: readFileSync(
        "/app/ankara-messi/server/ssl/ankara-messi.asenata.dev.key",
      ),
      cert: readFileSync(
        "/app/ankara-messi/server/ssl/ankara-messi.asenata.dev.crt",
      ),
    })
  : http.createServer();

const io = new Server(httpsServer, {
  cors: {
    origin: isProd
      ? "https://ankara-messi.asenata.dev"
      : "http://localhost:4200",
  },
});

httpsServer.listen({ port: 3000 }, () => {
  console.log("server is listening");
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

const lobbies = new Map();
io.on("connection", (socket) => {
  const { username, userId, gameId: _gameId } = socket.handshake.query;
  console.log("New connection:", {
    username,
    userId,
    _gameId,
    sid: socket.handshake,
  });

  if (!userId) {
    socket.disconnect(true);
    return;
  }

  const gameId = _gameId || nanoid(6);
  socket.join(gameId);

  if (!lobbies.has(gameId)) {
    lobbies.set(gameId, {
      players: [],
      playerSpriteList: [],
      ballSprite: null,
    });
  }

  const userAlreadyInLobby = lobbies.get(gameId).players.find((player) => {
    return player.id === userId;
  });
  if (!userAlreadyInLobby) {
    const user = {
      id: userId.toString(),
      name: username.toString(),
      gameId,
      team: getCalculatedTeam(gameId),
      host: !lobbies.get(gameId).players.length,
    };
    lobbies.get(gameId).players.push(user);
  }

  io.sockets.to(gameId).emit("USERS_IN_LOBBY_CHANGE", {
    users: lobbies.get(gameId).players,
    gameId: gameId,
  });

  socket.on("START_GAME", ({ gameId }) => {
    if (!gameId) return;
    const usersInTheRoom = lobbies.get(gameId).players;
    const playersTeamA = usersInTheRoom.filter((u) => u.team === 1);
    const playersTeamB = usersInTheRoom.filter((u) => u.team === 2);
    const playerSpriteList = [
      ...playersTeamA.map((p, i) =>
        createPlayerSprite(...Object.values(INITIAL_POSITIONS_TEAM_A[i])),
      ),
      ...playersTeamB.map((p, i) =>
        createPlayerSprite(...Object.values(INITIAL_POSITIONS_TEAM_B[i])),
      ),
    ];
    lobbies.get(gameId).playerSpriteList = playerSpriteList;
    lobbies.get(gameId).ballSprite = createBall();

    const SIM_DT_MS = 7;
    const UPDATE_DT_MS = 15;

    io.sockets.to(gameId).emit("GAME_STARTED", {
      ...getSnapshotOfLobby(lobbies.get(gameId)),
      players: lobbies.get(gameId).players,
    });

    let simTime = 0;
    setInterval(() => {
      simTime++;
      physics.world.update(simTime, SIM_DT_MS);
      // snapshot.ball.position = getBallPosition(ball);
      // snapshot.players = getPlayersPositions(playersWithPositions);
    }, SIM_DT_MS);

    setInterval(() => {
      const snapshot = getSnapshotOfLobby(lobbies.get(gameId));
      io.sockets.to(gameId).emit("SNAPSHOT_UPDATE", snapshot);
    }, UPDATE_DT_MS);
  });

  socket.on("INPUT", (cmd, playerIndex) => {
    lobbies
      .get(gameId)
      .playerSpriteList[playerIndex].setVelocity(cmd.dir.x, cmd.dir.y);
  });

  socket.on("disconnect", (reason) => {
    console.log("DISCONNECTED", socket.id, reason);
    allConnectedUsers = allConnectedUsers.filter((user) => user.id !== userId);
    if (lobbies.has(gameId)) {
      const players = lobbies
        .get(gameId)
        .players.filter((player) => player.id !== userId);
      lobbies.get(gameId).players = players;
    }
    io.sockets.to(gameId).emit("USERS_IN_LOBBY_CHANGE", {
      users: lobbies.get(gameId).players,
      gameId: gameId,
    });
  });
});

const getCalculatedTeam = (gameId) => {
  const usersInTheRoom = lobbies.get(gameId).players;
  const teamACount = usersInTheRoom.filter((u) => u.team === 1).length;
  const teamBCount = usersInTheRoom.filter((u) => u.team === 2).length;
  return teamACount <= teamBCount ? 1 : 2;
};

const getSnapshotOfLobby = (lobby) => ({
  playerSpriteListData: lobby.playerSpriteList.map((p) => ({
    x: p.x,
    y: p.y,
  })),
  ballSpriteData: {
    x: lobby.ballSprite.x,
    y: lobby.ballSprite.y,
  },
});
