import { createConfig } from "fuels";
import { execSync } from "child_process";

export default createConfig({
  workspace: ".",
  output: "./types",
  snapshotDir: "./chain",
  privateKey:
    "0xde97d8624a438121b86a1956544bd72ed68cd69f2c99555b08b1e8c51ffd511c",

  onFailure: (error) => {
    if (error.message.includes("not enough coins to fit the target")) {
      console.log("Running 'yarn fuels deploy'...");
      execSync("yarn fuels deploy");
    }
  },
});

/**
 * Check the docs:
 * https://fuellabs.github.io/fuels-ts/tooling/cli/fuels/config-file
 */
