(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

window.Smoothify = require('./src/smoothify').default;

},{"./src/smoothify":2}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PIXEL_STEP = 10;
var LINE_HEIGHT = 40;
var PAGE_HEIGHT = 800;

var DELTA_DIVISOR = 4;

var deltaBuffer = [DELTA_DIVISOR, DELTA_DIVISOR, DELTA_DIVISOR];

var Smoothify = function () {
  function Smoothify() {
    var stepDuration = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];
    var stepSize = arguments.length <= 1 || arguments[1] === undefined ? 100 : arguments[1];
    var wheelThrottle = arguments.length <= 2 || arguments[2] === undefined ? 300 : arguments[2];
    var easingMethod = arguments.length <= 3 || arguments[3] === undefined ? 'Power3.easeOut' : arguments[3];

    _classCallCheck(this, Smoothify);

    this.stepDuration = stepDuration;
    this.stepSize = stepSize;
    this.wheelThrottle = wheelThrottle;
    this.easingMethod = easingMethod;

    this.scrollY = window.scrollY;
    this.tween = null;
    this.enabled = true;

    this._wheelHandlerFn = this._wheelHandler.bind(this);
    this._scrollHandlerFn = this._scrollHandler.bind(this);

    window.addEventListener('mousewheel', this._wheelHandlerFn);
    window.addEventListener('DOMMouseScroll', this._wheelHandlerFn);
    window.addEventListener('scroll', this._scrollHandlerFn);
  }

  // https://github.com/galambalazs/smoothscroll-for-websites/blob/master/SmoothScroll.js


  _createClass(Smoothify, [{
    key: '_isTouchpad',
    value: function _isTouchpad(deltaY) {
      if (!deltaY) {
        return false;
      }
      function _isDivisible(num) {
        return Math.floor(num / DELTA_DIVISOR) === num / DELTA_DIVISOR;
      }
      deltaY = Math.abs(deltaY);
      deltaBuffer.push(deltaY);
      deltaBuffer.shift();
      var allDivisable = _isDivisible(deltaBuffer[0]) && _isDivisible(deltaBuffer[1]) && _isDivisible(deltaBuffer[2]);
      return !allDivisable;
    }

    // https://github.com/facebook/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js

  }, {
    key: '_normalizeWheel',
    value: function _normalizeWheel(event) {
      var sX = 0; // spinX
      var sY = 0; // spinY
      var pX = 0; // pixelX
      var pY = 0; // pixelX

      // Legacy
      if ('detail' in event) {
        sY = event.detail;
      }
      if ('wheelDelta' in event) {
        sY = -event.wheelDelta / 120;
      }
      if ('wheelDeltaY' in event) {
        sY = -event.wheelDeltaY / 120;
      }
      if ('wheelDeltaX' in event) {
        sX = -event.wheelDeltaX / 120;
      }

      // side scrolling on FF with DOMMouseScroll
      if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
        sX = sY;
        sY = 0;
      }

      pX = sX * PIXEL_STEP;
      pY = sY * PIXEL_STEP;

      if ('deltaY' in event) {
        pY = event.deltaY;
      }
      if ('deltaX' in event) {
        pX = event.deltaX;
      }

      if ((pX || pY) && event.deltaMode) {
        if (event.deltaMode === 1) {
          // delta in LINE units
          pX *= LINE_HEIGHT;
          pY *= LINE_HEIGHT;
        } else {
          // delta in PAGE units
          pX *= PAGE_HEIGHT;
          pY *= PAGE_HEIGHT;
        }
      }

      // Fall-back if spin cannot be determined
      if (pX && !sX) {
        sX = pX < 1 ? -1 : 1;
      }
      if (pY && !sY) {
        sY = pY < 1 ? -1 : 1;
      }

      return {
        spinX: sX,
        spinY: sY,
        pixelX: pX,
        pixelY: pY
      };
    }
  }, {
    key: '_getDocumentHeight',
    value: function _getDocumentHeight() {
      var doc = document;
      return Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, doc.body.offsetHeight, doc.documentElement.offsetHeight, doc.body.clientHeight, doc.documentElement.clientHeight);
    }
  }, {
    key: '_scrollHandler',
    value: function _scrollHandler() {
      if (!this.tween || !this.tween.isActive()) {
        this.scrollY = window.scrollY;
      }
    }
  }, {
    key: '_wheelHandler',
    value: function _wheelHandler(event) {
      event = event.originalEvent || event;

      if (event.deltaY === -0) {
        return;
      }

      var isTouchPad = this._isTouchpad(event.wheelDeltaY || event.wheelDelta || event.detail || 0);

      if (!isTouchPad || event.type === 'DOMMouseScroll') {
        event.preventDefault();

        var deltaY = Hamster.normalise.delta(event)[0] > 0 ? 1 : -1;

        this.scroll(deltaY);
      }
    }
  }, {
    key: 'enable',
    value: function enable() {
      this.enabled = true;
    }
  }, {
    key: 'disable',
    value: function disable() {
      if (this.tween && this.tween.isActive()) {
        this.tween.kill();
      }

      this.enabled = false;
    }
  }, {
    key: 'scroll',
    value: function scroll(deltaY) {
      if (!this.enabled) {
        return;
      }

      this.scrollY -= deltaY * this.stepSize;

      var documentHeight = this._getDocumentHeight();

      this.scrollY = this.scrollY < 0 ? 0 : this.scrollY;
      this.scrollY = this.scrollY > documentHeight - window.innerHeight ? documentHeight - window.innerHeight : this.scrollY;

      var tweenProps = {
        scrollTo: {
          y: this.scrollY
        },
        ease: this.easingMethod
      };

      if (this.tween && this.tween.isActive()) {
        this.tween.updateTo(tweenProps, true);
        return;
      }

      this.tween = TweenMax.to(window, this.stepDuration, tweenProps);
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      window.removeEventListener('mousewheel', this._wheelHandlerFn);
      window.removeEventListener('DOMMouseScroll', this._wheelHandlerFn);
      window.removeEventListener('scroll', this._scrollHandlerFn);
    }
  }]);

  return Smoothify;
}();

