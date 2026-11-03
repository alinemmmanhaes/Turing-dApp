import React from "react";

export function Ranking({ ranking }) {
  return (
    <div className="mb-4">
      <h4>Ranking</h4>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>#</th>
            <th>Codinome</th>
            <th>Turings</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.codinome}>
              <td>{i + 1}</td>
              <td>{r.codinome}</td>
              <td>
                <b>{r.display}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}