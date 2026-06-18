class Executor {
    constructor() {
        this.escopos = [new Map()];
        this.funcoes = new Map();
    }

    async rodar(ast) {
        for (const stmt of ast.body) {
            await this.executarStmt(stmt);
        }
    }

    async executarStmt(stmt) {
        switch (stmt.type) {
            case 'VariableDeclaration':
                const valor = await this.avaliarExpr(stmt.value);
                this.setVar(stmt.name, valor);
                break;

            case 'FunctionDeclaration':
                this.funcoes.set(stmt.name, stmt);
                break;

            case 'IfStatement':
                const cond = await this.avaliarExpr(stmt.test);
                if (cond) {
                    for (const s of stmt.consequent) {
                        await this.executarStmt(s);
                    }
                } else if (stmt.alternate) {
                    for (const s of stmt.alternate) {
                        await this.executarStmt(s);
                    }
                }
                break;

            case 'ReturnStatement':
                const ret = await this.avaliarExpr(stmt.argument);
                throw { __return: ret };

            case 'CallExpression':
                await this.chamarFuncao(stmt);
                break;

            default:
                throw new Error(`Statement desconhecido: ${stmt.type}`);
        }
    }

    async avaliarExpr(expr) {
        if (!expr) return undefined;

        switch (expr.type) {
            case 'Literal':
                return expr.value;

            case 'Identifier':
                return this.getVar(expr.name);

            case 'BinaryExpression':
                const left = await this.avaliarExpr(expr.left);
                const right = await this.avaliarExpr(expr.right);
                return this.operar(expr.operator, left, right);

            case 'MemberExpression':
                const obj = await this.avaliarExpr(expr.object);
                const prop = expr.property.name;
                if (obj && prop in obj) {
                    return obj[prop];
                }
                throw new Error(`Propriedade não encontrada: ${prop}`);

            case 'CallExpression':
                return await this.chamarFuncao(expr);

            default:
                throw new Error(`Expressão desconhecida: ${expr.type}`);
        }
    }

    async chamarFuncao(callExpr) {
        const args = [];
        for (const arg of callExpr.arguments) {
            args.push(await this.avaliarExpr(arg));
        }
        if (nome === 'mostrarImagem') {
            const caminho = args[0];
            console.log(`🖼️ Abrindo imagem: ${caminho}`);
            // No Windows abre a imagem no visualizador padrão
            const { exec } = require('child_process');
            exec(`start "" "${caminho}"`);
            return;
        }
        // mostrar é builtin
        if (callExpr.callee === 'mostrar') {
            console.log(...args);
            return;
        }

        // Se callee é string: função do usuário
        if (typeof callExpr.callee === 'string') {
            const fn = this.funcoes.get(callExpr.callee);
            if (!fn) throw new Error(`Função não definida: ${callExpr.callee}`);
            return await this.executarFuncao(fn, args);
        }

        // Se callee é Identifier ou MemberExpression
        const callee = await this.avaliarExpr(callExpr.callee);

        if (typeof callee === 'function') {
            return callee(...args);
        }

        if (callee && callee.type === 'FunctionDeclaration') {
            return await this.executarFuncao(callee, args);
        }

        throw new Error(`Não é uma função`);
    }

    async executarFuncao(fn, args) {
        const novoEscopo = new Map();
        for (let i = 0; i < fn.params.length; i++) {
            novoEscopo.set(fn.params[i], args[i]);
        }

        this.escopos.push(novoEscopo);

        try {
            for (const stmt of fn.body) {
                await this.executarStmt(stmt);
            }
        } catch (e) {
            if (e.__return !== undefined) {
                this.escopos.pop();
                return e.__return;
            }
            throw e;
        }

        this.escopos.pop();
    }

    operar(op, a, b) {
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return a / b;
            case '>': return a > b;
            case '<': return a < b;
            case '>=': return a >= b;
            case '<=': return a <= b;
            case '==': return a == b;
            case '!=': return a != b;
            default: throw new Error(`Operador desconhecido: ${op}`);
        }
    }

    setVar(nome, valor) {
        this.escopos[this.escopos.length - 1].set(nome, valor);
    }
    getVar(nome) {
        // Procura nos escopos de variáveis
        for (let i = this.escopos.length - 1; i >= 0; i--) {
            if (this.escopos[i].has(nome)) {
                return this.escopos[i].get(nome);
            }
        }

        // NOVO: Procura nas funções também
        if (this.funcoes.has(nome)) {
            return this.funcoes.get(nome);
        }

        // Builtins
        if (nome === 'mate') return this.getMate();

        throw new Error(`Variável não definida: ${nome}`);
    }
    async chamarFuncao(callExpr) {
        let fn;
        const args = [];

        for (const arg of callExpr.arguments) {
            args.push(await this.avaliarExpr(arg));
        }

        // Se callee é string: função normal ou builtin
        if (typeof callExpr.callee === 'string') {
            const nome = callExpr.callee;

            if (nome === 'mostrar') {
                console.log(...args);
                return;
            }

            fn = this.getVar(nome); // <- usa getVar que já checa funcoes
            if (!fn) throw new Error(`Função não definida: ${nome}`);

        } else if (callExpr.callee.type === 'Identifier') {
            fn = this.getVar(callExpr.callee.name);
            if (!fn) throw new Error(`Função não definida: ${callExpr.callee.name}`);

        } else if (callExpr.callee.type === 'MemberExpression') {
            // mate.max
            const obj = await this.avaliarExpr(callExpr.callee.object);
            const prop = callExpr.callee.property.name;
            fn = obj[prop];
            if (typeof fn !== 'function') throw new Error(`${prop} não é uma função`);
            return fn(...args);
        } else {
            throw new Error(`Callee inválido`);
        }

        // Executa função definida pelo usuário
        if (fn.type === 'FunctionDeclaration') {
            const escopoAnterior = this.escopos[this.escopos.length - 1];
            const novoEscopo = new Map();

            for (let i = 0; i < fn.params.length; i++) {
                novoEscopo.set(fn.params[i], args[i]);
            }

            this.escopos.push(novoEscopo);

            try {
                for (const stmt of fn.body) {
                    await this.executarStmt(stmt);
                }
            } catch (e) {
                if (e.__return !== undefined) {
                    this.escopos.pop();
                    return e.__return;
                }
                throw e;
            }

            this.escopos.pop();
            return undefined;
        }

        // Se for função JS nativa
        if (typeof fn === 'function') {
            return fn(...args);
        }

        throw new Error(`${fn} não é uma função`);
    }

    getMate() {
        return {
            pi: Math.PI,
            max: Math.max,
            min: Math.min,
            abs: Math.abs,
            sqrt: Math.sqrt,
            pow: Math.pow,
            random: Math.random,
            floor: Math.floor,
            ceil: Math.ceil,
            round: Math.round,
            logo: "assets/logo.jpg"
        };
    }
}

module.exports = { Executor };