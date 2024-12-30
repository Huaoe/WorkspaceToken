import { ethers } from "hardhat";

async function main() {
    const propertyAddress = "0xe9802B70F38537064480FbAfd77C9B1BEA84872A";
    
    // Get the PropertyToken contract
    const propertyToken = await ethers.getContractAt(
        "PropertyToken",
        propertyAddress
    );

    // Get the owner
    const owner = await propertyToken.owner();
    console.log("Property owner:", owner);

    // Get the token holder
    const tokenHolder = await propertyToken.tokenHolder();
    console.log("Token holder:", tokenHolder);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
