// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPropertyToken {
    struct PropertyDetails {
        string title;
        string description;
        string location;
        string imageUrl;
        uint256 price;
        address owner;
        bool isApproved;
    }

    event PropertyCreated(
        string title,
        string description,
        string location,
        string imageUrl,
        uint256 price,
        address owner
    );

    function initialize(
        string memory _title,
        string memory _description,
        string memory _location,
        string memory _imageUrl,
        uint256 _price,
        uint256 _totalSupply,
        address _owner,
        address _paymentToken,
        string memory _name,
        string memory _symbol
    ) external;

    function getPropertyDetails() external view returns (PropertyDetails memory);
    function updatePropertyDetails(
        string memory _title,
        string memory _description,
        string memory _location,
        string memory _imageUrl,
        uint256 _price
    ) external;
    
    function setApprovalStatus(bool _status) external;
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
}
