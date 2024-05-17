import { createConfig } from "fuels";

export default createConfig({
  workspace: "./contracts",
  output: "./types",
  useBuiltinForc: false,
  chainConfig: "./chainConfig.json",
});

/**
 * Check the docs:
 * https://fuellabs.github.io/fuels-ts/tooling/cli/fuels/config-file
 */
