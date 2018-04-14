import { flush, render } from '@stencil/core/testing';
import { PatternLock } from './wop-pattern-lock';

describe('wop-pattern-lock', () => {
  it('should build', () => {
    expect(new PatternLock()).toBeTruthy();
  });

  describe('rendering', () => {
    let element;
    beforeEach(async () => {
      element = await render({
        components: [PatternLock],
        html: '<wop-pattern-lock></wop-pattern-lock>'
      });
    });
  });
});
