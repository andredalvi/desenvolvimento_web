const express = require("express");
const cors = require("cors");
const servidor_2 = express();

//middleware padrão
servidor_2.use(express.json());
//libera a pagina (porta 3001) para chamar este servidor
servidor_2.use(cors());

//?produtos com preço (o estoque fica no servidor 3)
const produtos = [
  { CodProduto: 1, Nome: "caesar salad",       Preco: 24 },
  { CodProduto: 2, Nome: "hamburguer gourmet", Preco: 32 },
  { CodProduto: 3, Nome: "onion rings",        Preco: 18 },
  { CodProduto: 4, Nome: "Batata Frita",       Preco: 15 },
  { CodProduto: 5, Nome: "coca-cola",          Preco: 7  },
  { CodProduto: 6, Nome: "Suco de laranja",    Preco: 11 },
  { CodProduto: 7, Nome: "Milkshake",          Preco: 16 },
  { CodProduto: 8, Nome: "misto quente",       Preco: 13 },
];

//?pedidos abertos
const pedidos = [];
let proximoNumero = 1;

//*procura um produto pelo codigo
function buscarProduto(codProduto) {
  for (let i = 0; i < produtos.length; i++) {
    if (produtos[i].CodProduto === codProduto) {
      return produtos[i];
    }
  }
}

//? GET /produtos -> junta nome e preço daqui com o estoque do servidor 3
servidor_2.get("/produtos", async (requisicao, resposta) => {
  console.log("[Servidor 2] GET /produtos");

  try {
    const respostaEstoque = await fetch("http://localhost:8080/estoque");
    const estoque = await respostaEstoque.json();

    const lista = [];

    for (let i = 0; i < produtos.length; i++) {
      //procura o estoque deste produto na lista que veio do servidor 3
      let quantidade = 0;
      for (let j = 0; j < estoque.length; j++) {
        if (estoque[j].CodProduto === produtos[i].CodProduto) {
          quantidade = estoque[j].Estoque;
        }
      }

      lista.push({
        CodProduto: produtos[i].CodProduto,
        Nome: produtos[i].Nome,
        Preco: produtos[i].Preco,
        Estoque: quantidade,
      });
    }

    resposta.json(lista);
  }
  catch (erro) {
    //!cai aqui se o servidor 3 estiver fora do ar
    resposta.status(500).json({ erro: "Servidor de estoque fora do ar." });
  }
});

//? POST /pedidos -> recebe { "NomeCliente": "...", "Itens": [ { "CodProduto": 1, "Qtd": 2 } ] }
servidor_2.post("/pedidos", async (requisicao, resposta) => {
  console.log("[Servidor 2] POST /pedidos");

  const nomeCliente = requisicao.body.NomeCliente;
  const itens = requisicao.body.Itens;

  if (itens.length === 0) {
    return resposta.status(400).json({ erro: "Escolha pelo menos um item." });
  }

  //*monta os itens do pedido com nome e preço e calcula o total aqui no servidor
  const itensPedido = [];
  let total = 0;

  for (let i = 0; i < itens.length; i++) {
    const produto = buscarProduto(itens[i].CodProduto);

    itensPedido.push({
      CodProduto: produto.CodProduto,
      Nome: produto.Nome,
      Preco: produto.Preco,
      Qtd: itens[i].Qtd,
    });

    total = total + produto.Preco * itens[i].Qtd;
  }

  //*pede para o servidor 3 dar baixa no estoque
  try {
    const respostaBaixa = await fetch("http://localhost:8080/baixa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Itens: itens }),
    });
    const dados = await respostaBaixa.json();

    //se o servidor 3 recusou (ex: falta de estoque), devolve o erro dele
    if (respostaBaixa.status !== 200) {
      return resposta.status(400).json(dados);
    }
  }
  catch (erro) {
    //!cai aqui se o servidor 3 estiver fora do ar
    return resposta.status(500).json({ erro: "Servidor de estoque fora do ar." });
  }

  //*só registra o pedido depois que a baixa deu certo
  const pedido = {
    Numero: proximoNumero,
    NomeCliente: nomeCliente,
    Itens: itensPedido,
    Total: total,
  };
  proximoNumero++;
  pedidos.push(pedido);

  resposta.status(201).json(pedido);
});

//? POST /reposicao -> recebe { "Itens": [ { "CodProduto": 1, "Qtd": 5 } ] } e repassa para o servidor 3
servidor_2.post("/reposicao", async (requisicao, resposta) => {
  console.log("[Servidor 2] POST /reposicao");

  try {
    const respostaReposicao = await fetch("http://localhost:8080/reposicao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Itens: requisicao.body.Itens }),
    });
    const dados = await respostaReposicao.json();

    resposta.json(dados);
  }
  catch (erro) {
    //!cai aqui se o servidor 3 estiver fora do ar
    resposta.status(500).json({ erro: "Servidor de estoque fora do ar." });
  }
});

//? GET /pedidos -> lista os pedidos abertos
servidor_2.get("/pedidos", (requisicao, resposta) => {
  console.log("[Servidor 2] GET /pedidos");
  resposta.json(pedidos);
});

//? POST /pedidos/:id/fechar -> fecha o pedido e tira da lista
servidor_2.post("/pedidos/:id/fechar", (requisicao, resposta) => {
  console.log("[Servidor 2] POST /pedidos/" + requisicao.params.id + "/fechar");

  const numero = Number(requisicao.params.id);

  for (let i = 0; i < pedidos.length; i++) {
    if (pedidos[i].Numero === numero) {
      //splice(i, 1) remove 1 item na posição i
      pedidos.splice(i, 1);
      return resposta.json({ mensagem: "Pedido " + numero + " fechado." });
    }
  }

  resposta.status(404).json({ erro: "Pedido " + numero + " nao encontrado." });
});

//!porta do servidor 2
servidor_2.listen(3002, () => {
  console.log("[Servidor 2] API de Pedidos rodando em http://localhost:3002");
});
