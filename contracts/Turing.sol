pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Turing is ERC20{
    address public owner;

    bool public voting = true;

    mapping(string => address) public users;
    mapping(address => string) private codinomeOf;

    mapping(string => mapping(string => bool)) public hasVote;
    mapping(address => uint256) public voteCount;

    constructor() ERC20("Turing", "TUR"){
        _setUser("roberta", 0x502542668aF09fa7aea52174b9965A7799343Df7);
        _setUser("nome1", 0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        _setUser("nome2", 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
        _setUser("nome3", 0x90F79bf6EB2c4f870365E785982E1f101E93b906);
        _setUser("nome4", 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);
        _setUser("nome5", 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc);

        owner = msg.sender;
    }
    modifier onlyAdmin {
        require(msg.sender == owner || msg.sender == users["roberta"], "essa funcao so pode ser acessada por admins");
        _;
    }

    function updateUser(string memory codinome, address user_addr) public onlyAdmin {
        require(bytes(codinome).length > 0, "codinome nao pode ser vazio");
        _setUser(codinome, user_addr);
    }

    function votingOn() public onlyAdmin{
        voting = true;
    }

    function votingOff() public onlyAdmin{
        voting = false;
    }

    function issueToken(string memory codinome, uint256 qtde_de_Turings) public onlyAdmin{
        require(users[codinome] != address(0), "codinome inexistente");
        mintTuring(users[codinome], qtde_de_Turings);
    }

    function vote(string memory codinome, uint256 qtde_de_Turings) public{
        require(voting == true, "votacao inativa");

        string memory voter = codinomeOf[msg.sender];
        require(bytes(voter).length > 0, "usuario nao autorizado");

        require(users[codinome] != address(0), "codinome inexistente");
        require(users[codinome] != msg.sender, "nao pode votar em si mesmo");

        require(qtde_de_Turings > 0 && qtde_de_Turings <= 2, "qtde deve ser 1 ou 2");

        require(!hasVote[voter][codinome], "voce ja votou neste codinome");

        hasVote[voter][codinome] = true;

        mintTuring(users[codinome], qtde_de_Turings);

        // A cada 10 votos, o votante recebe 1 Turing
        voteCount[msg.sender] += 1;
        if (voteCount[msg.sender] % 10 == 0) {
            mintTuring(msg.sender, 1);
        }
    }

    function _setUser(string memory codinome, address addr) internal {
        address old = users[codinome];
        users[codinome] = addr;
        codinomeOf[addr] = codinome;
    }

    function mintTuring(address to, uint256 qtd) internal{
        _mint(to, qtd * 10 ** decimals());
    }

    function decimals() public pure override returns (uint8){
        return 0;
    }
}