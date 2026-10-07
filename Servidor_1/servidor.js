const express = require("express");
const servidor_1 = express();

//servidot estatico, o public fica todos os arquivos html 
servidor_1.use(express.static(__dirname + "/public"));

//!porta do servidor 1
servidor_1.listen(3001, () => {
  console.log("[Servidor 1] Paginas rodando em http://localhost:3001");
});
