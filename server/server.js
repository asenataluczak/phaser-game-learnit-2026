import { nanoid } from "nanoid";
import { Server } from "socket.io";
import { readFileSync } from "fs";
import * as https from "node:https";
import * as http from "node:http";
import { pack } from "msgpackr";
import {
  createBall,
  createPlayerSprite,
  createPhysics,
  initialBallX,
  initialBallY,
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
  { x: 300, y: 300 },
  { x: 200, y: 400 },
];

const INITIAL_POSITIONS_TEAM_B = [
  { x: 500, y: 400 },
  { x: 600, y: 500 },
  { x: 400, y: 300 },
  { x: 350, y: 200 },
];

const lobbies = new Map();
const userSockets = new Map();

const GAME_TIMEOUT_S = 20;

const ensureLobby = (gameId) => {
  if (!lobbies.has(gameId)) {
    lobbies.set(gameId, {
      players: [],
      playerSpriteList: [],
      ballSprite: null,
      physics: null,
      score: { A: 0, B: 0 },
      canScoreIncrease: true,
      gameTimeout: GAME_TIMEOUT_S,
    });
  }
  return lobbies.get(gameId);
};

const emitUsersInLobbyChange = (gameId) => {
  if (!gameId || !lobbies.has(gameId)) return;
  io.sockets.to(gameId).emit("USERS_IN_LOBBY_CHANGE", {
    users: lobbies.get(gameId).players,
    gameId,
  });
};

const removeUserFromLobby = (gameId, userId) => {
  if (!gameId || !userId || !lobbies.has(gameId)) return;
  const lobby = lobbies.get(gameId);
  lobby.players = lobby.players.filter((p) => p.id !== userId);

  if (!lobby.players.length) {
    clearIntervalsForLobby(lobby);
    lobbies.delete(gameId);
  } else {
    // If the host left, make the first player the new host.
    const anyHost = lobby.players.some((p) => p.host);
    if (!anyHost) lobby.players[0].host = true;
  }
};

const joinLobby = (socket, gameId) => {
  const { userId, username } = socket.data;
  if (!userId || !username) return;

  const prevGameId = socket.data.gameId;
  if (prevGameId && prevGameId !== gameId) {
    socket.leave(prevGameId);
    removeUserFromLobby(prevGameId, userId);
    emitUsersInLobbyChange(prevGameId);
  }

  socket.data.gameId = gameId;
  socket.join(gameId);

  const lobby = ensureLobby(gameId);

  const userAlreadyInLobby = lobby.players.find((p) => p.id === userId);
  if (!userAlreadyInLobby) {
    lobby.players.push({
      id: userId,
      name: username,
      gameId,
      team: getCalculatedTeam(gameId),
      host: !lobby.players.length,
    });
  }
  if (lobby.gameInProgress && userAlreadyInLobby) {
    socket.emit("GAME_STARTED", {
      ...getSnapshotOfLobby(lobby),
      players: lobby.players,
      score: lobby.score,
      gameTimeout: lobby.gameTimeout,
      gameInProgress: lobby.gameInProgress,
      gameId,
    });
  }

  emitUsersInLobbyChange(gameId);
};

io.use((socket, next) => {
  const { username, userId } = socket.handshake.query;

  if (!username || !userId) {
    console.log("ERROR");
    return next(new Error("Invalid handshake"));
  }

  next();
});
io.on("connection", (socket) => {
  const { username, userId, gameId: _gameId } = socket.handshake.query;

  socket.data.userId = userId.toString();
  socket.data.username = username.toString();

  // Enforce 1 active socket per userId.
  const existingSocketId = userSockets.get(socket.data.userId);
  if (existingSocketId && existingSocketId !== socket.id) {
    const existingSocket = io.sockets.sockets.get(existingSocketId);
    existingSocket?.disconnect(true);
  }
  userSockets.set(socket.data.userId, socket.id);

  console.log("New connection:", {
    username: socket.data.username,
    userId: socket.data.userId,
    _gameId,
  });

  const initialGameId = (_gameId && _gameId.toString()) || nanoid(6);
  joinLobby(socket, initialGameId);
  if (!_gameId) {
    socket.emit("GAME_ID_ASSIGNED", { gameId: initialGameId });
  }

  socket.on("JOIN_GAME", ({ gameId }) => {
    if (!gameId) return;
    joinLobby(socket, gameId.toString());
  });

  socket.on("CREATE_GAME", () => {
    const gameId = nanoid(6);
    joinLobby(socket, gameId);
    socket.emit("GAME_ID_ASSIGNED", { gameId });
  });

  socket.on("START_GAME", ({ gameId: gameIdFromPayload } = {}) => {
    const gameId = socket.data.gameId || gameIdFromPayload;
    if (!gameId || !lobbies.has(gameId)) return;

    const lobby = lobbies.get(gameId);
    lobby.gameInProgress = true;
    lobby.physics = createPhysics();
    const usersInTheRoom = lobby.players;
    const playersTeamA = usersInTheRoom.filter((u) => u.team === 1);
    const playersTeamB = usersInTheRoom.filter((u) => u.team === 2);

    lobby.ballSprite = createBall(lobby.physics, (team) => {
      if (!lobby.canScoreIncrease) return;
      lobby.score[team]++;
      io.sockets.to(gameId).emit("SCORE_UPDATE", {
        ...lobby.score,
      });
      resetAfterGoal(lobby, gameId);
      lobby.canScoreIncrease = false;
    });
    const playerSpriteList = [];
    playersTeamA.forEach((p, i) => {
      const sprite = createPlayerSprite(
        ...Object.values(INITIAL_POSITIONS_TEAM_A[i]),
        lobby.physics,
      );
      if (playerSpriteList.length) {
        playerSpriteList.forEach((p, i) => {
          lobby.physics.add.collider(sprite, playerSpriteList[i]);
        });
      }
      playerSpriteList.push(sprite);
    });
    playersTeamB.forEach((p, i) => {
      const sprite = createPlayerSprite(
        ...Object.values(INITIAL_POSITIONS_TEAM_B[i]),
        lobby.physics,
      );
      if (playerSpriteList.length) {
        playerSpriteList.forEach((p, i) => {
          lobby.physics.add.collider(sprite, playerSpriteList[i]);
        });
      }
      playerSpriteList.push(sprite);
    });

    lobby.playerSpriteList = [...playerSpriteList];

    io.sockets.to(gameId).emit("GAME_STARTED", {
      ...getSnapshotOfLobby(lobby),
      players: lobby.players,
      gameTimeout: lobby.gameTimeout,
      gameId,
    });

    setIntervalsForLobby(lobby, gameId);

    socket.on("RESTART_GAME", () => {
      lobby.score = { A: 0, B: 0 };
      lobby.gameInProgress = true;
      lobby.gameTimeout = GAME_TIMEOUT_S;
      resetPositions(lobby);
      setIntervalsForLobby(lobby, gameId);
      io.sockets.to(gameId).emit("GAME_RESET", {});
    });

    socket.on("GAME_STOPPED", () => {
      clearIntervalsForLobby(lobby);
      lobby.gameInProgress = false;
    });
  });

  socket.on("INPUT", (cmd, playerIndex) => {
    const gameId = socket.data.gameId;
    if (!gameId || !lobbies.has(gameId)) return;
    const lobby = lobbies.get(gameId);
    if (!lobby.playerSpriteList[playerIndex]) return;
    lobby.playerSpriteList[playerIndex].setVelocity(cmd.dir.x, cmd.dir.y);
  });

  socket.on("disconnect", (reason) => {
    if (userSockets.get(socket.data.userId) !== socket.id) return;
    const gameId = socket.data.gameId;
    const lobby = lobbies.get(gameId);
    const user = lobby?.players.find((p) => p.id === socket.data.userId);
    if (!lobby?.gameInProgress && !user?.host) {
      console.log("DISCONNECTED", socket.id, reason, userSockets.size);
      userSockets.delete(socket.data.userId);
      removeUserFromLobby(gameId, socket.data.userId);
      emitUsersInLobbyChange(gameId);
    }
  });
});

