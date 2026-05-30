import { ArcadePhysics } from "arcade-physics";

const config = {
  width: 1280,
  height: 720,
  gravity: {
    x: 0,
    y: 0,
  },
};

const physics = new ArcadePhysics(config);
physics.world.setBounds(0, 56, 1280, 664);

let ballSprite;
const createBall = () => {
  const size = 75;
  const ball = physics.add.body(
    config.width / 2 - size / 2,
    config.height / 2 + 56 - size + 10,
    size,
    size,
  );
  ball.setCollideWorldBounds();
  ball.setCircle(size / 2);
  ball.setBounce(0.8, 0.8);
  ball.setMass(0.5);
  ball.setDamping(true);
  ball.setDrag(0.7);
  ballSprite = ball;
  return ball;
};
// set colliders on ball

const playersSprites = [];
const createPlayerSprite = (x, y) => {
  const size = 90;
  const body = physics.add.body(x, y, size, size);
  body.setCollideWorldBounds();
  body.setCircle(size / 2);
  body.setMass(1);
  body.setBounce(0.6);
  body.setDamping(true);
  body.setDrag(0.3);
  body.pushable = true;

  physics.add.collider(ballSprite, body);
  physics.add.collider(body, ballSprite);

  playersSprites.forEach((p, i) => {
    physics.add.collider(body, playersSprites[i]);
  });
  playersSprites.push(body);

  return body;
};
// set colliders on players

export { physics, createBall, createPlayerSprite };
