import { nanoid } from "nanoid";
import { Server } from "socket.io";
import { readFileSync } from "fs";
import * as https from "node:https";
import * as http from "node:http";
import { pack } from "msgpackr";
import { createBall, createPlayerSprite, createPhysics } from "./physics.js";

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

let allConnectedUsers = [];

const lobbies = new Map();
io.on("connection", (socket) => {
  const { username, userId, gameId: _gameId } = socket.handshake.query;
  console.log("New connection:", {
    username,
    userId,
    _gameId,
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
      physics: null,
      score: { A: 0, B: 0 },
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

  socket.on("START_GAME", ({ gameId, reset = false }) => {
    if (!gameId) return;
    const lobby = lobbies.get(gameId);
    lobby.physics = createPhysics();
    const usersInTheRoom = lobby.players;
    const playersTeamA = usersInTheRoom.filter((u) => u.team === 1);
    const playersTeamB = usersInTheRoom.filter((u) => u.team === 2);

    let canScoreIncrease = true;
    lobby.ballSprite = createBall(lobby.physics, (team) => {
      if (!canScoreIncrease) return;
      lobby.score[team]++;
      io.sockets.to(gameId).emit("SCORE_UPDATE", {
        ...lobby.score,
      });
      canScoreIncrease = false;
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

    const SIM_DT_MS = 15;
    const UPDATE_DT_MS = 45;

    if (reset) {
      lobby.score = { A: 0, B: 0 };
    }

    io.sockets.to(gameId).emit(reset ? "GAME_RESET" : "GAME_STARTED", {
      ...getSnapshotOfLobby(lobby),
      players: lobby.players,
      gameId,
    });

    let simTime = 0;
    const physicsInterval = setInterval(() => {
      simTime++;
      lobby.physics.world.update(simTime, SIM_DT_MS);
    }, SIM_DT_MS);

    const snapshotInterval = setInterval(() => {
      const snapshot = getSnapshotOfLobby(lobby);
      io.sockets.to(gameId).emit("SNAPSHOT_UPDATE", pack(snapshot));
    }, UPDATE_DT_MS);

    socket.on("GAME_OVER", () => {
      clearInterval(physicsInterval);
      clearInterval(snapshotInterval);
    });
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
  p: lobby.playerSpriteList.map((p) => ({
    x: parseFloat(p.x.toFixed(2)),
    y: parseFloat(p.y.toFixed(2)),
  })),
  b: {
    x: parseFloat(lobby.ballSprite.x.toFixed(2)),
    y: parseFloat(lobby.ballSprite.y.toFixed(2)),
  },
});
