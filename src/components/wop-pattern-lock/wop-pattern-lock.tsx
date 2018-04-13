import { Component, Prop, Method, Element } from '@stencil/core';

@Component({
  tag: 'wop-pattern-lock',
  styleUrl: 'wop-pattern-lock.css'
})
export class PatternLock {

  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private bound: ClientRect;
  private rows: number;
  private cols: number;
  private interval: { x: number, y: number};

  @Element() el: HTMLElement;

  @Prop() width: number = 300;
  @Prop() height: number = 430;

  componentDidLoad() {
    this.setCanvas();
    this.ctx = this.canvas.getContext('2d');
    this.bound = this.canvas.getBoundingClientRect();
  }

  @Method()
  generateGrid(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.renderGrid();
  }

  setCanvas() {
    this.canvas = (this.el.querySelector('canvas') as HTMLCanvasElement);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  renderGrid() {
    this.ctx.fillStyle = '#2c3e50'; // hacer configurable
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.interval = {
      x: this.width / (this.rows + 1),
      y: this.height / (this.cols + 1),
    };

    console.log(this.bound);
    console.log('interval', this.interval);

    this.forEachNode(this.drawNode.bind(this));
  }

  forEachNode(drawNode) {

    const xGrid = Array(this.rows).fill(this.interval.x);
    const yGrid = Array(this.cols).fill(this.interval.y);

    const breakException = new Error('Break Exception');

    try {

      yGrid.reduce((y, dy) => {

        xGrid.reduce((x, dx) => {

          // If the callback returns false, break out of the loop
          if (drawNode(x, y) === false)
            throw breakException;

          return x + dx;

        }, this.interval.x);

        return y + dy;

      }, this.interval.y);

    } catch (e) {
      if (e !== breakException) throw e;
    }
  }

  drawNode(x, y, centerColor = '#ffffff', borderColor = '#ffffff', size = 1) {

    // Config
    this.ctx.lineWidth = size; // hacer configurable el size
    this.ctx.fillStyle = centerColor;
    this.ctx.strokeStyle = borderColor;

    // Draw inner circle
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, Math.PI * 2); // hacer configurable el radio
    this.ctx.fill();

    // Draw outer ring
    this.ctx.beginPath();
    this.ctx.arc(x, y, 28, 0, Math.PI * 2); // hacer configurable el radio
    this.ctx.stroke();
  }

  render() {
    return (
      <div>
        <canvas></canvas>
      </div>
    );
  }
}
