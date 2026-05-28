import { nanoid } from "nanoid";
import { Server } from "socket.io";

const io = new Server({
    cors: {
        origin: "http://localhost:4200",
    },
});

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

io.on("connection", (socket) => {
    const { username, userId, gameId: _gameId } = socket.handshake.query;

    console.log("New connection:", { username, userId, _gameId });
    if (!userId) {
        socket.disconnect(true);
        return;
    }

    const gameId = _gameId || nanoid(6);
    console.log("GAME ID", _gameId, gameId);

    socket.join(gameId);

    const currentUserIndex = allConnectedUsers.findIndex(
        (user) => {
            console.log("CHECKING USER ID", user.id, userId);
            return user.id === userId
        },
    );
    console.log("CURRENT USER INDEX", currentUserIndex);
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
    console.log("ALL CONNECTED USERS", allConnectedUsers);

    console.log("EMIT", gameId);
    console.log("USERS IN THE ROOM", getUsersInTheRoom(gameId));
    io.sockets.to(gameId).emit("USERS_IN_LOBBY_CHANGE", {
        users: getUsersInTheRoom(gameId),
        gameId: gameId,
    });

    socket.on("disconnect", (reason) => {
        console.log("DISCONNECTED", socket.id, reason);
        allConnectedUsers = allConnectedUsers.filter(
            (user) => user.id !== userId,
        );
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
