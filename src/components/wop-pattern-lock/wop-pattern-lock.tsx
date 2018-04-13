import { Component, Prop, Method, Element } from '@stencil/core';

@Component({
  tag: 'wop-pattern-lock',
  styleUrl: 'wop-pattern-lock.css',
  shadow: true
})
export class PatternLock {

  render() {
    return (
      <div>
        <canvas></canvas>
      </div>
    );
  }
}
