import { Game } from "../core/game";

enum Control {
  KEYBOARD = "keyboard",
  MOUSE = "mouse",
}

enum Difficulty {
  PRACTICE = "practice",
  NORMAL = "normal",
}

export interface PongSettings {
  controls: Control;
  difficulty: Difficulty;
}

export class PongGame extends Game {
  private static SCREEN_WIDTH = 600;
  private static SCREEN_HEIGHT = 600;
  private static SCREEN_BORDER = 20;

  private BACKGROUND_COLOR = "#000";
  private BORDER_COLOR = "#ccc";

  private static BLOCK_WIDTH = 15;
  private static BLOCK_HEIGHT = 15;
  private static BLOCK_GAP = 15;
  private BLOCK_COLOR = "#ccc";

  private static PADDLE_WIDTH = 15;
  private static PADDLE_HEIGHT = 80;
  private static PADDLE_GAP = 20;
  private PADDLE_COLOR = "#ccc";
  private PADDLE_SPEED = 10;

  private static BALL_WIDTH = 15;
  private static BALL_HEIGHT = 15;
  private BALL_COLOR = "#ccc";
  private BALL_SPEED_X = 6;
  private BALL_SPEED_Y = 4;

  private AI_SPEED = 3;

  private readonly settings;

  private state = {
    ai: {
      score: 0,
      x: PongGame.SCREEN_WIDTH - PongGame.PADDLE_GAP - PongGame.PADDLE_WIDTH,
      y: PongGame.SCREEN_HEIGHT / 2 - PongGame.PADDLE_HEIGHT / 2,
    },
    ball: {
      vx: 0,
      vy: 0,
      x: 0,
      y: 0,
    },
    hasWinner: false,
    player: {
      movingDown: false,
      movingUp: false,
      score: 0,
      x: PongGame.PADDLE_GAP,
      y: PongGame.SCREEN_HEIGHT / 2 - PongGame.PADDLE_HEIGHT / 2,
    },
    round: 0,
    waitingLaunch: true,
  };

  private keys: Record<string, boolean> = {};

  constructor(selector: string, settings: PongSettings) {
    super(selector);

    this.canvas.width = PongGame.SCREEN_WIDTH;
    this.canvas.height = PongGame.SCREEN_HEIGHT;
    this.settings = settings;

    if (settings.controls === Control.KEYBOARD) {
      document.addEventListener("keydown", this.handleKeyDown);
      document.addEventListener("keyup", this.handleKeyUp);
    }
  }

  protected processInput() {
    if (this.settings.controls === Control.KEYBOARD) {
      this.state.player.movingUp = Boolean(this.keys["ArrowUp"]);
      this.state.player.movingDown = Boolean(this.keys["ArrowDown"]);
    }
  }

  protected destroy() {
    if (this.settings.controls === Control.KEYBOARD) {
      document.removeEventListener("keydown", this.handleKeyDown);
      document.removeEventListener("keyup", this.handleKeyUp);
    }
  }

  protected update() {
    if (this.hasWinner()) {
      this.resetGame();
      return;
    }

    if (this.state.waitingLaunch) {
      const isPlayerMoving = this.state.player.movingUp || this.state.player.movingDown;
      if (isPlayerMoving) {
        this.startRound();
      }

      return;
    }

    let newPlayerPosition = this.state.player.y;

    if (this.state.player.movingUp) {
      newPlayerPosition -= this.PADDLE_SPEED;
    } else if (this.state.player.movingDown) {
      newPlayerPosition += this.PADDLE_SPEED;
    }

    if (this.canMoveVertically(newPlayerPosition)) {
      this.state.player.y = newPlayerPosition;
    }

    this.state.ball.x += this.state.ball.vx;
    this.state.ball.y += this.state.ball.vy;

    this.updateAIPosition();
    this.checkBallBounds();
    this.checkPlayerPaddleCollision();
    this.checkAIPaddleCollision();
  }

