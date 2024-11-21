export const propertyTokenABI = [
  {
    inputs: [],
    name: "getPropertyDetails",
    outputs: [
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      { name: "location", type: "string" },
      { name: "imageUrl", type: "string" },
      { name: "price", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "_newPrice", type: "uint256" }],
    name: "updatePrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const;
