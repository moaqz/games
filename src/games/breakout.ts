import { Game } from "~/core/game";

interface Block {
  position: {
    x: number;
    y: number;
  };
  size: {
    height: number;
    width: number;
  };
  visible: boolean;
  color: string;
  points: number;
}

const BLOCK_TYPE = [
  { color: "#ffff00", points: 1 },
  { color: "#00ff00", points: 3 },
  { color: "#ff8800", points: 5 },
  { color: "#ff0000", points: 7 },
] as const;

const SCREEN_BACKGROUND_COLOR = "#000";
const SCREEN_BORDER_COLOR = "#fff";
const PADDLE_COLOR = "#fff";
const BALL_COLOR = "#fff";

export class BreakoutGame extends Game {
  private readonly SCREEN_WIDTH = 600;
  private readonly SCREEN_HEIGHT = 600;
  private readonly SCREEN_BORDER_SIZE = 6;

  private readonly BLOCK_ROWS = 8;
  private readonly BLOCK_COLUMNS = 14;
  private readonly BLOCK_OFFSET = 5;
  private readonly BLOCK_GAP = 4;

  private readonly PADDLE_SPEED = 8;
  private readonly BALL_SPEED = 4.75;
  private readonly PLAYER_LIVES = 3;

  private state = {
    ball: {
      position: this.BALL_INITIAL_POSITION,
      velocity: {
        x: 0,
        y: 0,
      },
    },
    blocks: this.generateBlocks(),
    player: {
      isMovingLeft: false,
      isMovingRight: false,
      lives: this.PLAYER_LIVES,
      points: 0,
      position: this.PADDLE_INITIAL_POSITION,
    },
    waitingLaunch: true,
  };

  private keys: Record<string, boolean> = {};

  constructor(selector: string) {
    super(selector);

    this.canvas.width = this.SCREEN_WIDTH;
    this.canvas.height = this.SCREEN_HEIGHT;

    document.addEventListener("keyup", this.handleKeyUp);
    document.addEventListener("keydown", this.handleKeyDown);
  }

  protected processInput() {
    this.state.player.isMovingLeft = Boolean(this.keys["ArrowLeft"]);
    this.state.player.isMovingRight = Boolean(this.keys["ArrowRight"]);
  }

  protected update() {
    if (!this.hasLives) {
      return;
    }

    const isPlayerMoving = this.state.player.isMovingLeft || this.state.player.isMovingRight;

    if (this.state.waitingLaunch) {
      if (!isPlayerMoving) {
        return;
      }

      const launchAngle = this.BALL_LAUNCH_ANGLE;
      this.state.ball.velocity.x = this.BALL_SPEED * Math.cos(launchAngle);
      this.state.ball.velocity.y = this.BALL_SPEED * -Math.sin(launchAngle);
      this.state.waitingLaunch = false;
    }

    let newPosition = this.state.player.position.x;

    if (this.state.player.isMovingLeft) {
      newPosition -= this.PADDLE_SPEED;
    } else if (this.state.player.isMovingRight) {
      newPosition += this.PADDLE_SPEED;
    }

    this.state.player.position.x = Math.max(
      this.SCREEN_BORDER_SIZE,
      Math.min(newPosition, this.SCREEN_WIDTH - this.SCREEN_BORDER_SIZE - this.PADDLE_WIDTH),
    );

    this.state.ball.position.x += this.state.ball.velocity.x;
    this.state.ball.position.y += this.state.ball.velocity.y;

    this.checkBallCollisionWithBorders();
    this.checkBallCollisionWithPaddle();
    this.checkBallCollisionWithBlocks();
  }

  protected render() {
    this.drawBackground();
    this.drawBlocks();
    this.drawPaddle();
    this.drawBall();
  }

  protected destroy() {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
  }

  private get BLOCK_WIDTH() {
    const availableWidth = this.SCREEN_WIDTH - this.SCREEN_BORDER_SIZE * 2 - this.BLOCK_OFFSET * 2;
    return (availableWidth - this.BLOCK_GAP * (this.BLOCK_COLUMNS - 1)) / this.BLOCK_COLUMNS;
  }

