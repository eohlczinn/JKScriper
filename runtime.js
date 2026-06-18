// runtime.js
const readline = require('readline');

function criarRuntime() {
  const libs = {};

  libs.mostrar = (valor) => {
    console.log(valor);
    return valor;
  };

  libs.entrada = async (msg = "") => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      rl.question(msg, (resposta) => {
        rl.close();
        const num = Number(resposta);
        resolve(isNaN(num)? resposta : num);
      });
    });
  };

  libs.mate = {
    abs: Math.abs,
    max: Math.max,
    min: Math.min,
    pow: Math.pow,
    sqrt: Math.sqrt,
    arred: Math.round,
    piso: Math.floor,
    teto: Math.ceil,
    aleat: () => Math.random(),
    pi: Math.PI,
    e: Math.E
  };

  libs.tipo = (valor) => typeof valor;
  libs.tamanho = (valor) => valor.length;
  libs.string = (valor) => String(valor);
  libs.numero = (valor) => Number(valor);

  return libs;
}

module.exports = { criarRuntime };