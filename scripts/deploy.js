// Deploy do contrato Turing e cópia dos artefatos para o frontend.
// Uso: npx hardhat run scripts/deploy.js --network localhost
const path = require("path");

async function main() {
  if (network.name === "hardhat") {
    console.warn(
      "Você está rodando na rede 'hardhat' efêmera. Use --network localhost " +
        "com `npx hardhat node` em outro terminal."
    );
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploy feito pela conta:", await deployer.getAddress());

  const Turing = await ethers.getContractFactory("Turing");
  const turing = await Turing.deploy();
  await turing.deployed();

  console.log("Turing deployed em:", turing.address);

  saveFrontendFiles(turing);
}

function saveFrontendFiles(turing) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ Turing: turing.address }, undefined, 2)
  );

  const TuringArtifact = artifacts.readArtifactSync("Turing");
  fs.writeFileSync(
    path.join(contractsDir, "Turing.json"),
    JSON.stringify(TuringArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });