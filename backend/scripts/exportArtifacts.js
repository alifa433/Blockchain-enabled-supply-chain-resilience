const { readFileSync, writeFileSync, mkdirSync, existsSync } = require("fs");
const path = require("path");
const hre = require("hardhat");

async function exportArtifacts(deployment, options = {}) {
  const resolvedDeployment = deployment ?? {};
  const contracts = resolvedDeployment.contracts ?? {};
  const frontendDir = options.outputDir ?? path.join(__dirname, "..", "..", "frontend", "src", "contracts");

  mkdirSync(frontendDir, { recursive: true });

  const summary = [];

  for (const [contractName, metadata] of Object.entries(contracts)) {
    const artifact = await hre.artifacts.readArtifact(contractName);
    const payload = {
      address: metadata?.address ?? null,
      abi: artifact.abi,
    };
    writeFileSync(path.join(frontendDir, `${contractName}.json`), JSON.stringify(payload, null, 2), "utf-8");
    summary.push(`${contractName}@${payload.address ?? "null"}`);
  }

  const deploymentSummary = {
    network: resolvedDeployment.network ?? hre.network.name,
    registry: contracts?.SupplyChainRegistry?.address ?? null,
    timestamp: resolvedDeployment.timestamp ?? Math.floor(Date.now() / 1000),
    contracts: Object.fromEntries(
      Object.entries(contracts).map(([name, meta]) => [name, { address: meta?.address ?? null }])
    ),
  };

  writeFileSync(
    path.join(frontendDir, "deployment.json"),
    JSON.stringify(deploymentSummary, null, 2),
    "utf-8"
  );

  console.log(`Exported ${summary.length} contract artifacts to ${frontendDir}: ${summary.join(", ")}`);
}

async function main() {
  await hre.run("compile");

  const network = hre.network.name;
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentPath = path.join(deploymentsDir, `${network}.json`);

  if (!existsSync(deploymentPath)) {
    throw new Error(
      `Deployment metadata not found for network "${network}" at ${deploymentPath}. Run scripts/deploy.js first.`
    );
  }

  const deployment = JSON.parse(readFileSync(deploymentPath, "utf-8"));
  await exportArtifacts(deployment);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = { exportArtifacts };
