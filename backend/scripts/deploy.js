const { writeFileSync, mkdirSync } = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  await hre.run("compile");

  const registry = await hre.ethers.deployContract("SupplyChainRegistry");
  await registry.waitForDeployment();
  const address = await registry.getAddress();

  console.log(`SupplyChainRegistry deployed to ${address}`);

  const artifact = await hre.artifacts.readArtifact("SupplyChainRegistry");
  const escrowArtifact = await hre.artifacts.readArtifact("DeliveryEscrow");

  const frontendDir = path.join(__dirname, "..", "..", "frontend", "contracts");
  mkdirSync(frontendDir, { recursive: true });

  writeFileSync(
    path.join(frontendDir, "SupplyChainRegistry.json"),
    JSON.stringify({
      address,
      abi: artifact.abi,
      bytecode: artifact.bytecode
    }, null, 2),
    "utf-8"
  );

  writeFileSync(
    path.join(frontendDir, "DeliveryEscrow.json"),
    JSON.stringify({
      abi: escrowArtifact.abi,
      bytecode: escrowArtifact.bytecode
    }, null, 2),
    "utf-8"
  );

  writeFileSync(
    path.join(frontendDir, "deployment.json"),
    JSON.stringify({
      network: hre.network.name,
      registry: address,
      timestamp: Math.floor(Date.now() / 1000)
    }, null, 2),
    "utf-8"
  );

  console.log("Frontend artifacts written to", frontendDir);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
