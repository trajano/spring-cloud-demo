const createExpoWebpackConfigAsync = require("@expo/webpack-config");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      projectRoot: __dirname,
      babel: {
        dangerouslyAddModulePathsToTranspile: ["@trajano"],
      },
    },
    argv
  );
  // Customize the config before returning it.
  console.log(config)
  return config;
};
