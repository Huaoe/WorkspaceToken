export const PROPERTY_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS || "";

export const PROPERTY_FACTORY_ABI = [
  // Property Creation
  "function createProperty(string memory _name, string memory _symbol, string memory _title, string memory _description, string memory _location, string memory _imageUrl, uint256 _price, uint256 _totalSupply) public returns (address)",
  "function getUserProperties(address _user) public view returns (tuple(address tokenAddress, bool isApproved)[] memory)",
  "function approveProperty(address _propertyAddress) public",
  "function rejectProperty(address _propertyAddress) public",
  "function isPropertyApproved(address _propertyAddress) public view returns (bool)",
  
  // Admin Functions
  "function owner() public view returns (address)",
  "function validator() public view returns (address)",
  "function whitelistContract() public view returns (address)",
  "function eurcTokenAddress() public view returns (address)",
  
  // Events
  "event PropertySubmitted(address indexed owner, address indexed tokenAddress)",
  "event PropertyApproved(address indexed tokenAddress)",
  "event PropertyRejected(address indexed tokenAddress)",
  
  // Initializer
  "function initialize(address _validator, address _whitelistContract, address _eurcTokenAddress) public initializer"
];

export const PROPERTY_TOKEN_ABI = [
  // Property Details
  "function getPropertyDetails() public view returns (string memory title, string memory description, string memory location, string memory imageUrl, uint256 price, bool isActive)",
  "function name() public view returns (string memory)",
  "function symbol() public view returns (string memory)",
  "function tokenHolder() public view returns (address)",
  
  // ERC20 Functions
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address account) public view returns (uint256)",
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) public returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const WHITELIST_ABI = [
  "function isWhitelisted(address _user) public view returns (bool)",
  "function addToWhitelist(address _user) public",
  "function removeFromWhitelist(address _user) public",
  "function owner() public view returns (address)",
  "event WhitelistAdded(address indexed user)",
  "event WhitelistRemoved(address indexed user)"
];

export const EURC_TOKEN_ABI = [
  "function name() public view returns (string memory)",
  "function symbol() public view returns (string memory)",
  "function decimals() public view returns (uint8)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address account) public view returns (uint256)",
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) public returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];
