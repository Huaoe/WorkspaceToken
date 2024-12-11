// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPropertyFactory {
    struct PropertyInfo {
        address tokenAddress;
        bool isApproved;
    }

    event PropertySubmitted(address indexed owner, address indexed tokenAddress);
    event PropertyApproved(address indexed tokenAddress);
    event PropertyRejected(address indexed tokenAddress);

    function initialize(
        string memory _name,
        string memory _symbol,
        address _admin,
        address _validator,
        address _paymentToken,
        address _whitelistContract
    ) external;

    function createProperty(
        string memory _title,
        string memory _description,
        string memory _location,
        string memory _imageUrl,
        uint256 _price,
        uint256 _totalSupply,
        string memory _tokenName,
        string memory _tokenSymbol
    ) external returns (address);

    function approveProperty(address _propertyAddress) external;
    function rejectProperty(address _propertyAddress) external;
    function getPropertyCount() external view returns (uint256);
    function getUserProperties(address _user) external view returns (PropertyInfo[] memory);
    function isPropertyApproved(address _propertyAddress) external view returns (bool);
}
