const express = require("express");
const servidor_3 = express();

//middleware padrão
servidor_3.use(express.json());

//?estoque do servidor 3
const estoque = [
  { codProduto: 1, nome: "caesar salad",       quantidade: 10 },
  { codProduto: 2, nome: "hamburguer gourmet", quantidade: 8  },
  { codProduto: 3, nome: "onion rings",        quantidade: 5  },
  { codProduto: 4, nome: "Batata Frita",       quantidade: 20 },
  { codProduto: 5, nome: "coca-cola",          quantidade: 30 },
  { codProduto: 6, nome: "Suco de laranja",    quantidade: 12 },
  { codProduto: 7, nome: "Milkshake",          quantidade: 6  },
  { codProduto: 8, nome: "misto quente",       quantidade: 0  },
];

//*procura um produto no estoque pelo codigo
function buscarProduto(codProduto) {
  for (let i = 0; i < estoque.length; i++) {
    if (estoque[i].codProduto === codProduto) {
      return estoque[i];
    }
  }
}

//? GET /estoque -> devolve a situação do estoque todo
servidor_3.get("/estoque", function (req, res) {
  console.log("[Servidor 3] GET /estoque");

  const resposta = [];

  for (let i = 0; i < estoque.length; i++) {
    resposta.push({
      CodProduto: estoque[i].codProduto,
      Nome: estoque[i].nome,
      Estoque: estoque[i].quantidade,
    });
  }
  res.json(resposta);
});

//? POST /baixa -> recebe { "Itens": [ { "CodProduto": 1, "Qtd": 2 } ] } e desconta do estoque
servidor_3.post("/baixa", function (req, res) {
  console.log("[Servidor 3] POST /baixa");

  const itens = req.body.Itens;

  //?primeira passada: só olha se tem estoque de todos os itens (nao altera nada)
  for (let i = 0; i < itens.length; i++) {
    const produto = buscarProduto(itens[i].CodProduto);

    if (produto.quantidade < itens[i].Qtd) {
      return res.status(400).json({
        erro: "Estoque insuficiente para " + produto.nome +
              ". Pedido: " + itens[i].Qtd + ", disponivel: " + produto.quantidade + "."
      });
    }
  }

  //*segunda passada: só chega aqui se todos os itens tem estoque, entao desconta
  for (let i = 0; i < itens.length; i++) {
    const produto = buscarProduto(itens[i].CodProduto);
    produto.quantidade = produto.quantidade - itens[i].Qtd;
  }

  console.log("[Servidor 3] Baixa realizada.");
  res.json({ mensagem: "Baixa realizada com sucesso." });
});

//? POST /reposicao -> recebe o mesmo formato da baixa e soma no estoque
servidor_3.post("/reposicao", function (req, res) {
  console.log("[Servidor 3] POST /reposicao");

  const itens = req.body.Itens;

  for (let i = 0; i < itens.length; i++) {
    const produto = buscarProduto(itens[i].CodProduto);
    produto.quantidade = produto.quantidade + itens[i].Qtd;
  }

  res.json({ mensagem: "Reposicao realizada com sucesso." });
});

//!porta do servidor 3
servidor_3.listen(8080, () => {
  console.log("[Servidor 3] API de Estoque rodando em http://localhost:8080");
});
