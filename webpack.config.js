module.exports = {
  entry: './smoothify.webpack.js',
  output: './dist/smoothify.pkgd.js',
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
    ],
  },
};
