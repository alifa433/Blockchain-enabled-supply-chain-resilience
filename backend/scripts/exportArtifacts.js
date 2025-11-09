const { mkdirSync, writeFileSync } = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  await hre.run("compile");

  const contracts = ["SupplyChainRegistry", "DeliveryEscrow"];
  const frontendDir = path.join(__dirname, "..", "..", "frontend", "contracts");
  mkdirSync(frontendDir, { recursive: true });

  for (const name of contracts) {
    const artifact = await hre.artifacts.readArtifact(name);
    writeFileSync(
      path.join(frontendDir, `${name}.abi.json`),
      JSON.stringify({ abi: artifact.abi, bytecode: artifact.bytecode }, null, 2),
      "utf-8"
    );
  }

  console.log(`Exported ${contracts.length} contract ABIs to ${frontendDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
