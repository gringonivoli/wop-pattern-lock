import { Component, Prop, Method, Element, Event, EventEmitter } from '@stencil/core';
import { CoordinatesXY, Theme, PatternNode } from '../../global/interfaces';
import { DEFAULT_THEME } from '../../global/utils';

@Component({
  tag: 'wop-pattern-lock'
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
  private selectedNodes: PatternNode[];
  private theme: Theme = DEFAULT_THEME;
  private playPatternInterval: number;

  @Element() el: HTMLElement;

  @Prop() width: number = 300;
  @Prop() height: number = 430;
  @Prop() intervalTime: number = 800;

  @Event({ eventName: 'patternLock:patternCompleted' }) patternCompleted: EventEmitter;
  @Event({ eventName: 'patternLock:patternPlayed' }) patternPlayed: EventEmitter;

  componentDidLoad() {
    this.setCanvas();
    this.ctx = this.canvas.getContext('2d');
  }

  @Method()
  generateGrid(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.renderGrid();
  }

  @Method()
  setTheme(theme: Theme) {
    this.theme.dimens = Object.assign({}, this.theme.dimens, theme.dimens || {});
    theme.dimens = this.theme.dimens;
    this.theme = Object.assign({}, this.theme, theme);
  }

  @Method()
  start() {
    this.canvas.addEventListener('mousedown', (e) => this.mouseStartHandler(e));
    this.canvas.addEventListener('touchstart', (e) => this.mouseStartHandler(e));
    window.addEventListener('mousemove', (e) => this.mouseMoveHandler(e));
    window.addEventListener('touchmove', (e) => this.mouseMoveHandler(e));
    this.canvas.addEventListener('mouseup', (e) => this.mouseEndHandler(e));
    this.canvas.addEventListener('touchend', (e) => this.mouseEndHandler(e));

    requestAnimationFrame((t) => this.renderLoop(t));
    requestAnimationFrame((t) => this.calculationLoop(t));
  }

  @Method()
  playPattern(nodes: any[]) {
    if (!this.playPatternInterval) {
      this.setInitialState();
      this.patternPlayed.emit(true);
      this.playPatternInterval = window.setInterval(() => {
        if (nodes.length) {
          this.selectedNodes.push(nodes.shift());
          this.calculationLoop(false);
          this.renderLoop(false);
          this.isDragging = true;
        } else {
          nodes = this.selectedNodes.slice(0);
          this.isDragging = false;
          this.setInitialState();
        }
      }, this.intervalTime);
    }
  }

  @Method()
  stopPattern() {
    if (this.playPatternInterval) {
      window.clearInterval(this.playPatternInterval);
      this.setInitialState();
      this.clearCanvas();
      this.patternPlayed.emit(false);
      this.playPatternInterval = null;
    }
  }

  @Method()
  resetPattern() {
    this.stopPattern();
    this.setInitialState();
    this.clearCanvas();
  }

  private clearCanvas() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.renderGrid();
  }

  mouseStartHandler(e) {
    this.stopPattern();
    if (e) e.preventDefault();

    this.setInitialState();
    this.calculationLoop(false);
    this.renderLoop(false);
    this.isDragging = true;
  }

  mouseMoveHandler(e) {
    e.preventDefault();
    this.bound = this.canvas.getBoundingClientRect();
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
    this.patternCompletedHandler();
  }

  patternCompletedHandler() {
    if (!this.playPatternInterval && this.selectedNodes.length) {
      this.patternCompleted.emit(this.selectedNodes.slice(0));
    }
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
          const currentNode: PatternNode = { row, col };

          if (!this.isSelected(currentNode)) {
            this.selectedNodes.push(currentNode);
            return false;
          }
        }
      });
    }

    if (runLoop) {
      requestAnimationFrame((t) => this.calculationLoop(t));
    }
  }

  renderLoop(runLoop: boolean | number = true) {
    if (this.isDragging) {
      this.clearCanvas();
      const lastNode =
        this.selectedNodes.reduce((prevNode, node) => {
          if (prevNode) {
            const point1: CoordinatesXY = { x: node.row * this.interval.x, y: node.col * this.interval.y };
            const point2: CoordinatesXY = { x: prevNode.row * this.interval.x, y: prevNode.col * this.interval.y };

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

            this.joinNodes(
              prevNode.row, prevNode.col,
              node.row, node.col
            );
          }

          return node;
        }, null);

      if (lastNode && this.coordinates) {
        this.drawNode(
          lastNode.row * this.interval.x, lastNode.col * this.interval.y,
          this.theme.accent, this.theme.primary,
          this.theme.dimens.nodeRing + 6
        );

        this.joinNodes(
          lastNode.row * this.interval.x, lastNode.col * this.interval.y,
          this.coordinates.x, this.coordinates.y,
          true  // IsCoordinates instead of row and column position
        );
      }
    }

    if (runLoop) {
      requestAnimationFrame((t) => this.renderLoop(t));
    }
  }

  joinNodes(row1, col1, row2, col2, isCoordinates = false) {
    let factor = this.interval;

    if (isCoordinates) {
      factor = { x: 1, y: 1 };
    }

    const point1: CoordinatesXY = { x: factor.x * row1, y: factor.y * col1 };
    const point2: CoordinatesXY = { x: factor.x * row2, y: factor.y * col2 };
    this.ctx.lineWidth = this.theme.dimens.lineWidth;
    this.ctx.strokeStyle = this.theme.accent;
    this.ctx.lineCap = 'round';
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

    this.forEachNode((x, y) => this.drawNode(x, y));
  }

  forEachNode(drawNode) {
    const xGrid = Array(this.rows).fill(this.interval.x);
    const yGrid = Array(this.cols).fill(this.interval.y);
    const breakException = new Error('Break Exception');
    try {
      yGrid.reduce((y, dy) => {
        xGrid.reduce((x, dx) => {
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
    this.ctx.lineWidth = size;
    this.ctx.fillStyle = centerColor;
    this.ctx.strokeStyle = borderColor;
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.theme.dimens.nodeCore, 0, Math.PI * 2);
    this.ctx.fill();
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