exports.default = Smoothify;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy5ub2RlL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNtb290aGlmeS5icm93c2VyaWZ5LmpzIiwic3JjL3Ntb290aGlmeS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsT0FBTyxTQUFQLEdBQW1CLFFBQVEsaUJBQVIsRUFBMkIsT0FBOUM7Ozs7Ozs7Ozs7Ozs7QUNBQSxJQUFNLGFBQWEsRUFBbkI7QUFDQSxJQUFNLGNBQWMsRUFBcEI7QUFDQSxJQUFNLGNBQWMsR0FBcEI7O0FBRUEsSUFBTSxnQkFBZ0IsQ0FBdEI7O0FBRUEsSUFBTSxjQUFjLENBQUMsYUFBRCxFQUFnQixhQUFoQixFQUErQixhQUEvQixDQUFwQjs7SUFFTSxTO0FBQ0osdUJBQW9HO0FBQUEsUUFBeEYsWUFBd0YseURBQXpFLENBQXlFO0FBQUEsUUFBdEUsUUFBc0UseURBQTNELEdBQTJEO0FBQUEsUUFBdEQsYUFBc0QseURBQXRDLEdBQXNDO0FBQUEsUUFBakMsWUFBaUMseURBQWxCLGdCQUFrQjs7QUFBQTs7QUFDbEcsU0FBSyxZQUFMLEdBQW9CLFlBQXBCO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsU0FBSyxhQUFMLEdBQXFCLGFBQXJCO0FBQ0EsU0FBSyxZQUFMLEdBQW9CLFlBQXBCOztBQUVBLFNBQUssT0FBTCxHQUFlLE9BQU8sT0FBdEI7QUFDQSxTQUFLLEtBQUwsR0FBYSxJQUFiO0FBQ0EsU0FBSyxPQUFMLEdBQWUsSUFBZjs7QUFFQSxTQUFLLGVBQUwsR0FBdUIsS0FBSyxhQUFMLENBQW1CLElBQW5CLENBQXdCLElBQXhCLENBQXZCO0FBQ0EsU0FBSyxnQkFBTCxHQUF3QixLQUFLLGNBQUwsQ0FBb0IsSUFBcEIsQ0FBeUIsSUFBekIsQ0FBeEI7O0FBRUEsV0FBTyxnQkFBUCxDQUF3QixZQUF4QixFQUFzQyxLQUFLLGVBQTNDO0FBQ0EsV0FBTyxn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T0FEN0M7O0FBR0EsVUFBTSxhQUFhO0FBQ2pCLGtCQUFVO0FBQ1IsYUFBRyxLQUFLO0FBREEsU0FETztBQUlqQixjQUFNLEtBQUs7QUFKTSxPQUFuQjs7QUFPQSxVQUFJLEtBQUssS0FBTCxJQUFjLEtBQUssS0FBTCxDQUFXLFFBQVgsRUFBbEIsRUFBeUM7QUFDdkMsYUFBSyxLQUFMLENBQVcsUUFBWCxDQUFvQixVQUFwQixFQUFnQyxJQUFoQztBQUNBO0FBQ0Q7O0FBRUQsV0FBSyxLQUFMLEdBQWEsU0FBUyxFQUFULENBQVksTUFBWixFQUFvQixLQUFLLFlBQXpCLEVBQXVDLFVBQXZDLENBQWI7QUFDRDs7OzhCQUVTO0FBQ1IsYUFBTyxtQkFBUCxDQUEyQixZQUEzQixFQUF5QyxLQUFLLGVBQTlDO0FBQ0EsYUFBTyxtQkFBUCxDQUEyQixnQkFBM0IsRUFBNkMsS0FBSyxlQUFsRDtBQUNBLGFBQU8sbUJBQVAsQ0FBMkIsUUFBM0IsRUFBcUMsS0FBSyxnQkFBMUM7QUFDRDs7Ozs7O2tCQUdZLFMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwid2luZG93LlNtb290aGlmeSA9IHJlcXVpcmUoJy4vc3JjL3Ntb290aGlmeScpLmRlZmF1bHQ7XG4iLCJjb25zdCBQSVhFTF9TVEVQID0gMTA7XG5jb25zdCBMSU5FX0hFSUdIVCA9IDQwO1xuY29uc3QgUEFHRV9IRUlHSFQgPSA4MDA7XG5cbmNvbnN0IERFTFRBX0RJVklTT1IgPSA0O1xuXG5jb25zdCBkZWx0YUJ1ZmZlciA9IFtERUxUQV9ESVZJU09SLCBERUxUQV9ESVZJU09SLCBERUxUQV9ESVZJU09SXTtcblxuY2xhc3MgU21vb3RoaWZ5IHtcbiAgY29uc3RydWN0b3Ioc3RlcER1cmF0aW9uID0gMSwgc3RlcFNpemUgPSAxMDAsIHdoZWVsVGhyb3R0bGUgPSAzMDAsIGVhc2luZ01ldGhvZCA9ICdQb3dlcjMuZWFzZU91dCcpIHtcbiAgICB0aGlzLnN0ZXBEdXJhdGlvbiA9IHN0ZXBEdXJhdGlvbjtcbiAgICB0aGlzLnN0ZXBTaXplID0gc3RlcFNpemU7XG4gICAgdGhpcy53aGVlbFRocm90dGxlID0gd2hlZWxUaHJvdHRsZTtcbiAgICB0aGlzLmVhc2luZ01ldGhvZCA9IGVhc2luZ01ldGhvZDtcblxuICAgIHRoaXMuc2Nyb2xsWSA9IHdpbmRvdy5zY3JvbGxZO1xuICAgIHRoaXMudHdlZW4gPSBudWxsO1xuICAgIHRoaXMuZW5hYmxlZCA9IHRydWU7XG5cbiAgICB0aGlzLl93aGVlbEhhbmRsZXJGbiA9IHRoaXMuX3doZWVsSGFuZGxlci5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3Njcm9sbEhhbmRsZXJGbiA9IHRoaXMuX3Njcm9sbEhhbmRsZXIuYmluZCh0aGlzKTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXdoZWVsJywgdGhpcy5fd2hlZWxIYW5kbGVyRm4pO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Nb3VzZVNjcm9sbCcsIHRoaXMuX3doZWVsSGFuZGxlckZuKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5fc2Nyb2xsSGFuZGxlckZuKTtcbiAgfVxuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nYWxhbWJhbGF6cy9zbW9vdGhzY3JvbGwtZm9yLXdlYnNpdGVzL2Jsb2IvbWFzdGVyL1Ntb290aFNjcm9sbC5qc1xuICBfaXNUb3VjaHBhZChkZWx0YVkpIHtcbiAgICBpZiAoIWRlbHRhWSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfaXNEaXZpc2libGUobnVtKSB7XG4gICAgICByZXR1cm4gKE1hdGguZmxvb3IobnVtIC8gREVMVEFfRElWSVNPUikgPT09IG51bSAvIERFTFRBX0RJVklTT1IpO1xuICAgIH1cbiAgICBkZWx0YVkgPSBNYXRoLmFicyhkZWx0YVkpO1xuICAgIGRlbHRhQnVmZmVyLnB1c2goZGVsdGFZKTtcbiAgICBkZWx0YUJ1ZmZlci5zaGlmdCgpO1xuICAgIGNvbnN0IGFsbERpdmlzYWJsZSA9IChfaXNEaXZpc2libGUoZGVsdGFCdWZmZXJbMF0pICYmXG4gICAgICBfaXNEaXZpc2libGUoZGVsdGFCdWZmZXJbMV0pICYmXG4gICAgICBfaXNEaXZpc2libGUoZGVsdGFCdWZmZXJbMl0pKTtcbiAgICByZXR1cm4gIWFsbERpdmlzYWJsZTtcbiAgfVxuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9maXhlZC1kYXRhLXRhYmxlL2Jsb2IvbWFzdGVyL3NyYy92ZW5kb3JfdXBzdHJlYW0vZG9tL25vcm1hbGl6ZVdoZWVsLmpzXG4gIF9ub3JtYWxpemVXaGVlbChldmVudCkge1xuICAgIGxldCBzWCA9IDA7IC8vIHNwaW5YXG4gICAgbGV0IHNZID0gMDsgLy8gc3BpbllcbiAgICBsZXQgcFggPSAwOyAvLyBwaXhlbFhcbiAgICBsZXQgcFkgPSAwOyAvLyBwaXhlbFhcblxuICAgIC8vIExlZ2FjeVxuICAgIGlmICgnZGV0YWlsJyBpbiBldmVudCkgeyBzWSA9IGV2ZW50LmRldGFpbDsgfVxuICAgIGlmICgnd2hlZWxEZWx0YScgaW4gZXZlbnQpIHsgc1kgPSAtZXZlbnQud2hlZWxEZWx0YSAvIDEyMDsgfVxuICAgIGlmICgnd2hlZWxEZWx0YVknIGluIGV2ZW50KSB7IHNZID0gLWV2ZW50LndoZWVsRGVsdGFZIC8gMTIwOyB9XG4gICAgaWYgKCd3aGVlbERlbHRhWCcgaW4gZXZlbnQpIHsgc1ggPSAtZXZlbnQud2hlZWxEZWx0YVggLyAxMjA7IH1cblxuICAgIC8vIHNpZGUgc2Nyb2xsaW5nIG9uIEZGIHdpdGggRE9NTW91c2VTY3JvbGxcbiAgICBpZiAoJ2F4aXMnIGluIGV2ZW50ICYmIGV2ZW50LmF4aXMgPT09IGV2ZW50LkhPUklaT05UQUxfQVhJUykge1xuICAgICAgc1ggPSBzWTtcbiAgICAgIHNZID0gMDtcbiAgICB9XG5cbiAgICBwWCA9IHNYICogUElYRUxfU1RFUDtcbiAgICBwWSA9IHNZICogUElYRUxfU1RFUDtcblxuICAgIGlmICgnZGVsdGFZJyBpbiBldmVudCkgeyBwWSA9IGV2ZW50LmRlbHRhWTsgfVxuICAgIGlmICgnZGVsdGFYJyBpbiBldmVudCkgeyBwWCA9IGV2ZW50LmRlbHRhWDsgfVxuXG4gICAgaWYgKChwWCB8fCBwWSkgJiYgZXZlbnQuZGVsdGFNb2RlKSB7XG4gICAgICBpZiAoZXZlbnQuZGVsdGFNb2RlID09PSAxKSB7IC8vIGRlbHRhIGluIExJTkUgdW5pdHNcbiAgICAgICAgcFggKj0gTElORV9IRUlHSFQ7XG4gICAgICAgIHBZICo9IExJTkVfSEVJR0hUO1xuICAgICAgfSBlbHNlIHsgLy8gZGVsdGEgaW4gUEFHRSB1bml0c1xuICAgICAgICBwWCAqPSBQQUdFX0hFSUdIVDtcbiAgICAgICAgcFkgKj0gUEFHRV9IRUlHSFQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRmFsbC1iYWNrIGlmIHNwaW4gY2Fubm90IGJlIGRldGVybWluZWRcbiAgICBpZiAocFggJiYgIXNYKSB7IHNYID0gKHBYIDwgMSkgPyAtMSA6IDE7IH1cbiAgICBpZiAocFkgJiYgIXNZKSB7IHNZID0gKHBZIDwgMSkgPyAtMSA6IDE7IH1cblxuICAgIHJldHVybiB7XG4gICAgICBzcGluWDogc1gsXG4gICAgICBzcGluWTogc1ksXG4gICAgICBwaXhlbFg6IHBYLFxuICAgICAgcGl4ZWxZOiBwWSxcbiAgICB9O1xuICB9XG5cbiAgX2dldERvY3VtZW50SGVpZ2h0KCkge1xuICAgIGNvbnN0IGRvYyA9IGRvY3VtZW50O1xuICAgIHJldHVybiBNYXRoLm1heChcbiAgICAgIGRvYy5ib2R5LnNjcm9sbEhlaWdodCwgZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQsXG4gICAgICBkb2MuYm9keS5vZmZzZXRIZWlnaHQsIGRvYy5kb2N1bWVudEVsZW1lbnQub2Zmc2V0SGVpZ2h0LFxuICAgICAgZG9jLmJvZHkuY2xpZW50SGVpZ2h0LCBkb2MuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodFxuICAgICk7XG4gIH1cblxuICBfc2Nyb2xsSGFuZGxlcigpIHtcbiAgICBpZiAoIXRoaXMudHdlZW4gfHwgIXRoaXMudHdlZW4uaXNBY3RpdmUoKSkge1xuICAgICAgdGhpcy5zY3JvbGxZID0gd2luZG93LnNjcm9sbFk7XG4gICAgfVxuICB9XG5cbiAgX3doZWVsSGFuZGxlcihldmVudCkge1xuICAgIGV2ZW50ID0gZXZlbnQub3JpZ2luYWxFdmVudCB8fCBldmVudDtcblxuICAgIGlmIChldmVudC5kZWx0YVkgPT09IC0wKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNUb3VjaFBhZCA9IHRoaXMuX2lzVG91Y2hwYWQoZXZlbnQud2hlZWxEZWx0YVkgfHwgZXZlbnQud2hlZWxEZWx0YSB8fCBldmVudC5kZXRhaWwgfHwgMCk7XG5cbiAgICBpZiAoIWlzVG91Y2hQYWQgfHwgZXZlbnQudHlwZSA9PT0gJ0RPTU1vdXNlU2Nyb2xsJykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgY29uc3QgZGVsdGFZID0gSGFtc3Rlci5ub3JtYWxpc2UuZGVsdGEoZXZlbnQpWzBdID4gMCA/IDEgOiAtMTtcblxuICAgICAgdGhpcy5zY3JvbGwoZGVsdGFZKTtcbiAgICB9XG4gIH1cblxuICBlbmFibGUoKSB7XG4gICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcbiAgfVxuXG4gIGRpc2FibGUoKSB7XG4gICAgaWYgKHRoaXMudHdlZW4gJiYgdGhpcy50d2Vlbi5pc0FjdGl2ZSgpKSB7XG4gICAgICB0aGlzLnR3ZWVuLmtpbGwoKTtcbiAgICB9XG5cbiAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgfVxuXG4gIHNjcm9sbChkZWx0YVkpIHtcbiAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2Nyb2xsWSAtPSBkZWx0YVkgKiB0aGlzLnN0ZXBTaXplO1xuXG4gICAgY29uc3QgZG9jdW1lbnRIZWlnaHQgPSB0aGlzLl9nZXREb2N1bWVudEhlaWdodCgpO1xuXG4gICAgdGhpcy5zY3JvbGxZID0gdGhpcy5zY3JvbGxZIDwgMCA/IDAgOiB0aGlzLnNjcm9sbFk7XG4gICAgdGhpcy5zY3JvbGxZID0gdGhpcy5zY3JvbGxZID4gZG9jdW1lbnRIZWlnaHQgLSB3aW5kb3cuaW5uZXJIZWlnaHQgP1xuICAgICAgZG9jdW1lbnRIZWlnaHQgLSB3aW5kb3cuaW5uZXJIZWlnaHQgOiB0aGlzLnNjcm9sbFk7XG5cbiAgICBjb25zdCB0d2VlblByb3BzID0ge1xuICAgICAgc2Nyb2xsVG86IHtcbiAgICAgICAgeTogdGhpcy5zY3JvbGxZLFxuICAgICAgfSxcbiAgICAgIGVhc2U6IHRoaXMuZWFzaW5nTWV0aG9kLFxuICAgIH07XG5cbiAgICBpZiAodGhpcy50d2VlbiAmJiB0aGlzLnR3ZWVuLmlzQWN0aXZlKCkpIHtcbiAgICAgIHRoaXMudHdlZW4udXBkYXRlVG8odHdlZW5Qcm9wcywgdHJ1ZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy50d2VlbiA9IFR3ZWVuTWF4LnRvKHdpbmRvdywgdGhpcy5zdGVwRHVyYXRpb24sIHR3ZWVuUHJvcHMpO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIHRoaXMuX3doZWVsSGFuZGxlckZuKTtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignRE9NTW91c2VTY3JvbGwnLCB0aGlzLl93aGVlbEhhbmRsZXJGbik7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMuX3Njcm9sbEhhbmRsZXJGbik7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU21vb3RoaWZ5O1xuIl19
