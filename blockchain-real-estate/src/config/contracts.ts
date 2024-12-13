export const PROPERTY_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS || "";

export const PROPERTY_FACTORY_ABI = [
  "function createProperty(string memory _title, string memory _description, string memory _location, string memory _imageUrl, uint256 _price) public returns (address)",
  "function getUserProperties(address _user) public view returns (tuple(address tokenAddress, bool isApproved)[] memory)",
  "function approveProperty(address _propertyAddress) public",
  "function rejectProperty(address _propertyAddress) public",
  "function isPropertyApproved(address _propertyAddress) public view returns (bool)",
  "event PropertySubmitted(address indexed owner, address indexed tokenAddress)",
  "event PropertyApproved(address indexed tokenAddress)",
  "event PropertyRejected(address indexed tokenAddress)"
];

export const PROPERTY_TOKEN_ABI = [
  "function getPropertyDetails() public view returns (string memory title, string memory description, string memory location, string memory imageUrl, uint256 price, bool isActive)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address account) public view returns (uint256)",
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) public returns (bool)"
];
