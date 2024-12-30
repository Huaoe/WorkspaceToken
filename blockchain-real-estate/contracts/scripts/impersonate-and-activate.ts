import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const propertyAddress = "0xe9802B70F38537064480FbAfd77C9B1BEA84872A";
  const ownerAddress = "0xdbC43Ba45381e02825b14322cDdd15eC4B3164E6";
  
  // Get the property token contract
  const propertyToken = await ethers.getContractAt("PropertyToken", propertyAddress);
  
  // Impersonate the owner account
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [ownerAddress],
  });

  // Fund the owner account with some ETH for gas
  await hre.network.provider.send("hardhat_setBalance", [
    ownerAddress,
    "0x1000000000000000000", // 1 ETH
  ]);

  // Get a signer for the owner account
  const ownerSigner = await ethers.getSigner(ownerAddress);

  // Connect the contract to the owner signer
  const propertyTokenAsOwner = propertyToken.connect(ownerSigner);

  // Activate the property
  console.log("Activating property...");
  const tx = await propertyTokenAsOwner.updatePropertyStatus(true);
  await tx.wait();
  console.log("Property activated!");

  // Check the new status
  const propertyDetails = await propertyToken.propertyDetails();
  console.log("Property is now active:", propertyDetails.isActive);

  // Stop impersonating
  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [ownerAddress],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
