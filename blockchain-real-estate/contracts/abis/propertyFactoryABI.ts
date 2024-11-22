export const propertyFactoryABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "initialOwner",
        type: "address"
      },
      {
        internalType: "address",
        name: "_eurcTokenAddress",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "propertyToken",
        type: "address"
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string"
      }
    ],
    name: "PropertyCreated",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_title",
        type: "string"
      },
      {
        internalType: "string",
        name: "_description",
        type: "string"
      },
      {
        internalType: "string",
        name: "_location",
        type: "string"
      },
      {
        internalType: "string",
        name: "_imageUrl",
        type: "string"
      },
      {
        internalType: "string",
        name: "_tokenName",
        type: "string"
      },
      {
        internalType: "string",
        name: "_tokenSymbol",
        type: "string"
      },
      {
        internalType: "address",
        name: "_propertyOwner",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_price",
        type: "uint256"
      }
    ],
    name: "createProperty",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    name: "properties",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "propertiesCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;
