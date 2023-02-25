const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  config.resolve.alias["lottie-react-native"] = "react-native-web-lottie";
  // Customize the config before returning it.
  return config;
};
