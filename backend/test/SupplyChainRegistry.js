const { expect } = require("chai");
const { ethers } = require("hardhat");

async function registerParticipant(contract, signer, overrides = {}) {
  const defaults = {
    orgName: "Org",
    role: 5,
    email: "org@example.com",
    region: "North",
    metadataURI: "",
    vehicleType: "Truck",
    capacityPerTrip: 100,
    baseCharge: 100,
    leadTimeHours: 24,
    collateralPct: 10
  };

  const input = Object.assign({}, defaults, overrides);
  const coverageAreas = overrides.coverageAreas ?? ["North", "South"];

  return contract
    .connect(signer)
    .register(
      {
        orgName: input.orgName,
        role: input.role,
        email: input.email,
        region: input.region,
        metadataURI: input.metadataURI,
        vehicleType: input.vehicleType,
        capacityPerTrip: input.capacityPerTrip,
        baseCharge: input.baseCharge,
        leadTimeHours: input.leadTimeHours,
        collateralPct: input.collateralPct
      },
      coverageAreas
    );
}

async function createRequest(contract, signer, overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const input = Object.assign(
    {
      demander: "DemanderCo",
      fromRegion: "North",
      toRegion: "South",
      materialId: "MAT-1",
      quantity: 50,
      deadline: now + 7 * 24 * 60 * 60,
      maxPrice: 1_000,
      collateralStake: 100,
      notes: "Handle with care"
    },
    overrides
  );

  const tx = await contract.connect(signer).createDeliveryRequest(input);
  const receipt = await tx.wait();
  const event = receipt.logs.find((log) => log.fragment?.name === "DeliveryRequested");
  const requestId = event?.args?.requestId ?? (await contract.deliveryRequestCount());
  return Number(requestId);
}

describe("SupplyChainRegistry", function () {
  async function deployFixture() {
    const [deployer, demander, carrierOne, carrierTwo] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("SupplyChainRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();

    await registerParticipant(registry, demander, {
      orgName: "DemanderCo",
      role: 5,
      email: "demander@example.com",
      vehicleType: "",
      capacityPerTrip: 0,
      baseCharge: 0,
      leadTimeHours: 0,
      collateralPct: 0,
      coverageAreas: []
    });

    await registerParticipant(registry, carrierOne, {
      orgName: "CarrierOne",
      role: 4,
      email: "carrier1@example.com"
    });

    await registerParticipant(registry, carrierTwo, {
      orgName: "CarrierTwo",
      role: 4,
      email: "carrier2@example.com"
    });

    const requestId = await createRequest(registry, demander);

    await registry.connect(demander).draftContract({
      requestId,
      provider: carrierOne.address,
      partyAName: "DemanderCo",
      partyBName: "CarrierOne",
      onTimeReward: "Bonus",
      tardyPenalty: "Penalty",
      metadataURI: "",
      terms: []
    });

    return { registry, demander, carrierOne, carrierTwo, requestId };
  }

  it("prevents unrelated carriers from logging tracking events", async function () {
    const { registry, carrierTwo, requestId } = await deployFixture();

    await expect(
      registry
        .connect(carrierTwo)
        .logTrackingEvent(requestId, "Picked up", "Warehouse A")
    ).to.be.revertedWith("NOT_AUTHORISED");
  });

  it("allows the assigned carrier to log tracking events", async function () {
    const { registry, carrierOne, requestId } = await deployFixture();

    await expect(
      registry
        .connect(carrierOne)
        .logTrackingEvent(requestId, "Picked up", "Warehouse A")
    )
      .to.emit(registry, "TrackingEventLogged")
      .withArgs(requestId, "Picked up", "Warehouse A");
  });
});
