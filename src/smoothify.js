const PIXEL_STEP = 10;
const LINE_HEIGHT = 40;
const PAGE_HEIGHT = 800;

const DELTA_DIVISOR = 4;

const deltaBuffer = [DELTA_DIVISOR, DELTA_DIVISOR, DELTA_DIVISOR];

class Smoothify {
  constructor(stepDuration = 1, stepSize = 100, wheelThrottle = 300) {
    this.stepDuration = stepDuration;
    this.stepSize = stepSize;
    this.wheelThrottle = wheelThrottle;

    this.scrollY = window.scrollY;
    this.tween = null;

    this._wheelHandlerFn = this._wheelHandler.bind(this);
    this._scrollHandlerFn = this._scrollHandler.bind(this);

    window.addEventListener('mousewheel', this._wheelHandlerFn);
    window.addEventListener('DOMMouseScroll', this._wheelHandlerFn);
    window.addEventListener('scroll', this._scrollHandlerFn);
  }

  // https://github.com/galambalazs/smoothscroll-for-websites/blob/master/SmoothScroll.js
  _isTouchpad(deltaY) {
    if (!deltaY) {
      return false;
    }
    function _isDivisible(num) {
      return (Math.floor(num / DELTA_DIVISOR) === num / DELTA_DIVISOR);
    }
    deltaY = Math.abs(deltaY);
    deltaBuffer.push(deltaY);
    deltaBuffer.shift();
    const allDivisable = (_isDivisible(deltaBuffer[0]) &&
      _isDivisible(deltaBuffer[1]) &&
      _isDivisible(deltaBuffer[2]));
    return !allDivisable;
  }

  // https://github.com/facebook/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js
  _normalizeWheel(event) {
    let sX = 0; // spinX
    let sY = 0; // spinY
    let pX = 0; // pixelX
    let pY = 0; // pixelX

    // Legacy
    if ('detail' in event) { sY = event.detail; }
    if ('wheelDelta' in event) { sY = -event.wheelDelta / 120; }
    if ('wheelDeltaY' in event) { sY = -event.wheelDeltaY / 120; }
    if ('wheelDeltaX' in event) { sX = -event.wheelDeltaX / 120; }

    // side scrolling on FF with DOMMouseScroll
    if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
      sX = sY;
      sY = 0;
    }

    pX = sX * PIXEL_STEP;
    pY = sY * PIXEL_STEP;

    if ('deltaY' in event) { pY = event.deltaY; }
    if ('deltaX' in event) { pX = event.deltaX; }

    if ((pX || pY) && event.deltaMode) {
      if (event.deltaMode === 1) { // delta in LINE units
        pX *= LINE_HEIGHT;
        pY *= LINE_HEIGHT;
      } else { // delta in PAGE units
        pX *= PAGE_HEIGHT;
        pY *= PAGE_HEIGHT;
      }
    }

    // Fall-back if spin cannot be determined
    if (pX && !sX) { sX = (pX < 1) ? -1 : 1; }
    if (pY && !sY) { sY = (pY < 1) ? -1 : 1; }

    return {
      spinX: sX,
      spinY: sY,
      pixelX: pX,
      pixelY: pY,
    };
  }

  _getDocumentHeight() {
    const doc = document;
    return Math.max(
      doc.body.scrollHeight, doc.documentElement.scrollHeight,
      doc.body.offsetHeight, doc.documentElement.offsetHeight,
      doc.body.clientHeight, doc.documentElement.clientHeight
    );
  }

  _scrollHandler() {
    if (!this.tween || !this.tween.isActive()) {
      this.scrollY = window.scrollY;
    }
  }

  _wheelHandler(event) {
    event = event.originalEvent || event;

    if (event.deltaY === -0) {
      return;
    }

    const isTouchPad = this._isTouchpad(event.wheelDeltaY || event.wheelDelta || event.detail || 0);

    if (!isTouchPad || event.type === 'DOMMouseScroll') {
      event.preventDefault();

      const deltaY = Hamster.normalise.delta(event)[0] > 0 ? 1 : -1;

      this.scroll(deltaY);
    }
  }

  scroll(deltaY) {
    this.scrollY -= deltaY * this.stepSize;

    const documentHeight = this._getDocumentHeight();

    this.scrollY = this.scrollY < 0 ? 0 : this.scrollY;
    this.scrollY = this.scrollY > documentHeight - window.innerHeight ?
      documentHeight - window.innerHeight : this.scrollY;

    const tweenProps = { scrollTo: { y: this.scrollY } };

    if (this.tween && this.tween.isActive()) {
      this.tween.updateTo(tweenProps, true);
      return;
    }

    this.tween = TweenMax.to(window, this.stepDuration, tweenProps);
  }

  destroy() {
    window.removeEventListener('mousewheel', this._wheelHandlerFn);
    window.removeEventListener('DOMMouseScroll', this._wheelHandlerFn);
    window.removeEventListener('scroll', this._scrollHandlerFn);
  }
}

export default Smoothify;
