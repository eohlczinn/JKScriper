function tokenizar(codigo) {
  const tokens = [];
  let i = 0;

  while (i < codigo.length) {
    let char = codigo[i];

    // Pula espaços
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Comentário
    if (char === '/' && codigo[i + 1] === '/') {
      while (i < codigo.length && codigo[i]!== '\n') i++;
      continue;
    }

    // String
    if (char === '"') {
      i++;
      let str = '';
      while (i < codigo.length && codigo[i]!== '"') {
        str += codigo[i];
        i++;
      }
      i++;
      tokens.push({ type: 'STRING', value: str });
      continue;
    }

    // Número
    if (/[0-9]/.test(char)) {
      let num = '';
      while (i < codigo.length && /[0-9.]/.test(codigo[i])) {
        num += codigo[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(num) });
      continue;
    }

    // Identificador ou keyword
    if (/[a-zA-Z_]/.test(char)) {
      let id = '';
      while (i < codigo.length && /[a-zA-Z0-9_]/.test(codigo[i])) {
        id += codigo[i];
        i++;
      }

      const keywords = ['var', 'funcao', 'se', 'senao', 'return', 'mostrar', 'true', 'false', 'null'];
      if (keywords.includes(id)) {
        tokens.push({ type: 'KEYWORD', value: id });
      } else {
        tokens.push({ type: 'IDENTIFIER', value: id });
      }
      continue;
    }

    // Operadores de 2 chars
    const twoChar = codigo.substring(i, i + 2);
    if (['==', '!=', '>=', '<='].includes(twoChar)) {
      tokens.push({ type: 'OPERATOR', value: twoChar });
      i += 2;
      continue;
    }

    // Operadores de 1 char
    if ('+-*/><={}().'.includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char });
      i++;
      continue;
    }

    throw new Error(`Caractere inválido: ${char}`);
  }

  return tokens;
}

module.exports = { tokenizar };