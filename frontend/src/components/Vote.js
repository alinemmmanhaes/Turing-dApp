import React from "react";

export function Vote({ candidates, voteFor, votingActive, busy }) {
  return (
    <div className="mb-4">
      <h4>Votar</h4>
      {!votingActive && (
        <div className="alert alert-warning">A votação está pausada.</div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.target);
          const codinome = formData.get("codinome");
          const amount = formData.get("amount");
          if (codinome && amount) {
            voteFor(codinome, amount);
          }
        }}
      >
        <div className="form-group">
          <label>Aluno</label>
          <select className="form-control" name="codinome" required>
            {candidates.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Quantidade de Turings (1 ou 2)</label>
          <input
            className="form-control"
            type="number"
            name="amount"
            min="1"
            max="2"
            step="1"
            defaultValue="1"
            required
          />
        </div>
        <div className="form-group">
          <input
            className="btn btn-primary"
            type="submit"
            value="Enviar voto"
            disabled={busy || !votingActive}
          />
        </div>
      </form>
    </div>
  );
}