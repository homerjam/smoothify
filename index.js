import Hamster from 'hamsterjs';
import TweenMax from 'gsap';
import 'gsap/src/uncompressed/plugins/ScrollToPlugin';

class Smoothify {
  constructor(stepDuration = 1, stepSize = 100, wheelThrottle = 300) {
    this.stepDuration = stepDuration;
    this.stepSize = stepSize;
    this.wheelThrottle = wheelThrottle;
    this.y = window.scrollY;
    this.tween = null;
    this.deltaBuffer = [120, 120, 120];

    this.wheelHandlerFn = this.wheelHandler.bind(this);
    this.scrollHandlerFn = this.scrollHandler.bind(this);

    window.addEventListener('mousewheel', this.wheelHandlerFn);
    window.addEventListener('DOMMouseScroll', this.wheelHandlerFn);
    window.addEventListener('scroll', this.scrollHandlerFn);
  }

  _isDivisible(num, divisor) {
    return (Math.floor(num / divisor) === num / divisor);
  }

  _isTouchpad(deltaY) {
    if (!deltaY) {
      return false;
    }
    deltaY = Math.abs(deltaY);
    this.deltaBuffer.push(deltaY);
    this.deltaBuffer.shift();
    const allDivisable = (this._isDivisible(this.deltaBuffer[0], 120) &&
      this._isDivisible(this.deltaBuffer[1], 120) &&
      this._isDivisible(this.deltaBuffer[2], 120));
    return !allDivisable;
  }

  _getDocumentHeight() {
    const doc = document;
    return Math.max(
      doc.body.scrollHeight, doc.documentElement.scrollHeight,
      doc.body.offsetHeight, doc.documentElement.offsetHeight,
      doc.body.clientHeight, doc.documentElement.clientHeight
    );
  }

  scrollHandler() {
    if (!this.tween || !this.tween.isActive()) {
      this.y = window.scrollY;
    }
  }

  wheelHandler(event) {
    event = event.originalEvent || event;

    if (!event.originalEvent) {
      event.originalEvent = event;
    }

    if (event.deltaY === -0) {
      return;
    }

    const isTouchPad = this._isTouchpad(event.wheelDeltaY || event.wheelDelta || event.detail || 0);

    if (!isTouchPad) {
      event.preventDefault();

      const deltaY = Hamster.normalise.delta(event)[2] > 0 ? 1 : -1;

      this.scroll(deltaY);
    }
  }

  scroll(deltaY) {
    this.y -= deltaY * this.stepSize;

    const documentHeight = this._getDocumentHeight();

    this.y = this.y < 0 ? 0 : this.y;
    this.y = this.y > documentHeight - window.innerHeight ?
      documentHeight - window.innerHeight : this.y;

    const tweenProps = { scrollTo: { y: this.y } };

    if (this.tween && this.tween.isActive()) {
      this.tween.updateTo(tweenProps, true);
      return;
    }

    this.tween = TweenMax.to(window, this.stepDuration, tweenProps);
  }

  destroy() {
    window.removeEventListener('mousewheel', this.wheelHandlerFn);
    window.removeEventListener('DOMMouseScroll', this.wheelHandlerFn);
    window.removeEventListener('scroll', this.scrollHandlerFn);
  }
}

module.exports = Smoothify;
