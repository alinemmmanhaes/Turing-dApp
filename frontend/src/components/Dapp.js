import React from "react";

import { ethers } from "ethers";

// Artefatos gerados pelo scripts/deploy.js (ver abaixo)
import TuringArtifact from "../contracts/Turing.json";
import contractAddress from "../contracts/contract-address.json";

import { CODINOMES, STUDENTS, TEACHER } from "../users";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Vote } from "./Vote";
import { AdminPanel } from "./AdminPanel";
import { Ranking } from "./Ranking";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";

// Id padrão da rede Hardhat
const HARDHAT_NETWORK_ID = "31337";

// Códigos de "usuário rejeitou a transação" (MetaMask / ethers v5)
const USER_REJECTED_CODES = [4001, "ACTION_REJECTED"];

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      tokenData: undefined, // { name, symbol, decimals }
      selectedAddress: undefined,
      balance: undefined, // saldo do usuário conectado (BigNumber)
      myCodinome: null, // codinome do usuário conectado (null = não cadastrado)
      isAdmin: false, // owner ou professora
      voting: undefined, // votação ativa?
      ranking: undefined, // [{ codinome, balance, display }]
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
    };

    this.state = this.initialState;
  }

  render() {
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet
          connectWallet={() => this._connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    if (
      !this.state.tokenData ||
      !this.state.balance ||
      !this.state.ranking ||
      this.state.voting === undefined
    ) {
      return <Loading />;
    }

    const { tokenData, myCodinome, isAdmin, voting, ranking } = this.state;
    const busy = this.state.txBeingSent !== undefined;

    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1>
              {tokenData.name} ({tokenData.symbol})
            </h1>
            <p>
              Conta: <b>{this.state.selectedAddress}</b>
              <br />
              Usuário: <b>{myCodinome || "não cadastrado"}</b> | Perfil:{" "}
              <b>{isAdmin ? "Superusuário" : "Comum"}</b>
              <br />
              Votação: <b>{voting ? "ativa 🟢" : "pausada 🔴"}</b> | Seu saldo:{" "}
              <b>
                {this._fmt(this.state.balance)} {tokenData.symbol}
              </b>
            </p>
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-12">
            {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}

            {this.state.transactionError && (
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={() => this._dismissTransactionError()}
              />
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            {/* Votar: apenas usuários cadastrados (não pode votar em si mesmo) */}
            {myCodinome || isAdmin ? (
              <>
              {!myCodinome && (
                <div className="alert alert-info">
                  Esta conta de superusuário não está na tabela de usuários.
                  O contrato só aceita votos de contas cadastradas, então o
                  voto será recusado. Cadastre-a com updateUser ou use a conta
                  da professora.
                </div>
              )}
              <Vote
                candidates={STUDENTS.filter((c) => c !== myCodinome)}
                votingActive={voting}
                busy={busy}
                voteFor={(codinome, amount) =>
                  this._sendTx(() => this._token.vote(codinome, amount))
                }
              />
              </>
            ) : (
              <div className="alert alert-warning">
                Esta conta não está cadastrada no contrato, então não pode votar.
              </div>
            )}

            {/* Funções administrativas */}
            {isAdmin && (
              <AdminPanel
                students={STUDENTS}
                codinomes={CODINOMES}
                votingActive={voting}
                busy={busy}
                issueToken={(codinome, amount) =>
                  this._sendTx(() => this._token.issueToken(codinome, amount))
                }
                updateUser={(codinome, address) => {
                  if (!ethers.utils.isAddress(address)) {
                    this.setState({
                      transactionError: new Error("Endereço inválido."),
                    });
                    return;
                  }
                  this._sendTx(() =>
                    this._token.updateUser(codinome, address)
                  );
                }}
                votingOn={() => this._sendTx(() => this._token.votingOn())}
                votingOff={() => this._sendTx(() => this._token.votingOff())}
              />
            )}
          </div>

          <div className="col-md-6">
            <Ranking ranking={ranking} />
          </div>
        </div>
      </div>
    );
  }

  componentWillUnmount() {
    this._stopPollingData();
  }

  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    await this._checkNetwork();

    this._initialize(selectedAddress);

    // Registra o listener uma única vez (evita acumular a cada conexão)
    if (!this._accountsListenerSet) {
      this._accountsListenerSet = true;
      window.ethereum.on("accountsChanged", ([newAddress]) => {
        this._stopPollingData();
        if (newAddress === undefined) {
          return this._resetState();
        }
        this._initialize(newAddress);
      });
    }
  }

  _initialize(userAddress) {
    // Limpa dados da conta anterior; o Loading aparece até a 1ª leitura
    this.setState({
      selectedAddress: userAddress,
      balance: undefined,
      myCodinome: null,
      isAdmin: false,
      ranking: undefined,
    });

    this._initializeEthers();
    this._getTokenData();
    this._startPollingData();
  }

  _initializeEthers() {
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    this._token = new ethers.Contract(
      contractAddress.Turing,
      TuringArtifact.abi,
      this._provider.getSigner(0)
    );
  }

  // Ranking via polling no balanceOf() (opção (i) do enunciado)
  _startPollingData() {
    this._stopPollingData();
    this._pollDataInterval = setInterval(() => this._updateData(), 1000);
    this._updateData();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _getTokenData() {
    const name = await this._token.name();
    const symbol = await this._token.symbol();
    const decimals = await this._token.decimals();

    this.setState({ tokenData: { name, symbol, decimals } });
  }

  // Lê do contrato: perfil do usuário, status da votação, saldos e ranking
  async _updateData() {
    const token = this._token;
    const account = this.state.selectedAddress;
    if (!token || !account) return;

    try {
      const [owner, voting, balance, ...addrs] = await Promise.all([
        token.owner(),
        token.voting(),
        token.balanceOf(account),
        ...CODINOMES.map((c) => token.users(c)),
      ]);

      const addrByName = {};
      CODINOMES.forEach((c, i) => {
        addrByName[c] = addrs[i];
      });

      const me = account.toLowerCase();
      const myCodinome =
        CODINOMES.find((c) => addrByName[c].toLowerCase() === me) || null;
      const isAdmin =
        owner.toLowerCase() === me ||
        addrByName[TEACHER].toLowerCase() === me;

      const balances = await Promise.all(
        STUDENTS.map((c) => token.balanceOf(addrByName[c]))
      );

      // Se a conta mudou durante as leituras, descarta o resultado antigo
      if (account !== this.state.selectedAddress) return;

      const ranking = STUDENTS.map((codinome, i) => ({
        codinome,
        balance: balances[i],
      }))
        .sort((a, b) =>
          b.balance.gt(a.balance)
            ? 1
            : b.balance.lt(a.balance)
            ? -1
            : a.codinome.localeCompare(b.codinome)
        )
        .map((r) => ({ ...r, display: this._fmt(r.balance) }));

      this.setState({ voting, balance, myCodinome, isAdmin, ranking });
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
    }
  }

  // O contrato usa decimals() = 18 (padrão ERC20) e multiplica por 10**18 ao
  // emitir; aqui convertemos de volta para Turings inteiros.
  _fmt(bn) {
    const s = ethers.utils.formatUnits(bn, this.state.tokenData.decimals);
    return s.endsWith(".0") ? s.slice(0, -2) : s;
  }

  // Envia uma transação qualquer (vote, issueToken, votingOn, votingOff)
  async _sendTx(call) {
    try {
      this._dismissTransactionError();

      const tx = await call();
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      await this._updateData();
    } catch (error) {
      if (USER_REJECTED_CODES.includes(error.code)) {
        return;
      }
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // Extrai o motivo do require() do contrato, ex.: "voce ja votou neste codinome".
  // A MetaMask costuma embrulhar o erro em "Internal JSON-RPC error.", então
  // procuramos o motivo em qualquer parte do objeto de erro.
  _getRpcErrorMessage(error) {
    const reasonRegex = /reverted with reason string '([^']*)'/;

    let dump = "";
    try {
      dump = JSON.stringify(error, Object.getOwnPropertyNames(error));
    } catch (e) {
      dump = "";
    }
    const found = dump.match(reasonRegex);
    if (found) return found[1];

    const raw =
      (error.data && error.data.message) ||
      (error.error && error.error.message) ||
      error.reason ||
      error.message ||
      "";
    const match = raw.match(reasonRegex);
    if (match) return match[1];

    if (raw.includes("Internal JSON-RPC error")) {
      return (
        raw +
        " (abra o console do navegador, F12, para ver o erro completo; " +
        "confira também o endereço do contrato e o nonce da MetaMask)"
      );
    }
    return raw;
  }

  _resetState() {
    this.setState(this.initialState);
  }

  async _switchChain() {
    // (o exemplo original usava "31337".toString(16), que gera um chainId errado)
    const chainIdHex = `0x${Number(HARDHAT_NETWORK_ID).toString(16)}`;
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  }

  async _checkNetwork() {
    if (window.ethereum.networkVersion !== HARDHAT_NETWORK_ID) {
      try {
        await this._switchChain();
      } catch (error) {
        this.setState({
          networkError: "Conecte a MetaMask à rede Localhost:8545 (chain id 31337).",
        });
      }
    }
  }
}