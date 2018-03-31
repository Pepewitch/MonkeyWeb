const path = require('path');
const webpack = require('webpack');
module.exports = {
    entry: {
        app: './src/react/app.jsx',
        main: ['react']
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            }
        ]
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'dist/react')
    },
    mode: 'development'
};