  private get BLOCK_HEIGHT() {
    return this.BLOCK_WIDTH / 2;
  }

  private get PADDLE_WIDTH() {
    return this.SCREEN_WIDTH * 0.15;
  }

  private get PADDLE_HEIGHT() {
    return this.SCREEN_HEIGHT * 0.02;
  }

  private get BALL_SIZE() {
    return this.SCREEN_WIDTH * 0.02;
  }

  private get BALL_LAUNCH_ANGLE() {
    // Angle between 45° and 135°
    return (Math.random() * Math.PI) / 2 + Math.PI / 4;
  }

  private drawBackground() {
    this.ctx.fillStyle = SCREEN_BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

    this.ctx.fillStyle = SCREEN_BORDER_COLOR;

    this.ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_BORDER_SIZE);

    this.ctx.fillRect(
      0,
      this.SCREEN_HEIGHT - this.SCREEN_BORDER_SIZE,
      this.SCREEN_WIDTH,
      this.SCREEN_BORDER_SIZE,
    );

    this.ctx.fillRect(0, 0, this.SCREEN_BORDER_SIZE, this.SCREEN_HEIGHT);

    this.ctx.fillRect(
      this.SCREEN_WIDTH - this.SCREEN_BORDER_SIZE,
      0,
      this.SCREEN_BORDER_SIZE,
      this.SCREEN_HEIGHT,
    );
  }

  private drawBlocks() {
    for (const block of this.state.blocks) {
      if (!block.visible) {
        continue;
      }

      this.ctx.fillStyle = block.color;
      this.ctx.fillRect(block.position.x, block.position.y, block.size.width, block.size.height);
    }
  }

  private get PADDLE_INITIAL_POSITION() {
    return {
      x: this.SCREEN_WIDTH / 2 - this.PADDLE_WIDTH / 2,
      y: this.SCREEN_HEIGHT - this.SCREEN_BORDER_SIZE * 4 - this.PADDLE_HEIGHT,
    };
  }

  private get BALL_INITIAL_POSITION() {
    return {
      x: this.SCREEN_WIDTH / 2 - this.BALL_SIZE / 2,
      y:
        this.SCREEN_HEIGHT -
        this.SCREEN_BORDER_SIZE * 4 -
        this.PADDLE_HEIGHT -
        this.BALL_SIZE * 1.2,
    };
  }

  private get hasLives() {
    return this.state.player.lives > 0;
  }

  private drawPaddle() {
    this.ctx.fillStyle = PADDLE_COLOR;
    const { x, y } = this.state.player.position;
    this.ctx.fillRect(x, y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
  }

  private drawBall() {
    this.ctx.fillStyle = BALL_COLOR;
    this.ctx.fillRect(
      this.state.ball.position.x,
      this.state.ball.position.y,
      this.BALL_SIZE,
      this.BALL_SIZE,
    );
  }

  private generateBlocks(): Block[] {
    const blocks: Block[] = [];
    const screenOffset = this.SCREEN_BORDER_SIZE + this.BLOCK_OFFSET;

    for (let row = 0; row < this.BLOCK_ROWS; row++) {
      for (let col = 0; col < this.BLOCK_COLUMNS; col++) {
        const { color, points } = BLOCK_TYPE[Math.floor(row / 2)];

        blocks.push({
          color,
          points,
          position: {
            x: screenOffset + col * (this.BLOCK_WIDTH + this.BLOCK_GAP),
            y: screenOffset + row * (this.BLOCK_HEIGHT + this.BLOCK_GAP),
          },
          size: {
            height: this.BLOCK_HEIGHT,
            width: this.BLOCK_WIDTH,
          },
          visible: true,
        });
      }
    }

    return blocks;
  }

  private handleKeyUp = (event: KeyboardEvent) => {
    this.keys[event.key] = false;
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    this.keys[event.key] = true;
  };

  private checkBallCollisionWithBorders() {
    const isTouchingLeftBorder = this.state.ball.position.x <= this.SCREEN_BORDER_SIZE;
    const isTouchingRightBorder =
      this.state.ball.position.x + this.BALL_SIZE >= this.SCREEN_WIDTH - this.SCREEN_BORDER_SIZE;

    if (isTouchingLeftBorder) {
      this.state.ball.position.x = this.SCREEN_BORDER_SIZE;
      this.state.ball.velocity.x = -this.state.ball.velocity.x;
      return;
    }

    if (isTouchingRightBorder) {
      this.state.ball.position.x = this.SCREEN_WIDTH - this.SCREEN_BORDER_SIZE - this.BALL_SIZE;
      this.state.ball.velocity.x = -this.state.ball.velocity.x;
      return;
    }

    const isTouchingTopBorder = this.state.ball.position.y <= this.SCREEN_BORDER_SIZE;
    if (isTouchingTopBorder) {
      this.state.ball.position.y = this.SCREEN_BORDER_SIZE;
      this.state.ball.velocity.y = -this.state.ball.velocity.y;
      return;
    }

    const isTouchingBottomBorder =
      this.state.ball.position.y + this.BALL_SIZE >= this.SCREEN_HEIGHT - this.SCREEN_BORDER_SIZE;
    if (isTouchingBottomBorder) {
      this.state.player.lives--;
      this.resetRound();
    }
  }

  private checkBallCollisionWithPaddle() {
    if (
      this.state.ball.position.x + this.BALL_SIZE >= this.state.player.position.x &&
      this.state.ball.position.x <= this.state.player.position.x + this.PADDLE_WIDTH &&
      this.state.ball.position.y + this.BALL_SIZE >= this.state.player.position.y &&
      this.state.ball.position.y <= this.state.player.position.y + this.PADDLE_HEIGHT
    ) {
      const ballCenter = this.state.ball.position.x + this.BALL_SIZE / 2;
      const paddleCenter = this.state.player.position.x + this.PADDLE_WIDTH / 2;

      const normalizedImpact = (ballCenter - paddleCenter) / (this.PADDLE_WIDTH / 2);

      this.state.ball.velocity.x = normalizedImpact * this.BALL_SPEED;
      this.state.ball.velocity.y = -Math.abs(this.state.ball.velocity.y);
      this.state.ball.position.y = this.state.player.position.y - this.BALL_SIZE;
    }
  }

  private checkBallCollisionWithBlocks() {
    for (const block of this.state.blocks) {
      if (!block.visible) {
        continue;
      }

      if (
        this.state.ball.position.x + this.BALL_SIZE >= block.position.x &&
        this.state.ball.position.x <= block.position.x + block.size.width &&
        this.state.ball.position.y + this.BALL_SIZE >= block.position.y &&
        this.state.ball.position.y <= block.position.y + block.size.height
      ) {
        const overlapLeft = this.state.ball.position.x + this.BALL_SIZE - block.position.x;
        const overlapRight = block.position.x + block.size.width - this.state.ball.position.x;
        const overlapTop = this.state.ball.position.y + this.BALL_SIZE - block.position.y;
        const overlapBottom = block.position.y + block.size.height - this.state.ball.position.y;

        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapX < minOverlapY) {
          this.state.ball.velocity.x = -this.state.ball.velocity.x;
        } else {
          this.state.ball.velocity.y = -this.state.ball.velocity.y;
        }

        block.visible = false;
        this.state.player.points += block.points;
        this.state.ball.velocity.x *= 1.01;
        this.state.ball.velocity.y *= 1.01;
        break;
      }
    }
  }

  private resetRound() {
    this.state.ball.position = this.BALL_INITIAL_POSITION;
    this.state.player.position = this.PADDLE_INITIAL_POSITION;
    this.state.ball.velocity = { x: 0, y: 0 };
    this.state.waitingLaunch = true;
  }
}
