// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IComplianceManager {
    function canTransfer(address from, address to) external view returns (bool);
}

/**
 * @title SecurityToken
 * @dev ERC-20 compatible security token with ERC-3643-style compliance wiring.
 */
contract SecurityToken is ERC20, Ownable, Pausable {
    // Token metadata
    uint8 private _decimals;
    string public assetType;
    string public metadataHash; // SHA-256 hash of off-chain metadata

    // Compliance state
    mapping(address => bool) public frozenAccounts;
    mapping(address => bool) public whitelistedAddresses;
    bool public transferRestricted;
    address public identityRegistry;
    address public complianceManager;

    // Events
    event AccountFrozen(address indexed account, string reason);
    event AccountUnfrozen(address indexed account);
    event AddressWhitelisted(address indexed account);
    event AddressRemovedFromWhitelist(address indexed account);
    event MetadataHashUpdated(string newHash);
    event IdentityRegistryUpdated(address indexed registry);
    event ComplianceManagerUpdated(address indexed manager);

    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimalsValue,
        string memory assetTypeValue,
        string memory metadataHashValue,
        address identityRegistryAddress,
        address complianceManagerAddress
    ) ERC20(name, symbol) Ownable(msg.sender) {
        require(identityRegistryAddress != address(0), "Identity registry required");
        require(complianceManagerAddress != address(0), "Compliance manager required");

        _decimals = decimalsValue;
        assetType = assetTypeValue;
        metadataHash = metadataHashValue;
        transferRestricted = true;
        identityRegistry = identityRegistryAddress;
        complianceManager = complianceManagerAddress;

        _mint(msg.sender, totalSupply);
        whitelistedAddresses[msg.sender] = true;

        emit IdentityRegistryUpdated(identityRegistryAddress);
        emit ComplianceManagerUpdated(complianceManagerAddress);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function setIdentityRegistry(address registry) external onlyOwner {
        require(registry != address(0), "Registry required");
        identityRegistry = registry;
        emit IdentityRegistryUpdated(registry);
    }

    function setComplianceManager(address manager) external onlyOwner {
        require(manager != address(0), "Manager required");
        complianceManager = manager;
        emit ComplianceManagerUpdated(manager);
    }

    function freezeAccount(address account, string memory reason) external onlyOwner {
        require(!frozenAccounts[account], "Account already frozen");
        frozenAccounts[account] = true;
        emit AccountFrozen(account, reason);
    }

    function unfreezeAccount(address account) external onlyOwner {
        require(frozenAccounts[account], "Account not frozen");
        frozenAccounts[account] = false;
        emit AccountUnfrozen(account);
    }

    function whitelistAddress(address account) external onlyOwner {
        whitelistedAddresses[account] = true;
        emit AddressWhitelisted(account);
    }

    function removeFromWhitelist(address account) external onlyOwner {
        whitelistedAddresses[account] = false;
        emit AddressRemovedFromWhitelist(account);
    }

    function setTransferRestricted(bool restricted) external onlyOwner {
        transferRestricted = restricted;
    }

    function updateMetadataHash(string memory newHash) external onlyOwner {
        metadataHash = newHash;
        emit MetadataHashUpdated(newHash);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override whenNotPaused {
        require(!frozenAccounts[from], "Sender frozen");
        require(!frozenAccounts[to], "Recipient frozen");

        if (transferRestricted && from != address(0) && to != address(0)) {
            require(
                whitelistedAddresses[from] && whitelistedAddresses[to],
                "Whitelist required"
            );
        }

        if (complianceManager != address(0) && from != address(0) && to != address(0)) {
            require(
                IComplianceManager(complianceManager).canTransfer(from, to),
                "Compliance blocked"
            );
        }

        super._update(from, to, value);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