const getCalculatedTeam = (gameId) => {
  const usersInTheRoom = lobbies.get(gameId).players;
  const teamACount = usersInTheRoom.filter((u) => u.team === 1).length;
  const teamBCount = usersInTheRoom.filter((u) => u.team === 2).length;
  return teamACount <= teamBCount ? 1 : 2;
};

const getSnapshotOfLobby = (lobby) => ({
  p: lobby.playerSpriteList.map((p) => ({
    x: parseFloat(p.x.toFixed(2)),
    y: parseFloat(p.y.toFixed(2)),
  })),
  b: {
    x: parseFloat(lobby.ballSprite.x.toFixed(2)),
    y: parseFloat(lobby.ballSprite.y.toFixed(2)),
  },
});

const GOAL_TIMEOUT_MS = 3000;
const resetAfterGoal = (lobby, gameId) => {
  setTimeout(() => {
    resetPositions(lobby);
    io.sockets.to(gameId).emit("GOAL_RESET", {
      ...getSnapshotOfLobby(lobby),
      players: lobby.players,
      gameId: lobby.gameId,
    });
    lobby.canScoreIncrease = true;
  }, GOAL_TIMEOUT_MS);
};

const SIM_DT_MS = 15;
const UPDATE_DT_MS = 45;
const setIntervalsForLobby = (lobby, gameId) => {
  let simTime = 0;
  lobby.physicsInterval = setInterval(() => {
    simTime++;
    lobby.physics.world.update(simTime, SIM_DT_MS);
  }, SIM_DT_MS);

  lobby.snapshotInterval = setInterval(() => {
    const snapshot = getSnapshotOfLobby(lobby);
    io.sockets.to(gameId).emit("SNAPSHOT_UPDATE", pack(snapshot));
  }, UPDATE_DT_MS);

  lobby.gameTimeInterval = setInterval(() => {
    if (!lobby.canScoreIncrease) return;
    if (lobby.gameTimeout === 0) {
      handleGameOver(lobby, gameId);
    } else {
      lobby.gameTimeout--;
      io.sockets.to(gameId).emit("GAME_TIMEOUT_UPDATE", lobby.gameTimeout);
    }
  }, 1000);
};

const handleGameOver = (lobby, gameId) => {
  clearIntervalsForLobby(lobby);
  io.sockets.to(gameId).emit("GAMEOVER");
};

const clearIntervalsForLobby = (lobby) => {
  clearInterval(lobby.physicsInterval);
  clearInterval(lobby.snapshotInterval);
  clearInterval(lobby.gameTimeInterval);
};

const resetPositions = (lobby) => {
  lobby.playerSpriteList.forEach((sprite, index) => {
    const initialPositions = [
      ...INITIAL_POSITIONS_TEAM_A,
      ...INITIAL_POSITIONS_TEAM_B,
    ];
    const initialPosition = initialPositions[index];
    lobby.playerSpriteList[index].x = initialPosition.x;
    lobby.playerSpriteList[index].y = initialPosition.y;
    lobby.playerSpriteList[index].setVelocity(0, 0);
  });
  lobby.ballSprite.x = initialBallX;
  lobby.ballSprite.y = initialBallY;
  lobby.ballSprite.setVelocity(0, 0);
};
