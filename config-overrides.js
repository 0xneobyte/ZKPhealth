const webpack = require('webpack');

module.exports = function override(config) {
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "assert": require.resolve("assert"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "os": require.resolve("os-browserify"),
        "url": require.resolve("url"),
        "buffer": require.resolve("buffer"),
        "vm": require.resolve("vm-browserify")
    });
    config.resolve.fallback = fallback;
    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ]);
    
    // Add this to ignore source-map warnings
    config.ignoreWarnings = [/Failed to parse source map/];
    
    // Optionally disable source maps in production
    if (process.env.NODE_ENV === 'production') {
        config.devtool = false;
    }
    
    return config;
}; 