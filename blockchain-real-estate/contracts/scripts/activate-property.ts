import { ethers } from "hardhat";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

async function main() {
    // Get the property address from environment variable
    const propertyAddress = "0xe9802B70F38537064480FbAfd77C9B1BEA84872A";
    
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
    );

    // Activate the property
    const tx = await propertyToken.updatePropertyStatus(true);
    await tx.wait();
    console.log("Successfully activated property at:", propertyAddress);

    // Get and display property details
    const propertyDetails = await propertyToken.propertyDetails();
    console.log("\nProperty Details:");
    console.log("Title:", propertyDetails.title);
    console.log("Description:", propertyDetails.description);
    console.log("Location:", propertyDetails.location);
    console.log("Image URL:", propertyDetails.imageUrl);
    console.log("Price:", propertyDetails.price.toString());
    console.log("Is Active:", propertyDetails.isActive);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
