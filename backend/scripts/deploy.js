const { mkdirSync, writeFileSync } = require("fs");
const path = require("path");
const hre = require("hardhat");
const { exportArtifacts } = require("./exportArtifacts");

async function main() {
  await hre.run("compile");

  const registry = await hre.ethers.deployContract("SupplyChainRegistry");
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  console.log(`SupplyChainRegistry deployed to ${registryAddress}`);

  const deploymentSummary = {
    network: hre.network.name,
    registry: registryAddress,
    timestamp: Math.floor(Date.now() / 1000),
    contracts: {
      SupplyChainRegistry: {
        address: registryAddress,
      },
      DeliveryEscrow: {
        address: null,
      },
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  mkdirSync(deploymentsDir, { recursive: true });
  const deploymentPath = path.join(deploymentsDir, `${hre.network.name}.json`);
  writeFileSync(deploymentPath, JSON.stringify(deploymentSummary, null, 2), "utf-8");
  console.log(`Deployment metadata saved to ${deploymentPath}`);

  await exportArtifacts(deploymentSummary);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
