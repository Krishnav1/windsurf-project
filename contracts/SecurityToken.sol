// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SecurityToken
 * @dev ERC-20 compatible security token with compliance features
 * 
 * Features:
 * - Fractional ownership (8 decimals)
 * - Freeze/unfreeze functionality for compliance
 * - Metadata hash anchoring for off-chain document verification
 * - Transfer restrictions for regulatory compliance
 * - Admin controls for token management
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract SecurityToken is ERC20, Ownable, Pausable {
    // Token metadata
    uint8 private _decimals;
    string public assetType;
    string public metadataHash; // SHA-256 hash of off-chain metadata
    
    // Compliance features
    mapping(address => bool) public frozenAccounts;
    mapping(address => bool) public whitelistedAddresses;
    bool public transferRestricted;
    
    // Events
    event AccountFrozen(address indexed account, string reason);
    event AccountUnfrozen(address indexed account);
    event AddressWhitelisted(address indexed account);
    event AddressRemovedFromWhitelist(address indexed account);
    event MetadataHashUpdated(string newHash);
    
    /**
     * @dev Constructor to initialize the security token
     * @param name Token name
     * @param symbol Token symbol
     * @param totalSupply Total supply of tokens (with decimals)
     * @param decimalsValue Number of decimals (typically 8 for fractional assets)
     * @param assetTypeValue Type of underlying asset
     * @param metadataHashValue SHA-256 hash of token metadata
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimalsValue,
        string memory assetTypeValue,
        string memory metadataHashValue
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimalsValue;
        assetType = assetTypeValue;
        metadataHash = metadataHashValue;
        transferRestricted = true; // Start with restrictions enabled
        
        // Mint total supply to contract owner
        _mint(msg.sender, totalSupply);
        
        // Whitelist owner by default
        whitelistedAddresses[msg.sender] = true;
    }
    
    /**
     * @dev Returns the number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Freeze an account (compliance feature)
     * @param account Address to freeze
     * @param reason Reason for freezing
     */
    function freezeAccount(address account, string memory reason) external onlyOwner {
        require(!frozenAccounts[account], "Account already frozen");
        frozenAccounts[account] = true;
        emit AccountFrozen(account, reason);
    }
    
    /**
     * @dev Unfreeze an account
     * @param account Address to unfreeze
     */
    function unfreezeAccount(address account) external onlyOwner {
        require(frozenAccounts[account], "Account not frozen");
        frozenAccounts[account] = false;
        emit AccountUnfrozen(account);
    }
    
    /**
     * @dev Add address to whitelist
     * @param account Address to whitelist
     */
    function whitelistAddress(address account) external onlyOwner {
        whitelistedAddresses[account] = true;
        emit AddressWhitelisted(account);
    }
    
    /**
     * @dev Remove address from whitelist
     * @param account Address to remove
     */
    function removeFromWhitelist(address account) external onlyOwner {
        whitelistedAddresses[account] = false;
        emit AddressRemovedFromWhitelist(account);
    }
    
    /**
     * @dev Enable or disable transfer restrictions
     * @param restricted True to enable restrictions
     */
    function setTransferRestricted(bool restricted) external onlyOwner {
        transferRestricted = restricted;
    }
    
    /**
     * @dev Update metadata hash (for document updates)
     * @param newHash New SHA-256 hash
     */
    function updateMetadataHash(string memory newHash) external onlyOwner {
        metadataHash = newHash;
        emit MetadataHashUpdated(newHash);
    }
    
    /**
     * @dev Pause all token transfers (emergency stop)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override transfer function to add compliance checks
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override whenNotPaused {
        // Check if accounts are frozen
        require(!frozenAccounts[from], "Sender account is frozen");
        require(!frozenAccounts[to], "Recipient account is frozen");
        
        // Check whitelist if transfer restrictions are enabled
        if (transferRestricted && from != address(0) && to != address(0)) {
            require(
                whitelistedAddresses[from] && whitelistedAddresses[to],
                "Transfer restricted: addresses must be whitelisted"
            );
        }
        
        super._update(from, to, value);
    }
    
    /**
     * @dev Burn tokens (reduce supply)
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
