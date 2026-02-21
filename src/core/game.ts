export abstract class Game {
  private static MS_PER_UPDATE = 1000 / 60;
  private previousTimeMs = 0;
  private lag = 0;
  private animationId: number | undefined;

  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;

  protected abstract processInput(): void;
  protected abstract update(): void;
  protected abstract render(): void;
  protected abstract destroy(): void;

  constructor(selector: string) {
    const element = document.querySelector(selector);
    if (!element || !(element instanceof HTMLCanvasElement)) {
      throw new Error("Game cannot be initialized. Missing canvas element.");
    }
    this.canvas = element;

    const ctx = element.getContext("2d");
    if (!ctx) {
      throw new Error("Game cannot be initialized. Could not get 2d context.");
    }
    this.ctx = ctx;
  }

  private loop(currentTimeMs: number) {
    const elapsed = currentTimeMs - this.previousTimeMs;
    this.previousTimeMs = currentTimeMs;
    this.lag += elapsed;

    this.processInput();
    while (this.lag >= Game.MS_PER_UPDATE) {
      this.update();
      this.lag -= Game.MS_PER_UPDATE;
    }

    this.render();
    this.animationId = requestAnimationFrame((time) => this.loop(time));
  }

  public start() {
    this.animationId = requestAnimationFrame((time) => {
      this.previousTimeMs = time;
      this.loop(time);
    });
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    this.destroy();
  }
}