  protected render() {
    this.drawBackground();
    this.drawScore();
    this.drawPaddles();

    if (!this.state.waitingLaunch) {
      this.drawBall();
    }
  }

  private drawBackground() {
    this.ctx.fillStyle = this.BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, PongGame.SCREEN_WIDTH, PongGame.SCREEN_HEIGHT);

    this.ctx.fillStyle = this.BORDER_COLOR;
    this.ctx.fillRect(0, 0, PongGame.SCREEN_WIDTH, PongGame.SCREEN_BORDER);
    this.ctx.fillRect(
      0,
      PongGame.SCREEN_HEIGHT - PongGame.SCREEN_BORDER,
      PongGame.SCREEN_WIDTH,
      PongGame.SCREEN_BORDER,
    );

    const blockWidth = PongGame.BLOCK_WIDTH;
    const blockHeight = PongGame.BLOCK_HEIGHT;
    const gap = PongGame.BLOCK_GAP;
    const blockX = PongGame.SCREEN_WIDTH / 2 - blockWidth / 2;

    this.ctx.fillStyle = this.BLOCK_COLOR;
    for (let y = 0; y < PongGame.SCREEN_HEIGHT; y += blockHeight + gap) {
      this.ctx.fillRect(blockX, y, blockWidth, blockHeight);
    }
  }

  private drawPaddles() {
    this.ctx.fillStyle = this.PADDLE_COLOR;

    this.ctx.fillRect(
      this.state.player.x,
      this.state.player.y,
      PongGame.PADDLE_WIDTH,
      PongGame.PADDLE_HEIGHT,
    );

    this.ctx.fillRect(
      this.state.ai.x,
      this.state.ai.y,
      PongGame.PADDLE_WIDTH,
      PongGame.PADDLE_HEIGHT,
    );
  }

  private drawScore() {
    const posX = PongGame.SCREEN_WIDTH / 2;

    this.ctx.font = "48px serif";
    this.ctx.textAlign = "center";

    this.ctx.fillText(`${this.state.player.score}`, posX - 80, PongGame.SCREEN_BORDER * 4);
    this.ctx.fillText(`${this.state.ai.score}`, posX + 80, PongGame.SCREEN_BORDER * 4);
  }

  private drawBall() {
    this.ctx.fillStyle = this.BALL_COLOR;
    this.ctx.fillRect(
      this.state.ball.x,
      this.state.ball.y,
      PongGame.BALL_WIDTH,
      PongGame.BALL_HEIGHT,
    );
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    this.keys[event.key] = true;
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.keys[event.key] = false;
  };

  private canMoveVertically(pos: number) {
    return (
      pos >= PongGame.SCREEN_BORDER &&
      pos + PongGame.PADDLE_HEIGHT <= PongGame.SCREEN_HEIGHT - PongGame.SCREEN_BORDER
    );
  }

  private checkBallBounds() {
    if (this.state.ball.y <= PongGame.SCREEN_BORDER) {
      this.state.ball.y = PongGame.SCREEN_BORDER;
      this.state.ball.vy = -this.state.ball.vy;
    }

    if (
      this.state.ball.y + PongGame.BALL_HEIGHT >=
      PongGame.SCREEN_HEIGHT - PongGame.SCREEN_BORDER
    ) {
      this.state.ball.y = PongGame.SCREEN_HEIGHT - PongGame.SCREEN_BORDER - PongGame.BALL_HEIGHT;
      this.state.ball.vy = -this.state.ball.vy;
    }

    if (this.state.ball.x >= PongGame.SCREEN_WIDTH) {
      this.state.player.score++;
      this.resetGame();
    }

    if (this.state.ball.x <= 0) {
      this.state.ai.score++;
      this.resetGame();
    }
  }

  private checkPlayerPaddleCollision() {
    if (
      this.state.ball.x + PongGame.BALL_WIDTH >= this.state.player.x &&
      this.state.ball.x <= this.state.player.x + PongGame.PADDLE_WIDTH &&
      this.state.ball.y + PongGame.BALL_HEIGHT >= this.state.player.y &&
      this.state.ball.y <= this.state.player.y + PongGame.PADDLE_HEIGHT
    ) {
      const ballCenter = this.state.ball.y + PongGame.BALL_HEIGHT / 2;
      const paddleCenter = this.state.player.y + PongGame.PADDLE_HEIGHT / 2;

      // normalizedImpact maps the hit position to [-1, 1]
      // where -1 is the top edge and 1 is the bottom edge of the paddle
      const normalizedImpact = (ballCenter - paddleCenter) / (PongGame.PADDLE_HEIGHT / 2);

      this.state.ball.vx = -this.state.ball.vx;
      this.state.ball.vy = normalizedImpact === 0 ? 1 : normalizedImpact * this.BALL_SPEED_Y;
      this.state.ball.x = this.state.player.x + PongGame.PADDLE_WIDTH;
    }
  }

  private checkAIPaddleCollision() {
    if (
      this.state.ball.x + PongGame.BALL_WIDTH >= this.state.ai.x &&
      this.state.ball.x <= this.state.ai.x + PongGame.PADDLE_WIDTH &&
      this.state.ball.y + PongGame.BALL_HEIGHT >= this.state.ai.y &&
      this.state.ball.y <= this.state.ai.y + PongGame.PADDLE_HEIGHT
    ) {
      const ballCenter = this.state.ball.y + PongGame.BALL_HEIGHT / 2;
      const paddleCenter = this.state.ai.y + PongGame.PADDLE_HEIGHT / 2;

      // normalizedImpact maps the hit position to [-1, 1]
      // where -1 is the top edge and 1 is the bottom edge of the paddle
      const normalizedImpact = (ballCenter - paddleCenter) / (PongGame.PADDLE_HEIGHT / 2);

      this.state.ball.vx = -this.state.ball.vx;
      this.state.ball.vy = normalizedImpact === 0 ? 1 : normalizedImpact * this.BALL_SPEED_Y;
    }
  }

  private updateAIPosition() {
    if (this.settings.difficulty === Difficulty.PRACTICE) {
      this.state.ai.y = Math.max(
        PongGame.SCREEN_BORDER,
        Math.min(
          this.state.ball.y,
          PongGame.SCREEN_HEIGHT - PongGame.SCREEN_BORDER - PongGame.PADDLE_HEIGHT,
        ),
      );

      return;
    }

    const aiCenter = this.state.ai.y + PongGame.PADDLE_HEIGHT / 2;
    const ballCenter = this.state.ball.y + PongGame.BALL_HEIGHT / 2;
    const diff = Math.abs(ballCenter - aiCenter);

    if (diff <= this.AI_SPEED) {
      return;
    }

    const isBallHigherThanAIPaddle = ballCenter < aiCenter;
    const newAIPosition = isBallHigherThanAIPaddle
      ? this.state.ai.y - this.AI_SPEED
      : this.state.ai.y + this.AI_SPEED;

    if (this.canMoveVertically(newAIPosition)) {
      this.state.ai.y = newAIPosition;
    }
  }

  private initBall() {
    this.state.ball.x = PongGame.SCREEN_WIDTH / 2 - PongGame.BALL_WIDTH / 2;

    const range = PongGame.SCREEN_HEIGHT / 8;
    const initialY = Math.floor(Math.random() * range * 2) - range;
    this.state.ball.y = PongGame.SCREEN_HEIGHT / 2 + initialY;

    this.state.ball.vx = this.BALL_SPEED_X * (Math.random() > 0.5 ? 1 : -1);
    this.state.ball.vy = this.BALL_SPEED_Y * (Math.random() > 0.5 ? 1 : -1);
  }

  private startRound() {
    this.initBall();
    this.state.round++;
    this.state.waitingLaunch = false;
  }

  private resetGame() {
    this.initBall();
    this.state.waitingLaunch = true;
  }

  private hasWinner() {
    return this.state.player.score >= 10 || this.state.ai.score >= 10;
  }
}
