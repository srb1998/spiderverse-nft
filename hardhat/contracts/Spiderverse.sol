// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract Spiderverse is ERC721Enumerable , Ownable {

    string _baseTokenURI;

    IWhitelist whitelist;

    bool public presaleStarted;

    uint256 public presaleEnded;

    uint256 public maxTokenIds = 20;

    uint256 public tokenIds;

    uint256 public _whitelistPrice = 0.01 ether;

    uint256 public _publicPrice = 0.015 ether;

    bool public _paused;

    modifier onlyWhenNotPaused {
        require(!_paused,"Contract Currently paused!");
        _;
    }

    constructor(string memory baseURI, address whitelistContract) ERC721("Spiderverse","Verse"){
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }
    
    function startPresale() public onlyOwner {
        presaleStarted = true;
        presaleEnded = block.timestamp + 30 minutes;
    }

    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp < presaleEnded, "Whitelist Mint Ended");
        require(whitelist.whitelistedAddresses(msg.sender),"Your wallet is not Whitelisted");
        require(tokenIds < maxTokenIds,"Sold Out");
        require(msg.value >= _whitelistPrice,"Ether sent is not correct");

        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);

    }

    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp >= presaleEnded,"Whitelist sale has not ended yet");
        require(tokenIds < maxTokenIds, "Sold Out!");
        require(msg.value >= _publicPrice, "Ether sent is not correct");

        tokenIds += 1;

        _safeMint(msg.sender, tokenIds);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    //Withdraw function to send mint funds from contract address to owner
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent,) = _owner.call{value: amount}("");
        require(sent,"Failed to send Ether");
    }

    
    receive() external payable{}

    fallback() external payable{}

}

