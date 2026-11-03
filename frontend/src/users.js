// Codinomes cadastrados no construtor do contrato Turing.
// IMPORTANTE: mantenha exatamente igual ao construtor do contrato.
// Os endereços NÃO ficam aqui: o dApp os lê do contrato (mapping users).
export const TEACHER = "roberta";

export const CODINOMES = [TEACHER, "nome1", "nome2", "nome3", "nome4", "nome5"];

// Alunos = todos menos a professora (ela não aparece nos selects nem no ranking)
export const STUDENTS = CODINOMES.filter((c) => c !== TEACHER);