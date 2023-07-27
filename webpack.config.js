const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist')
        },
        compress: true,
        port: 4200
    },
    devtool: 'source-map',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.(png|jpe?g|gif)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: 'assets/images/[name].[ext]',
                        },
                    },
                ],
            },
            {
                test: /\.(ogg)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: 'assets/songs/[name].[ext]',
                        },
                    },
                ],
            },
        ],

    },
};
