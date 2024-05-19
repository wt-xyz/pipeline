import { createConfig } from "fuels";

export default createConfig({
  contracts: ["contracts/token-streaming"],
  output: "./types",
  snapshotDir: "./chain",
  useBuiltinForc: false,
});

/**
 * Check the docs:
 * https://fuellabs.github.io/fuels-ts/tooling/cli/fuels/config-file
 */
