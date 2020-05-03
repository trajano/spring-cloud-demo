module.exports = {
  configureWebpack: {
    devServer: {
      compress: true,
      disableHostCheck: true,   // That solved it
    }
  }
}