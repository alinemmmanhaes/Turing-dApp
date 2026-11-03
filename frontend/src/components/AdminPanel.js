import React from "react";

export function AdminPanel({
  students,
  codinomes,
  issueToken,
  updateUser,
  votingOn,
  votingOff,
  votingActive,
  busy,
}) {
  return (
    <div className="card border-danger mb-4">
      <div className="card-header bg-danger text-white">
        Painel do superusuário
      </div>
      <div className="card-body">
        <h5>Emitir Turings</h5>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const codinome = formData.get("codinome");
            const amount = formData.get("amount");
            if (codinome && amount) {
              issueToken(codinome, amount);
            }
          }}
        >
          <div className="form-group">
            <label>Aluno</label>
            <select className="form-control" name="codinome" required>
              {students.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Quantidade de Turings</label>
            <input
              className="form-control"
              type="number"
              name="amount"
              min="1"
              step="1"
              defaultValue="5"
              required
            />
          </div>
          <input
            className="btn btn-danger"
            type="submit"
            value="Emitir"
            disabled={busy}
          />
        </form>

        <hr />

        <h5>Atualizar usuário</h5>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const codinome = (formData.get("codinome") || "").trim();
            const address = (formData.get("address") || "").trim();
            if (codinome && address) {
              updateUser(codinome, address);
            }
          }}
        >
          <div className="form-group">
            <label>Codinome</label>
            <input
              className="form-control"
              type="text"
              name="codinome"
              list="codinomes-list"
              placeholder="ex.: nome1"
              required
            />
            <datalist id="codinomes-list">
              {codinomes.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label>Novo endereço</label>
            <input
              className="form-control"
              type="text"
              name="address"
              placeholder="0x..."
              required
            />
          </div>
          <input
            className="btn btn-danger"
            type="submit"
            value="Atualizar usuário"
            disabled={busy}
          />
        </form>

        <hr />

        <h5>Votação: {votingActive ? "ativa 🟢" : "pausada 🔴"}</h5>
        <button
          className="btn btn-success mr-2"
          onClick={votingOn}
          disabled={busy || votingActive}
        >
          Ativar votação
        </button>
        <button
          className="btn btn-secondary"
          onClick={votingOff}
          disabled={busy || !votingActive}
        >
          Pausar votação
        </button>
      </div>
    </div>
  );
}