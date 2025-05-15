const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
  // Добавляем путь к нашему shim
  const processShimPath = path.resolve(__dirname, 'src/shims/process-browser.js');

  // Добавляем alias для process/browser
  config.resolve.alias = {
    ...config.resolve.alias,
    'process/browser': processShimPath
  };

  // Добавляем fallback для node.js модулей
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer/"),
    "process": processShimPath,
    "vm": require.resolve("vm-browserify")
  };

  // Добавляем плагины для поддержки Buffer и Process
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.ProvidePlugin({
      process: processShimPath
    })
  ];

  return config;
}; 