const fs = require('fs');
const { Executor } = require('./executor.js');
const { tokenizar } = require('./lexer.js');
const { parse } = require('./parser.js');

async function executarString(codigo) {
  const tokens = tokenizar(codigo);
  const ast = parse(tokens);
  const executor = new Executor();
  await executor.rodar(ast);
}

const arquivo = process.argv[2];

if (arquivo) {
  const codigo = fs.readFileSync(arquivo, 'utf8');
  executarString(codigo);
} else {
  console.log('Nenhum arquivo passado. Rodando exemplo inline...\n');

  const codigoExemplo = `
var idade = 18
var nome = "JLScript"
mostrar "Bem vindo ao " + nome
se idade > 17 {
  mostrar "Maior de idade"
} senao {
  mostrar "Menor de idade"
}
funcao quadrado x {
  return x * x
}
mostrar "Quadrado de 7: " + quadrado 7
mostrar "PI = " + mate.pi
mostrar "Max: " + mate.max 10 20
`;

  executarString(codigoExemplo);
}