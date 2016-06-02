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

    _classCallCheck(this, Smoothify);

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
    key: 'scroll',
    value: function scroll(deltaY) {
      this.scrollY -= deltaY * this.stepSize;

      var documentHeight = this._getDocumentHeight();

      this.scrollY = this.scrollY < 0 ? 0 : this.scrollY;
      this.scrollY = this.scrollY > documentHeight - window.innerHeight ? documentHeight - window.innerHeight : this.scrollY;

      var tweenProps = { scrollTo: { y: this.scrollY } };

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy5ub2RlL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNtb290aGlmeS5icm93c2VyaWZ5LmpzIiwic3JjL3Ntb290aGlmeS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsT0FBTyxTQUFQLEdBQW1CLFFBQVEsaUJBQVIsRUFBMkIsT0FBOUM7Ozs7Ozs7Ozs7Ozs7QUNBQSxJQUFNLGFBQWEsRUFBbkI7QUFDQSxJQUFNLGNBQWMsRUFBcEI7QUFDQSxJQUFNLGNBQWMsR0FBcEI7O0FBRUEsSUFBTSxnQkFBZ0IsQ0FBdEI7O0FBRUEsSUFBTSxjQUFjLENBQUMsYUFBRCxFQUFnQixhQUFoQixFQUErQixhQUEvQixDQUFwQjs7SUFFTSxTO0FBQ0osdUJBQW1FO0FBQUEsUUFBdkQsWUFBdUQseURBQXhDLENBQXdDO0FBQUEsUUFBckMsUUFBcUMseURBQTFCLEdBQTBCO0FBQUEsUUFBckIsYUFBcUIseURBQUwsR0FBSzs7QUFBQTs7QUFDakUsU0FBSyxZQUFMLEdBQW9CLFlBQXBCO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsU0FBSyxhQUFMLEdBQXFCLGFBQXJCOztBQUVBLFNBQUssT0FBTCxHQUFlLE9BQU8sT0FBdEI7QUFDQSxTQUFLLEtBQUwsR0FBYSxJQUFiOztBQUVBLFNBQUssZUFBTCxHQUF1QixLQUFLLGFBQUwsQ0FBbUIsSUFBbkIsQ0FBd0IsSUFBeEIsQ0FBdkI7QUFDQSxTQUFLLGdCQUFMLEdBQXdCLEtBQUssY0FBTCxDQUFvQixJQUFwQixDQUF5QixJQUF6QixDQUF4Qjs7QUFFQSxXQUFPLGdCQUFQLENBQXdCLFlBQXhCLEVBQXNDLEtBQUssZUFBM0M7QUFDQSxXQUFPLGdCQUFQLENBQXdCLGdCQUF4QixFQUEwQyxLQUFLLGVBQS9DO0FBQ0EsV0FBTyxnQkFBUCxDQUF3QixRQUF4QixFQUFrQyxLQUFLLGdCQUF2QztBQUNE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QTNCLEVBQXlDLEtBQUssZUFBOUM7QUFDQSxhQUFPLG1CQUFQLENBQTJCLGdCQUEzQixFQUE2QyxLQUFLLGVBQWxEO0FBQ0EsYUFBTyxtQkFBUCxDQUEyQixRQUEzQixFQUFxQyxLQUFLLGdCQUExQztBQUNEOzs7Ozs7a0JBR1ksUyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ3aW5kb3cuU21vb3RoaWZ5ID0gcmVxdWlyZSgnLi9zcmMvc21vb3RoaWZ5JykuZGVmYXVsdDtcbiIsImNvbnN0IFBJWEVMX1NURVAgPSAxMDtcbmNvbnN0IExJTkVfSEVJR0hUID0gNDA7XG5jb25zdCBQQUdFX0hFSUdIVCA9IDgwMDtcblxuY29uc3QgREVMVEFfRElWSVNPUiA9IDQ7XG5cbmNvbnN0IGRlbHRhQnVmZmVyID0gW0RFTFRBX0RJVklTT1IsIERFTFRBX0RJVklTT1IsIERFTFRBX0RJVklTT1JdO1xuXG5jbGFzcyBTbW9vdGhpZnkge1xuICBjb25zdHJ1Y3RvcihzdGVwRHVyYXRpb24gPSAxLCBzdGVwU2l6ZSA9IDEwMCwgd2hlZWxUaHJvdHRsZSA9IDMwMCkge1xuICAgIHRoaXMuc3RlcER1cmF0aW9uID0gc3RlcER1cmF0aW9uO1xuICAgIHRoaXMuc3RlcFNpemUgPSBzdGVwU2l6ZTtcbiAgICB0aGlzLndoZWVsVGhyb3R0bGUgPSB3aGVlbFRocm90dGxlO1xuXG4gICAgdGhpcy5zY3JvbGxZID0gd2luZG93LnNjcm9sbFk7XG4gICAgdGhpcy50d2VlbiA9IG51bGw7XG5cbiAgICB0aGlzLl93aGVlbEhhbmRsZXJGbiA9IHRoaXMuX3doZWVsSGFuZGxlci5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3Njcm9sbEhhbmRsZXJGbiA9IHRoaXMuX3Njcm9sbEhhbmRsZXIuYmluZCh0aGlzKTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXdoZWVsJywgdGhpcy5fd2hlZWxIYW5kbGVyRm4pO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Nb3VzZVNjcm9sbCcsIHRoaXMuX3doZWVsSGFuZGxlckZuKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5fc2Nyb2xsSGFuZGxlckZuKTtcbiAgfVxuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nYWxhbWJhbGF6cy9zbW9vdGhzY3JvbGwtZm9yLXdlYnNpdGVzL2Jsb2IvbWFzdGVyL1Ntb290aFNjcm9sbC5qc1xuICBfaXNUb3VjaHBhZChkZWx0YVkpIHtcbiAgICBpZiAoIWRlbHRhWSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfaXNEaXZpc2libGUobnVtKSB7XG4gICAgICByZXR1cm4gKE1hdGguZmxvb3IobnVtIC8gREVMVEFfRElWSVNPUikgPT09IG51bSAvIERFTFRBX0RJVklTT1IpO1xuICAgIH1cbiAgICBkZWx0YVkgPSBNYXRoLmFicyhkZWx0YVkpO1xuICAgIGRlbHRhQnVmZmVyLnB1c2goZGVsdGFZKTtcbiAgICBkZWx0YUJ1ZmZlci5zaGlmdCgpO1xuICAgIGNvbnN0IGFsbERpdmlzYWJsZSA9IChfaXNEaXZpc2libGUoZGVsdGFCdWZmZXJbMF0pICYmXG4gICAgICBfaXNEaXZpc2libGUoZGVsdGFCdWZmZXJbMV0pICYmXG4gICAgICBfaXNEaXZpc2libGUoZGVsdGFCdWZmZXJbMl0pKTtcbiAgICByZXR1cm4gIWFsbERpdmlzYWJsZTtcbiAgfVxuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9maXhlZC1kYXRhLXRhYmxlL2Jsb2IvbWFzdGVyL3NyYy92ZW5kb3JfdXBzdHJlYW0vZG9tL25vcm1hbGl6ZVdoZWVsLmpzXG4gIF9ub3JtYWxpemVXaGVlbChldmVudCkge1xuICAgIGxldCBzWCA9IDA7IC8vIHNwaW5YXG4gICAgbGV0IHNZID0gMDsgLy8gc3BpbllcbiAgICBsZXQgcFggPSAwOyAvLyBwaXhlbFhcbiAgICBsZXQgcFkgPSAwOyAvLyBwaXhlbFhcblxuICAgIC8vIExlZ2FjeVxuICAgIGlmICgnZGV0YWlsJyBpbiBldmVudCkgeyBzWSA9IGV2ZW50LmRldGFpbDsgfVxuICAgIGlmICgnd2hlZWxEZWx0YScgaW4gZXZlbnQpIHsgc1kgPSAtZXZlbnQud2hlZWxEZWx0YSAvIDEyMDsgfVxuICAgIGlmICgnd2hlZWxEZWx0YVknIGluIGV2ZW50KSB7IHNZID0gLWV2ZW50LndoZWVsRGVsdGFZIC8gMTIwOyB9XG4gICAgaWYgKCd3aGVlbERlbHRhWCcgaW4gZXZlbnQpIHsgc1ggPSAtZXZlbnQud2hlZWxEZWx0YVggLyAxMjA7IH1cblxuICAgIC8vIHNpZGUgc2Nyb2xsaW5nIG9uIEZGIHdpdGggRE9NTW91c2VTY3JvbGxcbiAgICBpZiAoJ2F4aXMnIGluIGV2ZW50ICYmIGV2ZW50LmF4aXMgPT09IGV2ZW50LkhPUklaT05UQUxfQVhJUykge1xuICAgICAgc1ggPSBzWTtcbiAgICAgIHNZID0gMDtcbiAgICB9XG5cbiAgICBwWCA9IHNYICogUElYRUxfU1RFUDtcbiAgICBwWSA9IHNZICogUElYRUxfU1RFUDtcblxuICAgIGlmICgnZGVsdGFZJyBpbiBldmVudCkgeyBwWSA9IGV2ZW50LmRlbHRhWTsgfVxuICAgIGlmICgnZGVsdGFYJyBpbiBldmVudCkgeyBwWCA9IGV2ZW50LmRlbHRhWDsgfVxuXG4gICAgaWYgKChwWCB8fCBwWSkgJiYgZXZlbnQuZGVsdGFNb2RlKSB7XG4gICAgICBpZiAoZXZlbnQuZGVsdGFNb2RlID09PSAxKSB7IC8vIGRlbHRhIGluIExJTkUgdW5pdHNcbiAgICAgICAgcFggKj0gTElORV9IRUlHSFQ7XG4gICAgICAgIHBZICo9IExJTkVfSEVJR0hUO1xuICAgICAgfSBlbHNlIHsgLy8gZGVsdGEgaW4gUEFHRSB1bml0c1xuICAgICAgICBwWCAqPSBQQUdFX0hFSUdIVDtcbiAgICAgICAgcFkgKj0gUEFHRV9IRUlHSFQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRmFsbC1iYWNrIGlmIHNwaW4gY2Fubm90IGJlIGRldGVybWluZWRcbiAgICBpZiAocFggJiYgIXNYKSB7IHNYID0gKHBYIDwgMSkgPyAtMSA6IDE7IH1cbiAgICBpZiAocFkgJiYgIXNZKSB7IHNZID0gKHBZIDwgMSkgPyAtMSA6IDE7IH1cblxuICAgIHJldHVybiB7XG4gICAgICBzcGluWDogc1gsXG4gICAgICBzcGluWTogc1ksXG4gICAgICBwaXhlbFg6IHBYLFxuICAgICAgcGl4ZWxZOiBwWSxcbiAgICB9O1xuICB9XG5cbiAgX2dldERvY3VtZW50SGVpZ2h0KCkge1xuICAgIGNvbnN0IGRvYyA9IGRvY3VtZW50O1xuICAgIHJldHVybiBNYXRoLm1heChcbiAgICAgIGRvYy5ib2R5LnNjcm9sbEhlaWdodCwgZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQsXG4gICAgICBkb2MuYm9keS5vZmZzZXRIZWlnaHQsIGRvYy5kb2N1bWVudEVsZW1lbnQub2Zmc2V0SGVpZ2h0LFxuICAgICAgZG9jLmJvZHkuY2xpZW50SGVpZ2h0LCBkb2MuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodFxuICAgICk7XG4gIH1cblxuICBfc2Nyb2xsSGFuZGxlcigpIHtcbiAgICBpZiAoIXRoaXMudHdlZW4gfHwgIXRoaXMudHdlZW4uaXNBY3RpdmUoKSkge1xuICAgICAgdGhpcy5zY3JvbGxZID0gd2luZG93LnNjcm9sbFk7XG4gICAgfVxuICB9XG5cbiAgX3doZWVsSGFuZGxlcihldmVudCkge1xuICAgIGV2ZW50ID0gZXZlbnQub3JpZ2luYWxFdmVudCB8fCBldmVudDtcblxuICAgIGlmIChldmVudC5kZWx0YVkgPT09IC0wKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNUb3VjaFBhZCA9IHRoaXMuX2lzVG91Y2hwYWQoZXZlbnQud2hlZWxEZWx0YVkgfHwgZXZlbnQud2hlZWxEZWx0YSB8fCBldmVudC5kZXRhaWwgfHwgMCk7XG5cbiAgICBpZiAoIWlzVG91Y2hQYWQgfHwgZXZlbnQudHlwZSA9PT0gJ0RPTU1vdXNlU2Nyb2xsJykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgY29uc3QgZGVsdGFZID0gSGFtc3Rlci5ub3JtYWxpc2UuZGVsdGEoZXZlbnQpWzBdID4gMCA/IDEgOiAtMTtcblxuICAgICAgdGhpcy5zY3JvbGwoZGVsdGFZKTtcbiAgICB9XG4gIH1cblxuICBzY3JvbGwoZGVsdGFZKSB7XG4gICAgdGhpcy5zY3JvbGxZIC09IGRlbHRhWSAqIHRoaXMuc3RlcFNpemU7XG5cbiAgICBjb25zdCBkb2N1bWVudEhlaWdodCA9IHRoaXMuX2dldERvY3VtZW50SGVpZ2h0KCk7XG5cbiAgICB0aGlzLnNjcm9sbFkgPSB0aGlzLnNjcm9sbFkgPCAwID8gMCA6IHRoaXMuc2Nyb2xsWTtcbiAgICB0aGlzLnNjcm9sbFkgPSB0aGlzLnNjcm9sbFkgPiBkb2N1bWVudEhlaWdodCAtIHdpbmRvdy5pbm5lckhlaWdodCA/XG4gICAgICBkb2N1bWVudEhlaWdodCAtIHdpbmRvdy5pbm5lckhlaWdodCA6IHRoaXMuc2Nyb2xsWTtcblxuICAgIGNvbnN0IHR3ZWVuUHJvcHMgPSB7IHNjcm9sbFRvOiB7IHk6IHRoaXMuc2Nyb2xsWSB9IH07XG5cbiAgICBpZiAodGhpcy50d2VlbiAmJiB0aGlzLnR3ZWVuLmlzQWN0aXZlKCkpIHtcbiAgICAgIHRoaXMudHdlZW4udXBkYXRlVG8odHdlZW5Qcm9wcywgdHJ1ZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy50d2VlbiA9IFR3ZWVuTWF4LnRvKHdpbmRvdywgdGhpcy5zdGVwRHVyYXRpb24sIHR3ZWVuUHJvcHMpO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIHRoaXMuX3doZWVsSGFuZGxlckZuKTtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignRE9NTW91c2VTY3JvbGwnLCB0aGlzLl93aGVlbEhhbmRsZXJGbik7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMuX3Njcm9sbEhhbmRsZXJGbik7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU21vb3RoaWZ5O1xuIl19
