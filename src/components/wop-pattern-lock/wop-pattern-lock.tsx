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
    this.canvas = (this.el.querySelector('canvas') as HTMLCanvasElement);
    this.ctx = this.canvas.getContext('2d');
    this.bound = this.canvas.getBoundingClientRect();
  }

  @Method()
  generateGrid(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.renderGrid();
  }

  renderGrid() {
    this.ctx.fillStyle = '#2c3e50'; // hacer configurable
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.interval = {
      x: this.width / (this.rows + 1),
      y: this.height / (this.cols + 1),
    };

    console.log(this.bound);
    console.log(this.interval);

    // Draw all the nodes
    //this.forEachNode(this.drawNode.bind(this));
  }

  render() {
    return (
      <div>
        <canvas style={{
          height: this.height ? this.height + 'px' : '430px',
          width: this.width ? this.width + 'px' : '300px'
        }}></canvas>
      </div>
    );
  }
}
