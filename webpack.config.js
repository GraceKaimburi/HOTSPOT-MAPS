const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin'); 

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
    publicPath: './',
  },
  mode: 'production',
  devServer: {
    static: {
      directory: path.join(__dirname, 'src'),
    },
    compress: true,
    port: 8081,
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|webp|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]',
        },
      },
      // Add specific handling for Leaflet images
      {
        test: /leaflet.*\.png$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]'
        }
      }
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      "http": false,
      "https": false,
      "url": false,
      "stream": false,
    },
    alias: {
      // Add alias for Leaflet images
      'leaflet-images': path.resolve(__dirname, 'node_modules/leaflet/dist/images')
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'body'
  }),  
    // Copy Leaflet images to output
    new CopyWebpackPlugin({
      patterns: [{ from: 'src/images', to: 'images' }]
    })    
  ],
};