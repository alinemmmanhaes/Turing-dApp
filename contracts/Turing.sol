pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract Turing{
    // An address type variable is used to store ethereum accounts.
    address public owner;

    boolean public voting = false;

    mapping(string => address) public users;
    mapping(address => uint256) balances;

    constructor(){
        users["roberta"] = 0x502542668aF09fa7aea52174b9965A7799343Df7;
        users["nome1"] = 0x70997970c51812dc3a010c7d01b50e0d17dc79c8;
        users["nome2"] = 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc;
        users["nome3"] = 0x90f79bf6eb2c4f870365e785982e1f101e93b906;
        users["nome4"] = 0x15d34aaf54267db7d7c367839aaf71a00a2c6a65;
        users["nome5"] = 0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc;

        owner = msg.sender;
    }
    modifier onlyAdmin {
        require(msg.sender == owner || msg.sender == users["roberta"], "essa função só pode ser acessada por admins");
    }

    function updateUser(string codinome, adress user_addr) public onlyAdmin {
        require(codinome != "", "codinome não pode ser string vazia");
        users[codinome] = user_addr;
        votingOn();
    }

    function votingOn() public onlyAdmin{
        voting = true;
    }

    function votingOff() public onlyAdmin{
        voting = false;
    }

    function issueToken(string codinome, uint256 qtde_de_Turings) public onlyAdmin{
        _mint(users[codinome], qtde_de_Turings);
    }

    function vote(string codinome, uint256 qtde_de_Turings) public{
       require(voting == true, "a votação deve estar ativa");
       //require(users[msg.sender] != null, "usuário nao autorizado");
       require(msg.sender != users[codinome], "não se pode votar em si mesmo");
       require(qtde_de_Turings>0 && qtde_de_Turings<=2, "qtde_de_Turings deve ser maior que 0, e menor ou igual a 2");
       //Um mesmo usuário só pode votar uma vez em um mesmo codinome.
       _mint(users[codinome], qtde_de_Turings);
       //Além disso, você deverá implementar uma lógica de forma que a cada 10 vezes 
       // que um usuário votar, esse usuário receberá 1 Turing! 
    }
}