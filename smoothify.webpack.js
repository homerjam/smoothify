require('expose?Hamster!hamsterjs');
require('imports?define=>false!gsap/src/uncompressed/TweenMax');
require('gsap/src/uncompressed/plugins/ScrollToPlugin');

var Smoothify = require('expose?Smoothify!babel?presets[]=es2015!./src/smoothify');

module.exports = Smoothify;
