import { Component, Prop, Method, Element, Event, EventEmitter } from '@stencil/core';
import { CoordinatesXY, Theme } from '../../global/interfaces';
import { DEFAULT_THEME } from '../../global/utils';

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
  private interval: CoordinatesXY;
  private isDragging: boolean;
  private coordinates: CoordinatesXY;
  private selectedNodes: any[];
  private theme: Theme = DEFAULT_THEME;

  @Element() el: HTMLElement;

  @Prop() width: number = 300;
  @Prop() height: number = 430;

  @Event() patternCompleted: EventEmitter;

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

  @Method()
  setTheme(theme: Theme) {
    console.log(theme);
    this.theme.dimens = Object.assign({}, this.theme.dimens, theme.dimens || {});
    console.log(this.theme);
    theme.dimens = this.theme.dimens;
    this.theme = Object.assign({}, this.theme, theme);
    console.log(this.theme);
  }

  @Method()
  start() {
    this.canvas.addEventListener('mousedown', this.mouseStartHandler.bind(this));
    this.canvas.addEventListener('touchstart', this.mouseStartHandler.bind(this));
    window.addEventListener('mousemove', this.mouseMoveHandler.bind(this));
    window.addEventListener('touchmove', this.mouseMoveHandler.bind(this));
    this.canvas.addEventListener('mouseup', this.mouseEndHandler.bind(this));
    this.canvas.addEventListener('touchend', this.mouseEndHandler.bind(this));

    requestAnimationFrame(this.renderLoop.bind(this));
    requestAnimationFrame(this.calculationLoop.bind(this));
  }

  mouseStartHandler(e) {
    if (e) e.preventDefault();

    this.setInitialState();
    this.calculationLoop(false);
    this.renderLoop(false);
    this.isDragging = true;
  }

  mouseMoveHandler(e) {
    e.preventDefault();

    if (this.isDragging) {
      const mousePoint = {
        x: e.pageX || e.touches[0].pageX,
        y: e.pageY || e.touches[0].pageY,
      };
      mousePoint.x -= this.bound.left;
      mousePoint.y -= this.bound.top;

      if (
        mousePoint.x <= this.width && mousePoint.x > 0 &&
        mousePoint.y <= this.height && mousePoint.y > 0
      ) {
        this.coordinates = mousePoint;
      } else {
        this.mouseEndHandler(null);
      }
    }
  }

  mouseEndHandler(e) {
    if (e) e.preventDefault();

    this.coordinates = null;
    this.renderLoop(false);
    this.isDragging = false;
    this.patternCompleted.emit(this.selectedNodes.slice(0));
  }

  setInitialState() {
    this.coordinates = null;
    this.selectedNodes = [];
  }

  calculationLoop(runLoop: boolean | number = false) {
    if (this.isDragging && this.coordinates) {
      this.forEachNode((x, y) => {
        const dist = Math.sqrt(
          Math.pow(this.coordinates.x - x, 2) +
          Math.pow(this.coordinates.y - y, 2)
        );

        if (dist < this.theme.dimens.nodeRadius + 1) {
          const row = x / this.interval.x;
          const col = y / this.interval.y;
          const currentNode = { row, col };

          if (!this.isSelected(currentNode)) {
            this.selectedNodes.push(currentNode);
            return false;
          }
        }
      });
    }

    if (runLoop) {
      requestAnimationFrame(this.calculationLoop.bind(this));
    }
  }

  renderLoop(runLoop: boolean | number = true) {
    if (this.isDragging) {
      // Clear the canvas(Redundant)
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.renderGrid();
      // Plot all the selected nodes
      const lastNode =
        this.selectedNodes.reduce((prevNode, node) => {
          if (prevNode) {
            const point1: CoordinatesXY = { x: node.row * this.interval.x, y: node.col * this.interval.y };
            const point2: CoordinatesXY = { x: prevNode.row * this.interval.x, y: prevNode.col * this.interval.y };

            // Make the two selected nodes bigger
            this.drawNode(
              point1.x, point1.y,
              this.theme.accent, this.theme.primary,
              this.theme.dimens.nodeRing + 3
            );
            this.drawNode(
              point2.x, point2.y,
              this.theme.accent, this.theme.primary,
              this.theme.dimens.nodeRing + 3
            );

            // Join the nodes
            this.joinNodes(
              prevNode.row, prevNode.col,
              node.row, node.col
            );
          }

          return node;
        }, null);

      if (lastNode && this.coordinates) {
        // Draw the last node
        this.drawNode(
          lastNode.row * this.interval.x, lastNode.col * this.interval.y,
          this.theme.accent, this.theme.primary,
          this.theme.dimens.nodeRing + 6
        );

        // Draw a line between last node to the current drag position
        this.joinNodes(
          lastNode.row * this.interval.x, lastNode.col * this.interval.y,
          this.coordinates.x, this.coordinates.y,
          true  // IsCoordinates instead of row and column position
        );
      }
    }

    if (runLoop) {
      requestAnimationFrame(this.renderLoop.bind(this));
    }
  }

  joinNodes(row1, col1, row2, col2, isCoordinates = false) {
    let factor = this.interval;

    if (isCoordinates) {
      factor = { x: 1, y: 1 };
    }

    const point1: CoordinatesXY = { x: factor.x * row1, y: factor.y * col1 };
    const point2: CoordinatesXY = { x: factor.x * row2, y: factor.y * col2 };

    // Config
    this.ctx.lineWidth = this.theme.dimens.lineWidth;
    this.ctx.strokeStyle = this.theme.accent;
    this.ctx.lineCap = 'round';

    // Draw line
    this.ctx.beginPath();
    this.ctx.moveTo(point1.x, point1.y);
    this.ctx.lineTo(point2.x, point2.y);
    this.ctx.stroke();
  }

  isSelected(targetNode) {
    return !!this.selectedNodes.find(
      node => (
        node.row == targetNode.row &&
        node.col == targetNode.col
      )
    );
  }

  setCanvas() {
    this.canvas = (this.el.querySelector('canvas') as HTMLCanvasElement);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  renderGrid() {
    this.ctx.fillStyle = this.theme.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.interval = {
      x: this.width / (this.rows + 1),
      y: this.height / (this.cols + 1),
    };

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

  drawNode(x, y, centerColor = this.theme.primary, borderColor = this.theme.primary, size = this.theme.dimens.nodeRing) {

    // Config
    this.ctx.lineWidth = size;
    this.ctx.fillStyle = centerColor;
    this.ctx.strokeStyle = borderColor;

    // Draw inner circle
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.theme.dimens.nodeCore, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw outer ring
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.theme.dimens.nodeRadius, 0, Math.PI * 2);
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
