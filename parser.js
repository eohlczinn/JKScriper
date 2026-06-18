class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  atual() {
    return this.tokens[this.pos];
  }

  avancar() {
    return this.tokens[this.pos++];
  }

  parse() {
    const body = [];
    while (this.atual()) {
      body.push(this.statement());
    }
    return { type: 'Program', body };
  }

  statement() {
    const token = this.atual();

    if (token.type === 'KEYWORD') {
      if (token.value === 'var') return this.varDecl();
      if (token.value === 'funcao') return this.funcDecl();
      if (token.value === 'se') return this.ifStmt();
      if (token.value === 'return') return this.returnStmt();
      if (token.value === 'mostrar') return this.mostrarStmt();
    }

    if (token.type === 'IDENTIFIER') {
      return this.chamada();
    }

    throw new Error(`Statement inválido: ${token.value}`);
  }

  varDecl() {
    this.avancar(); // var
    const nome = this.avancar().value;
    this.avancar(); // =
    const valor = this.binario();
    return { type: 'VariableDeclaration', name: nome, value: valor };
  }

  funcDecl() {
    this.avancar(); // funcao
    const nome = this.avancar().value;
    const params = [];
    while (this.atual() && this.atual().type === 'IDENTIFIER') {
      params.push(this.avancar().value);
    }
    this.avancar(); // {
    const body = [];
    while (this.atual() && this.atual().value!== '}') {
      body.push(this.statement());
    }
    this.avancar(); // }
    return { type: 'FunctionDeclaration', name: nome, params, body };
  }

  ifStmt() {
    this.avancar(); // se
    const test = this.binario();
    this.avancar(); // {
    const consequent = [];
    while (this.atual() && this.atual().value!== '}') {
      consequent.push(this.statement());
    }
    this.avancar(); // }

    let alternate = null;
    if (this.atual() && this.atual().value === 'senao') {
      this.avancar(); // senao
      this.avancar(); // {
      alternate = [];
      while (this.atual() && this.atual().value!== '}') {
        alternate.push(this.statement());
      }
      this.avancar(); // }
    }

    return { type: 'IfStatement', test, consequent, alternate };
  }

  returnStmt() {
    this.avancar(); // return
    const argument = this.binario();
    return { type: 'ReturnStatement', argument };
  }

  mostrarStmt() {
    this.avancar(); // mostrar
    const argument = this.binario();
    return { type: 'CallExpression', callee: 'mostrar', arguments: [argument] };
  }

  chamada() {
    const nome = this.avancar().value;
    const args = [];
    while (this.atual() &&
           this.atual().value!== '}' &&
           this.atual().value!== 'senao' &&
           (this.atual().type === 'NUMBER' ||
            this.atual().type === 'STRING' ||
            this.atual().type === 'IDENTIFIER')) {
      args.push(this.binario());
    }
    return { type: 'CallExpression', callee: nome, arguments: args };
  }

  binario() {
    let left = this.primario();

    while (this.atual() &&
           this.atual().type === 'OPERATOR' &&
           ['+', '-', '*', '/', '>', '<', '>=', '<=', '==', '!='].includes(this.atual().value)) {
      const op = this.avancar().value;
      const right = this.primario();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }

    return left;
  }

  primario() {
    const token = this.atual();

    if (token.type === 'NUMBER') {
      this.avancar();
      return { type: 'Literal', value: token.value };
    }

    if (token.type === 'STRING') {
      this.avancar();
      return { type: 'Literal', value: token.value };
    }

    if (token.value === 'true') {
      this.avancar();
      return { type: 'Literal', value: true };
    }
    if (token.value === 'false') {
      this.avancar();
      return { type: 'Literal', value: false };
    }
    if (token.value === 'null') {
      this.avancar();
      return { type: 'Literal', value: null };
    }

    if (token.type === 'IDENTIFIER') {
      let node = { type: 'Identifier', name: token.value };
      this.avancar();

      // Member expression: obj.prop
      while (this.atual() && this.atual().value === '.') {
        this.avancar();
        const property = this.avancar().value;
        node = {
          type: 'MemberExpression',
          object: node,
          property: { type: 'Identifier', name: property }
        };
      }

      // Call expression: só se tiver args depois
      const peek = this.atual();
      if (peek && (
        peek.type === 'NUMBER' ||
        peek.type === 'STRING' ||
        peek.type === 'IDENTIFIER'
      )) {
        const args = [];
        while (this.atual() && (
          this.atual().type === 'NUMBER' ||
          this.atual().type === 'STRING' ||
          this.atual().type === 'IDENTIFIER'
        )) {
          if (this.atual().type === 'KEYWORD' &&
              ['var', 'funcao', 'se', 'senao', 'return', 'mostrar'].includes(this.atual().value)) {
            break;
          }
          args.push(this.primario());
        }
        if (args.length > 0) {
          node = { type: 'CallExpression', callee: node, arguments: args };
        }
      }

      return node;
    }

    throw new Error(`Expressão inválida: ${token.value}`);
  }
}

function parse(tokens) {
  return new Parser(tokens).parse();
}

module.exports = { parse };