module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "module:react-native-dotenv",
      [
        "babel-plugin-module-resolver",
        {
          alias: {
            "@contexts": "./src/contexts",
            "@components": "./src/components",
            "@lib": "./src/lib",
            "@init": "./src/init",
            "@navigation": "./src/navigation",
          },
        },
      ],
    ],
  };
};
