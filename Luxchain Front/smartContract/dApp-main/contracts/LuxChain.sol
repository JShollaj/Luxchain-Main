//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract LuxChain is ERC721 {
    address _owner = msg.sender;
    uint256 _supply;

    enum stages{
        normal,
        lost,
        invalidating,
        invalidate
    }

    mapping(uint256 => Token) tokens;
    mapping(string => uint256) serialNumbers;

    event mintToken(address _to, string _serNumber, uint256 tokenId);
    event transferEvent(address _from, address _to, uint256 _tokenId);
    event invalidToken(uint256 _tokenId);
    event tokendestory(uint256 _tokenId);
    event tokenLost(uint256 _tokenId);
    event tokenrestored(uint256 _tokenId);

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {}

    struct Token {
        string serialNumber;
        string name;
        string information;
        stages state;
        uint256 time;
    }

    modifier stateoftoken(uint256 tokenId) {
        require(tokens[tokenId].state == stages.normal, "Token is abnormal");
        _;
    }

    modifier validToken(uint256 tokenId) {
        require(tokens[tokenId].state != stages.invalidate, "Token is invalidated already");
        _;
    }

    modifier timedDestory(uint256 _tokenId) {
        if (tokens[_tokenId].state == stages.invalidating && block.timestamp >= tokens[_tokenId].time + 8 days) {
            // now the admin can directly call the invalidated to invalidate the token
            tokens[_tokenId].state = stages.invalidate;
            super._burn(_tokenId);
            emit tokendestory(_tokenId);
        }
        _;
    }

    //admin can call this function to destroy the invalidating token
    function invalidated(uint256 _tokenId) external adminOnly { 
        if (tokens[_tokenId].state == stages.invalidating && block.timestamp >= tokens[_tokenId].time + 8 days) {
            tokens[_tokenId].state = stages.invalidate;
            super._burn(_tokenId);
            emit tokendestory(_tokenId);
        }
    }

    modifier adminOnly {
        require(msg.sender == _owner, "Admin only function");
        _;
    }

    modifier adminOrOwnerOnly(uint256 _tokenId) {
        require(msg.sender == _owner || msg.sender == ownerOf(_tokenId), "Admin or owner only function");
        _;
    }

    // When a product is sold, an accompanying token created
    function mint(address _to, string memory _serialNumber, string memory _name) public adminOnly {
        super._mint(_to, _supply);
        Token memory newToken = Token(_serialNumber, _name, '', stages.normal, block.timestamp);
        tokens[_supply] = newToken;
        serialNumbers[_serialNumber] = _supply++;
        emit mintToken(_to, _serialNumber, _supply);
    }

    //When customer goes to the counter, admin could use this function to make the state of token to be invalidating
    //If customer is the current owner, the token could be restored in 8 days using restoreToken()
    //Or the admin could destroy the token after 8 days using invalidated()
    function invalidateToken(uint256 _tokenId) public adminOnly timedDestory(_tokenId) stateoftoken(_tokenId) {
        tokens[_tokenId].state = stages.invalidating;
        tokens[_tokenId].time = block.timestamp;
        emit invalidToken(_tokenId);
    }

    //Customer could use this to report loss, and the state would be 'lost'
    //Admin could use restoreToken to change state back to 'normal'
    function reportlost(uint256 _tokenId) public adminOrOwnerOnly(_tokenId) timedDestory(_tokenId) stateoftoken(_tokenId) {
        tokens[_tokenId].state = stages.lost;
        emit tokenLost(_tokenId);
    }

    function restoreToken(uint256 _tokenId) public adminOnly timedDestory(_tokenId) validToken(_tokenId)  {
        tokens[_tokenId].state = stages.normal;
        emit tokenrestored(_tokenId);
    }

    function checkState(uint256 _tokenId) public view returns(stages)  {
        return tokens[_tokenId].state;
    }

    function transferFrom(address _from, address _to, uint256 _tokenId) public override timedDestory(_tokenId) adminOrOwnerOnly(_tokenId) stateoftoken(_tokenId) {
        super.transferFrom(_from, _to, _tokenId);
        tokens[_tokenId].information = '';
        emit transferEvent(_from, _to, _tokenId);
    }

    function updateInformation(uint256 _tokenId, string memory _information) public adminOrOwnerOnly(_tokenId) timedDestory(_tokenId) {
        tokens[_tokenId].information = _information;
    }

    function viewSerialNumber(uint256 _tokenId)
        public
        view
        returns (string memory)
    {
        return tokens[_tokenId].serialNumber;
    }

    function viewName(uint256 _tokenId) public view returns (string memory) {
        return tokens[_tokenId].name;
    }

    function viewTokenId(string memory _serialNumber)
        public
        view
        returns (uint256)
    {
        return serialNumbers[_serialNumber];
    }

    function getTotalSupply() public view returns (uint256) {
        return _supply;
    }

    /*
    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: owner query for nonexistent token");
        return owner;
    }
    */
}
