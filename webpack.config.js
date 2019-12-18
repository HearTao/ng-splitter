const path = require('path')

module.exports = {
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    target: 'node',
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    module: {
        rules: [
            {
                test: /.ts$/,
                exclude: /node_modules/,
                use: [
                    { 
                        loader: 'babel-loader'
                    },
                    { 
                        loader: 'ts-loader'
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.ts'],
    },
    optimization: {
        minimize: process.env.NODE_ENV === 'production'
    },
    output: {
        path: path.resolve('./dist'),
        filename: 'index.js',
        libraryTarget: 'umd'
    },
    externals: {
        "typescript": "typescript",
        "@angular/core": "@angular/core",
        "@angular/compiler": "@angular/compiler",
        "@angular/compiler-cli": "@angular/compiler-cli"
    }
}