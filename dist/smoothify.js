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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy5ub2RlL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNtb290aGlmeS5icm93c2VyaWZ5LmpzIiwic3JjL3Ntb290aGlmeS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsT0FBTyxTQUFQLEdBQW1CLFFBQVEsaUJBQVIsRUFBMkIsT0FBOUM7Ozs7Ozs7Ozs7Ozs7QUNBQSxJQUFNLGFBQWEsRUFBbkI7QUFDQSxJQUFNLGNBQWMsRUFBcEI7QUFDQSxJQUFNLGNBQWMsR0FBcEI7O0FBRUEsSUFBTSxnQkFBZ0IsQ0FBdEI7O0FBRUEsSUFBTSxjQUFjLENBQUMsYUFBRCxFQUFnQixhQUFoQixFQUErQixhQUEvQixDQUFwQjs7SUFFTSxTO0FBQ0osdUJBQW1FO0FBQUEsUUFBdkQsWUFBdUQseURBQXhDLENBQXdDO0FBQUEsUUFBckMsUUFBcUMseURBQTFCLEdBQTBCO0FBQUEsUUFBckIsYUFBcUIseURBQUwsR0FBSzs7QUFBQTs7QUFDakUsU0FBSyxZQUFMLEdBQW9CLFlBQXBCO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsU0FBSyxhQUFMLEdBQXFCLGFBQXJCOztBQUVBLFNBQUssT0FBTCxHQUFlLE9BQU8sT0FBdEI7QUFDQSxTQUFLLEtBQUwsR0FBYSxJQUFiO0FBQ0EsU0FBSyxPQUFMLEdBQWUsSUFBZjs7QUFFQSxTQUFLLGVBQUwsR0FBdUIsS0FBSyxhQUFMLENBQW1CLElBQW5CLENBQXdCLElBQXhCLENBQXZCO0FBQ0EsU0FBSyxnQkFBTCxHQUF3QixLQUFLLGNBQUwsQ0FBb0IsSUFBcEIsQ0FBeUIsSUFBekIsQ0FBeEI7O0FBRUEsV0FBTyxnQkFBUCxDQUF3QixZQUF4QixFQUFzQyxLQUFLLGVBQTNDO0FBQ0EsV0FBTyxnQkFBUCxDQUF3QixnQkFBeEIsRUFBMEMsS0FBSyxlQUEvQztBQUNBLFdBQU8sZ0JBQVAsQ0FBd0IsUUFB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bkI7O0FBRUEsVUFBSSxLQUFLLEtBQUwsSUFBYyxLQUFLLEtBQUwsQ0FBVyxRQUFYLEVBQWxCLEVBQXlDO0FBQ3ZDLGFBQUssS0FBTCxDQUFXLFFBQVgsQ0FBb0IsVUFBcEIsRUFBZ0MsSUFBaEM7QUFDQTtBQUNEOztBQUVELFdBQUssS0FBTCxHQUFhLFNBQVMsRUFBVCxDQUFZLE1BQVosRUFBb0IsS0FBSyxZQUF6QixFQUF1QyxVQUF2QyxDQUFiO0FBQ0Q7Ozs4QkFFUztBQUNSLGFBQU8sbUJBQVAsQ0FBMkIsWUFBM0IsRUFBeUMsS0FBSyxlQUE5QztBQUNBLGFBQU8sbUJBQVAsQ0FBMkIsZ0JBQTNCLEVBQTZDLEtBQUssZUFBbEQ7QUFDQSxhQUFPLG1CQUFQLENBQTJCLFFBQTNCLEVBQXFDLEtBQUssZ0JBQTFDO0FBQ0Q7Ozs7OztrQkFHWSxTIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIndpbmRvdy5TbW9vdGhpZnkgPSByZXF1aXJlKCcuL3NyYy9zbW9vdGhpZnknKS5kZWZhdWx0O1xuIiwiY29uc3QgUElYRUxfU1RFUCA9IDEwO1xuY29uc3QgTElORV9IRUlHSFQgPSA0MDtcbmNvbnN0IFBBR0VfSEVJR0hUID0gODAwO1xuXG5jb25zdCBERUxUQV9ESVZJU09SID0gNDtcblxuY29uc3QgZGVsdGFCdWZmZXIgPSBbREVMVEFfRElWSVNPUiwgREVMVEFfRElWSVNPUiwgREVMVEFfRElWSVNPUl07XG5cbmNsYXNzIFNtb290aGlmeSB7XG4gIGNvbnN0cnVjdG9yKHN0ZXBEdXJhdGlvbiA9IDEsIHN0ZXBTaXplID0gMTAwLCB3aGVlbFRocm90dGxlID0gMzAwKSB7XG4gICAgdGhpcy5zdGVwRHVyYXRpb24gPSBzdGVwRHVyYXRpb247XG4gICAgdGhpcy5zdGVwU2l6ZSA9IHN0ZXBTaXplO1xuICAgIHRoaXMud2hlZWxUaHJvdHRsZSA9IHdoZWVsVGhyb3R0bGU7XG5cbiAgICB0aGlzLnNjcm9sbFkgPSB3aW5kb3cuc2Nyb2xsWTtcbiAgICB0aGlzLnR3ZWVuID0gbnVsbDtcbiAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuXG4gICAgdGhpcy5fd2hlZWxIYW5kbGVyRm4gPSB0aGlzLl93aGVlbEhhbmRsZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLl9zY3JvbGxIYW5kbGVyRm4gPSB0aGlzLl9zY3JvbGxIYW5kbGVyLmJpbmQodGhpcyk7XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIHRoaXMuX3doZWVsSGFuZGxlckZuKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NTW91c2VTY3JvbGwnLCB0aGlzLl93aGVlbEhhbmRsZXJGbik7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMuX3Njcm9sbEhhbmRsZXJGbik7XG4gIH1cblxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZ2FsYW1iYWxhenMvc21vb3Roc2Nyb2xsLWZvci13ZWJzaXRlcy9ibG9iL21hc3Rlci9TbW9vdGhTY3JvbGwuanNcbiAgX2lzVG91Y2hwYWQoZGVsdGFZKSB7XG4gICAgaWYgKCFkZWx0YVkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gX2lzRGl2aXNpYmxlKG51bSkge1xuICAgICAgcmV0dXJuIChNYXRoLmZsb29yKG51bSAvIERFTFRBX0RJVklTT1IpID09PSBudW0gLyBERUxUQV9ESVZJU09SKTtcbiAgICB9XG4gICAgZGVsdGFZID0gTWF0aC5hYnMoZGVsdGFZKTtcbiAgICBkZWx0YUJ1ZmZlci5wdXNoKGRlbHRhWSk7XG4gICAgZGVsdGFCdWZmZXIuc2hpZnQoKTtcbiAgICBjb25zdCBhbGxEaXZpc2FibGUgPSAoX2lzRGl2aXNpYmxlKGRlbHRhQnVmZmVyWzBdKSAmJlxuICAgICAgX2lzRGl2aXNpYmxlKGRlbHRhQnVmZmVyWzFdKSAmJlxuICAgICAgX2lzRGl2aXNpYmxlKGRlbHRhQnVmZmVyWzJdKSk7XG4gICAgcmV0dXJuICFhbGxEaXZpc2FibGU7XG4gIH1cblxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svZml4ZWQtZGF0YS10YWJsZS9ibG9iL21hc3Rlci9zcmMvdmVuZG9yX3Vwc3RyZWFtL2RvbS9ub3JtYWxpemVXaGVlbC5qc1xuICBfbm9ybWFsaXplV2hlZWwoZXZlbnQpIHtcbiAgICBsZXQgc1ggPSAwOyAvLyBzcGluWFxuICAgIGxldCBzWSA9IDA7IC8vIHNwaW5ZXG4gICAgbGV0IHBYID0gMDsgLy8gcGl4ZWxYXG4gICAgbGV0IHBZID0gMDsgLy8gcGl4ZWxYXG5cbiAgICAvLyBMZWdhY3lcbiAgICBpZiAoJ2RldGFpbCcgaW4gZXZlbnQpIHsgc1kgPSBldmVudC5kZXRhaWw7IH1cbiAgICBpZiAoJ3doZWVsRGVsdGEnIGluIGV2ZW50KSB7IHNZID0gLWV2ZW50LndoZWVsRGVsdGEgLyAxMjA7IH1cbiAgICBpZiAoJ3doZWVsRGVsdGFZJyBpbiBldmVudCkgeyBzWSA9IC1ldmVudC53aGVlbERlbHRhWSAvIDEyMDsgfVxuICAgIGlmICgnd2hlZWxEZWx0YVgnIGluIGV2ZW50KSB7IHNYID0gLWV2ZW50LndoZWVsRGVsdGFYIC8gMTIwOyB9XG5cbiAgICAvLyBzaWRlIHNjcm9sbGluZyBvbiBGRiB3aXRoIERPTU1vdXNlU2Nyb2xsXG4gICAgaWYgKCdheGlzJyBpbiBldmVudCAmJiBldmVudC5heGlzID09PSBldmVudC5IT1JJWk9OVEFMX0FYSVMpIHtcbiAgICAgIHNYID0gc1k7XG4gICAgICBzWSA9IDA7XG4gICAgfVxuXG4gICAgcFggPSBzWCAqIFBJWEVMX1NURVA7XG4gICAgcFkgPSBzWSAqIFBJWEVMX1NURVA7XG5cbiAgICBpZiAoJ2RlbHRhWScgaW4gZXZlbnQpIHsgcFkgPSBldmVudC5kZWx0YVk7IH1cbiAgICBpZiAoJ2RlbHRhWCcgaW4gZXZlbnQpIHsgcFggPSBldmVudC5kZWx0YVg7IH1cblxuICAgIGlmICgocFggfHwgcFkpICYmIGV2ZW50LmRlbHRhTW9kZSkge1xuICAgICAgaWYgKGV2ZW50LmRlbHRhTW9kZSA9PT0gMSkgeyAvLyBkZWx0YSBpbiBMSU5FIHVuaXRzXG4gICAgICAgIHBYICo9IExJTkVfSEVJR0hUO1xuICAgICAgICBwWSAqPSBMSU5FX0hFSUdIVDtcbiAgICAgIH0gZWxzZSB7IC8vIGRlbHRhIGluIFBBR0UgdW5pdHNcbiAgICAgICAgcFggKj0gUEFHRV9IRUlHSFQ7XG4gICAgICAgIHBZICo9IFBBR0VfSEVJR0hUO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZhbGwtYmFjayBpZiBzcGluIGNhbm5vdCBiZSBkZXRlcm1pbmVkXG4gICAgaWYgKHBYICYmICFzWCkgeyBzWCA9IChwWCA8IDEpID8gLTEgOiAxOyB9XG4gICAgaWYgKHBZICYmICFzWSkgeyBzWSA9IChwWSA8IDEpID8gLTEgOiAxOyB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3Bpblg6IHNYLFxuICAgICAgc3Bpblk6IHNZLFxuICAgICAgcGl4ZWxYOiBwWCxcbiAgICAgIHBpeGVsWTogcFksXG4gICAgfTtcbiAgfVxuXG4gIF9nZXREb2N1bWVudEhlaWdodCgpIHtcbiAgICBjb25zdCBkb2MgPSBkb2N1bWVudDtcbiAgICByZXR1cm4gTWF0aC5tYXgoXG4gICAgICBkb2MuYm9keS5zY3JvbGxIZWlnaHQsIGRvYy5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0LFxuICAgICAgZG9jLmJvZHkub2Zmc2V0SGVpZ2h0LCBkb2MuZG9jdW1lbnRFbGVtZW50Lm9mZnNldEhlaWdodCxcbiAgICAgIGRvYy5ib2R5LmNsaWVudEhlaWdodCwgZG9jLmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHRcbiAgICApO1xuICB9XG5cbiAgX3Njcm9sbEhhbmRsZXIoKSB7XG4gICAgaWYgKCF0aGlzLnR3ZWVuIHx8ICF0aGlzLnR3ZWVuLmlzQWN0aXZlKCkpIHtcbiAgICAgIHRoaXMuc2Nyb2xsWSA9IHdpbmRvdy5zY3JvbGxZO1xuICAgIH1cbiAgfVxuXG4gIF93aGVlbEhhbmRsZXIoZXZlbnQpIHtcbiAgICBldmVudCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQgfHwgZXZlbnQ7XG5cbiAgICBpZiAoZXZlbnQuZGVsdGFZID09PSAtMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGlzVG91Y2hQYWQgPSB0aGlzLl9pc1RvdWNocGFkKGV2ZW50LndoZWVsRGVsdGFZIHx8IGV2ZW50LndoZWVsRGVsdGEgfHwgZXZlbnQuZGV0YWlsIHx8IDApO1xuXG4gICAgaWYgKCFpc1RvdWNoUGFkIHx8IGV2ZW50LnR5cGUgPT09ICdET01Nb3VzZVNjcm9sbCcpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGNvbnN0IGRlbHRhWSA9IEhhbXN0ZXIubm9ybWFsaXNlLmRlbHRhKGV2ZW50KVswXSA+IDAgPyAxIDogLTE7XG5cbiAgICAgIHRoaXMuc2Nyb2xsKGRlbHRhWSk7XG4gICAgfVxuICB9XG5cbiAgZW5hYmxlKCkge1xuICAgIHRoaXMuZW5hYmxlZCA9IHRydWU7XG4gIH1cblxuICBkaXNhYmxlKCkge1xuICAgIGlmICh0aGlzLnR3ZWVuICYmIHRoaXMudHdlZW4uaXNBY3RpdmUoKSkge1xuICAgICAgdGhpcy50d2Vlbi5raWxsKCk7XG4gICAgfVxuXG4gICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG4gIH1cblxuICBzY3JvbGwoZGVsdGFZKSB7XG4gICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnNjcm9sbFkgLT0gZGVsdGFZICogdGhpcy5zdGVwU2l6ZTtcblxuICAgIGNvbnN0IGRvY3VtZW50SGVpZ2h0ID0gdGhpcy5fZ2V0RG9jdW1lbnRIZWlnaHQoKTtcblxuICAgIHRoaXMuc2Nyb2xsWSA9IHRoaXMuc2Nyb2xsWSA8IDAgPyAwIDogdGhpcy5zY3JvbGxZO1xuICAgIHRoaXMuc2Nyb2xsWSA9IHRoaXMuc2Nyb2xsWSA+IGRvY3VtZW50SGVpZ2h0IC0gd2luZG93LmlubmVySGVpZ2h0ID9cbiAgICAgIGRvY3VtZW50SGVpZ2h0IC0gd2luZG93LmlubmVySGVpZ2h0IDogdGhpcy5zY3JvbGxZO1xuXG4gICAgY29uc3QgdHdlZW5Qcm9wcyA9IHsgc2Nyb2xsVG86IHsgeTogdGhpcy5zY3JvbGxZIH0gfTtcblxuICAgIGlmICh0aGlzLnR3ZWVuICYmIHRoaXMudHdlZW4uaXNBY3RpdmUoKSkge1xuICAgICAgdGhpcy50d2Vlbi51cGRhdGVUbyh0d2VlblByb3BzLCB0cnVlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnR3ZWVuID0gVHdlZW5NYXgudG8od2luZG93LCB0aGlzLnN0ZXBEdXJhdGlvbiwgdHdlZW5Qcm9wcyk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXdoZWVsJywgdGhpcy5fd2hlZWxIYW5kbGVyRm4pO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdET01Nb3VzZVNjcm9sbCcsIHRoaXMuX3doZWVsSGFuZGxlckZuKTtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5fc2Nyb2xsSGFuZGxlckZuKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTbW9vdGhpZnk7XG4iXX0=
