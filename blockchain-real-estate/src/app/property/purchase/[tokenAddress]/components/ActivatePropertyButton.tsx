import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getPropertyTokenContract, getPropertyFactoryContract } from "@/lib/contracts";

export function ActivatePropertyButton({ propertyTokenAddress }: { propertyTokenAddress: string }) {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const handleActivate = async () => {
    if (!address) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Get factory contract to check ownership
      const factory = await getPropertyFactoryContract();
      const factoryOwner = await factory.owner();

      // Check if caller is factory owner
      if (factoryOwner.toLowerCase() !== address.toLowerCase()) {
        throw new Error("Only the factory owner can activate the property");
      }

      // Get property token contract
      const propertyTokenContract = await getPropertyTokenContract(propertyTokenAddress);
      const signer = await propertyTokenContract.runner?.getSigner();
      if (!signer) {
        throw new Error("No signer available");
      }
      const propertyTokenWithSigner = propertyTokenContract.connect(signer);

      // Update property status
      console.log("Activating property...");
      const tx = await propertyTokenWithSigner.updatePropertyStatus(true);
      console.log("Transaction sent:", tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log("Property activated in block:", receipt.blockNumber);

      toast({
        title: "Success",
        description: "Property has been activated",
      });
    } catch (error: any) {
      console.error("Failed to activate property:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to activate property",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleActivate}
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading ? "Activating..." : "Activate Property"}
    </Button>
  );
}
