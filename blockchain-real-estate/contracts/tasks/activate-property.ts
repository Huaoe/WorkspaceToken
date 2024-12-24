import { task } from "hardhat/config";
import { PropertyToken } from "../typechain-types";

task("activate-property", "Activates a property token")
  .addParam("address", "The property token address")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Activating property with account:", deployer.address);
    console.log("Property address:", taskArgs.address);

    // Get the PropertyToken contract
    const propertyToken = await ethers.getContractAt(
      "PropertyToken",
      taskArgs.address
    ) as PropertyToken;

    // Activate the property
    const tx = await propertyToken.updatePropertyStatus(true);
    await tx.wait();
    console.log("Successfully activated property at:", taskArgs.address);

    // Get and display property details
    const propertyDetails = await propertyToken.propertyDetails();
    const name = await propertyToken.name();
    const symbol = await propertyToken.symbol();
    const totalSupply = await propertyToken.totalSupply();

    console.log("\nProperty Details:");
    console.log("Token Address:", taskArgs.address);
    console.log("Is Active:", propertyDetails.isActive);
    console.log("\nDetailed Property Information:");
    console.log("Title:", propertyDetails.title);
    console.log("Description:", propertyDetails.description);
    console.log("Location:", propertyDetails.location);
    console.log("Image URL:", propertyDetails.imageUrl);
    console.log("Price:", ethers.formatUnits(propertyDetails.price, 6), "EURC");

    console.log("\nToken Information:");
    console.log("Name:", name);
    console.log("Symbol:", symbol);
    console.log("Total Supply:", ethers.formatEther(totalSupply), "tokens");
  });
