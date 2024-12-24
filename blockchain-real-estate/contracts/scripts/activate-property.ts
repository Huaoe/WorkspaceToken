import { ethers } from "hardhat";
import { PropertyToken } from "../typechain-types";

async function main() {
    // Get the property address from environment variable
    const propertyAddress = process.env.ADDRESS;
    
    if (!propertyAddress) {
        throw new Error("Property address not provided. Set ADDRESS environment variable.");
    }

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Activating property with account:", deployer.address);
    console.log("Property address:", propertyAddress);

    // Get the PropertyToken contract
    const propertyToken = await ethers.getContractAt(
        "PropertyToken",
        propertyAddress
    ) as PropertyToken;

    // Activate the property
    const tx = await propertyToken.updatePropertyStatus(true);
    await tx.wait();
    console.log("Successfully activated property at:", propertyAddress);

    // Get and display property details
    const propertyDetails = await propertyToken.propertyDetails();
    const name = await propertyToken.name();
    const symbol = await propertyToken.symbol();
    const totalSupply = await propertyToken.totalSupply();

    console.log("\nProperty Details:");
    console.log("Token Address:", propertyAddress);
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
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
