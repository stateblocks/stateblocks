const path = require('path');
const webpack = require('webpack');
const devMode = process.env.WEBPACK_MODE === 'production';



module.exports = {

    entry: "./src/index.ts",

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'stateblocks.js',
        library: "stateblocks",
        libraryTarget: "umd"
    },

    // output: {
    //     filename: '[name].[contenthash].js',
    //     chunkFilename: '[name].[chunkhash].js', //pattern des chunks chargés en asynchrone avec import("something")
    //     // path: outputPath
    // },


    // plugins: [
    //     // new CleanWebpackPlugin([outputPath]),
    //     // new HtmlWebpackPlugin({
    //     //     template: 'src/index.html'
    //     // }),
    //     new webpack.HashedModuleIdsPlugin(), //https://webpack.js.org/guides/caching/#module-identifiers
    //
    //
    // ],
    // // Enable sourcemaps for debugging webpack's output.
    // devtool: "source-map",


    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"],

    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            {test: /\.tsx?$/, loader: "awesome-typescript-loader"},

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            // {enforce: "pre", test: /\.js$/, loader: "source-map-loader"},


        ],

    },


    // optimization: {
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
    // },



};