const path = require('path');
const webpack = require('webpack');
const devMode = process.env.WEBPACK_MODE === 'production';
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {

    entry: "./src/index.ts",

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'stateblocks.js',
        library: "stateblocks",
        libraryTarget: "umd"
    },

    plugins: [
        new CleanWebpackPlugin(),
        // new BundleAnalyzerPlugin()
    ],

    // devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"],

    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            // {test: /\.tsx?$/, loader: "awesome-typescript-loader"},
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            // {enforce: "pre", test: /\.js$/, loader: "source-map-loader"},

        ],

    },


    optimization:{
    //     minimize: false
    //     runtimeChunk: 'single',
    //     splitChunks: {
    //         cacheGroups: {
    //             vendor: {
    //                 test: /[\\/]node_modules[\\/]/,
    //                 name: 'vendors',
    //                 chunks: 'all'
    //             },
    //             styles: { //utile ?
    //                 name: 'styles',
    //                 test: /\.css$/,
    //                 chunks: 'all',
    //                 enforce: true
    //             }
    //         }
    //     }
    },



};