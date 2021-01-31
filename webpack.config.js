const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: `${__dirname}/src/index.ts`,
  output: {
    filename: "rp-xyjax.js",
    path: __dirname,
    library: "RPXyJax",
    libraryTarget: "umd"
  },

  devtool: false,

  externals: {
    "mathjax": {
      commonjs: "mathjax",
      commonjs2: "mathjax",
      amd: "mathjax",
      root: "MathJax"
    },
    "ractive-player": {
      commonjs: "ractive-player",
      commonjs2: "ractive-player",
      amd: "ractive-player",
      root: "RactivePlayer"
    },
    "react": {
      commonjs: "react",
      commonjs2: "react",
      amd: "react",
      root: "React"
    },
    "rp-mathjax": {
      commonjs: "rp-mathjax",
      commonjs2: "rp-mathjax",
      amd: "rp-mathjax",
      root: "RPMathJax"
    }
  },

  mode: "production",

  module: {
    rules: [
     {
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  },

  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          safari10: true
        }
      })
    ],
    emitOnErrors: true
  },

  plugins: [
    new webpack.BannerPlugin({
      banner: () => require("fs").readFileSync("./LICENSE", {encoding: "utf8"})
    })
  ],

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"]
  }
}
