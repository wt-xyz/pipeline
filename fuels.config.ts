import { createConfig } from "fuels";

export default createConfig({
  workspace: ".",
  output: "./types",
  snapshotDir: "./chain",
  useBuiltinForc: false,
});

/**
 * Check the docs:
 * https://fuellabs.github.io/fuels-ts/tooling/cli/fuels/config-file
 */
