import { ArcadePhysics } from "arcade-physics";

const config = {
  width: 1280,
  height: 720,
  fps: 60, // Number of physics steps per second
  fixedStep: true, // Enforces the fixed timestep
  timeScale: 1,
  gravity: {
    x: 0,
    y: 1000,
  },
};

const physics = new ArcadePhysics(config);

// ball
const ball = physics.add.body(206, 20);
ball.setCircle(32);
ball.setBounce(0.8);
ball.setCollideWorldBounds(true);

const createBall = () => {
  const ball = physics.add.body(306, 20);
  ball.setCircle(32);
  ball.setBounce(0.8);
  ball.setCollideWorldBounds(true);
  return ball;
};

const getBallPosition = (ball) => {
  return {
    x: ball.x,
    y: ball.y,
  };
};

export { physics, createBall, getBallPosition };
