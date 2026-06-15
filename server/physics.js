import { ArcadePhysics } from "arcade-physics";

const config = {
  width: 1280,
  height: 720,
  max: {
    width: 1280,
    height: 720,
  },
  gravity: {
    x: 0,
    y: 0,
  },
};

const createPhysics = () => {
  const ph = new ArcadePhysics(config);
  ph.world.setBounds(0, 82, 1280, 612);
  return ph;
};

const createFakeWalls = (physics) => {
  const corner1 = physics.add.body(1, 56, 86, 254);
  const corner2 = physics.add.body(1193, 56, 86, 254);
  const corner3 = physics.add.body(1193, 466, 86, 254);
  const corner4 = physics.add.body(1, 466, 86, 254);
};

const size = 55;
const initialBallX = config.width / 2 - size / 2;
const initialBallY = config.height / 2 + 56 - size;
const createBall = (lobby, goalCallback) => {
  const ball = lobby.physics.add.body(initialBallX, initialBallY, size, size);
  ball.setCollideWorldBounds();
  ball.setCircle(size / 2);
  ball.setBounce(0.8, 0.8);
  ball.setMass(0.5);
  ball.setDamping(true);
  ball.setDrag(0.5);

  const goalB = lobby.physics.add.body(1, 310, 77, 156);
  const goalA = lobby.physics.add.body(1203, 310, 77, 156);

  lobby.physics.add.overlap(ball, goalA, () => goalCallback("A"));
  lobby.physics.add.overlap(ball, goalB, () => goalCallback("B"));

  const cornerPositions = [
    { x: 1, y: 56 },
    { x: 1193, y: 56 },
    { x: 1193, y: 466 },
    { x: 1, y: 466 },
  ];

  lobby.corners = [];
  cornerPositions.forEach((pos, index) => {
    const corner = lobby.physics.add.body(pos.x, pos.y, 86, 254);
    corner.pushable = false;
    lobby.corners.push(corner);
  });
  lobby.corners.forEach((corner) => {
    lobby.physics.add.collider(ball, corner);
  });

  return ball;
};

const createPlayerSprite = (x, y, physics, ballSprite, corners) => {
  const size = 90;
  const body = physics.add.body(x, y, size, size);
  body.setCollideWorldBounds();
  body.setCircle(size / 2);
  body.setMass(1.2);
  body.setBounce(0.8);
  body.setDamping(true);
  body.setDrag(0.2);
  body.pushable = true;

  physics.add.collider(ballSprite, body);
  physics.add.collider(body, ballSprite);
  corners.forEach((corner) => {
    physics.add.collider(body, corner);
  });

  return body;
};

export {
  createBall,
  createPlayerSprite,
  createPhysics,
  initialBallX,
  initialBallY,
};
