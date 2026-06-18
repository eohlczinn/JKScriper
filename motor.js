// motor.js
const { Executor } = require('./executor.js');
const { criarRuntime } = require('./runtime.js');

class Motor {
  constructor() {
    this.executor = new Executor();
    Object.assign(this.executor.global, criarRuntime());
  }

  async rodar(ast) {
    // Passo 1: carrega var e funcao no global
    for (let stmt of ast.body) {
      if (stmt.type === "VariableDeclaration") {
        this.executor.global[stmt.name] = this.executor.avaliarExpr(stmt.value, this.executor.global);
      }
      if (stmt.type === "FunctionDeclaration") {
        this.executor.global[stmt.name] = {
          type: "function",
          params: stmt.params,
          body: stmt.body,
          closure: this.executor.global
        };
      }
    }

    // Passo 2: executa statements soltos
    for (let stmt of ast.body) {
      if (stmt.type === "ExpressionStatement" || stmt.type === "CallExpression" || stmt.type === "IfStatement") {
        this.executor.executarStmt(stmt, this.executor.global);
      }
    }
  }
}

async function rodar(ast) {
  const motor = new Motor();
  await motor.rodar(ast);
}

module.exports = { rodar };