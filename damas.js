 const SIZE = 8;                 // Tamanho do tabuleiro (8x8)
    let board = [];                 // Matriz que armazena as peças
    let selected = null;            // Posição da peça selecionada
    let currentPlayer = "red";      // Jogador da vez
    let pontos = { red:0, black:0 };// Contador de peças comidas

    const boardEl = document.getElementById("board");

    // ====== CRIA O TABULEIRO ======
    function createBoard() {
      boardEl.innerHTML = "";       // Limpa o tabuleiro na tela
      board = [];                   // Reinicia matriz
      pontos = { red:0, black:0 };  // Zera placar
      selected = null;
      currentPlayer = "red";        // Vermelho sempre começa
      updatePlacar();

      // Criar casas do tabuleiro
      for(let r=0; r<SIZE; r++){
        let row = [];
        for(let c=0; c<SIZE; c++){
          const cell = document.createElement("div");
          cell.className = "cell " + ((r+c)%2===0 ? "light":"dark");
          cell.dataset.row = r;
          cell.dataset.col = c;

          // Evento de clique (PC) e toque (celular)
          cell.addEventListener("click",()=>handleClick(r,c));
          cell.addEventListener("touchstart",()=>handleClick(r,c));

          // Colocar peças iniciais
          if((r+c)%2===1){
            if(r<3){
              cell.appendChild(createPiece("black")); // Pretas em cima
              row.push("black");
            } else if(r>4){
              cell.appendChild(createPiece("red"));   // Vermelhas em baixo
              row.push("red");
            } else row.push(null);
          } else row.push(null);

          boardEl.appendChild(cell);
        }
        board.push(row);
      }
    }

    // ====== CRIA UMA PEÇA ======
    function createPiece(color){
      const piece = document.createElement("div");
      piece.className = "piece " + color;
      if(color.includes("king")) piece.classList.add("king");
      return piece;
    }

    // ====== SELECIONAR OU MOVER PEÇA ======
    function handleClick(r,c){
      const cellValue = board[r][c];
      if(cellValue && cellValue.startsWith(currentPlayer)){
        // Seleciona a peça do jogador
        clearSelection();
        selected = {r,c};
        getCell(r,c).classList.add("selected");
      } 
      else if(!cellValue && selected){
        // Move peça selecionada
        movePiece(selected.r, selected.c, r, c);
      }
    }

    // ====== MOVIMENTO DE PEÇA ======
    function movePiece(r1,c1,r2,c2){
      let piece = board[r1][c1];
      if(!isValidMove(r1,c1,r2,c2,piece)) return;

      // Se for captura (pular por cima de uma peça inimiga)
      if(Math.abs(r2-r1)===2 && Math.abs(c2-c1)===2){
        const midRow = (r1+r2)/2;
        const midCol = (c1+c2)/2;
        board[midRow][midCol] = null;
        pontos[currentPlayer]++;
        updatePlacar();
      }

      // Move peça para nova posição
      board[r1][c1] = null;
      board[r2][c2] = piece;

      // Transformar em Dama (King)
      if(piece==="red" && r2===0) board[r2][c2]="red-king";
      if(piece==="black" && r2===SIZE-1) board[r2][c2]="black-king";

      redrawBoard();

      // Caso ainda tenha captura obrigatória
      if(Math.abs(r2-r1)===2){
        selected = {r:r2, c:c2};
        getCell(r2,c2).classList.add("selected");
        if(temCaptura(r2,c2, board[r2][c2])) return;
      }

      // Alterna turno
      selected = null;
      currentPlayer = currentPlayer==="red" ? "black" : "red";
      updatePlacar();
      checkGameOver();
    }

    // ====== VALIDA SE O MOVIMENTO É PERMITIDO ======
    function isValidMove(r1,c1,r2,c2,piece){
      if(board[r2][c2]) return false; // Casa já ocupada
      const isKing = piece.includes("king");
      const dir = piece.startsWith("red")?-1:1;

      // Movimento normal (não dama)
      if(!isKing){
        if(Math.abs(c1-c2)===1 && r2-r1===dir) return true;
        if(Math.abs(c1-c2)===2 && r2-r1===dir*2){
          const midRow = (r1+r2)/2;
          const midCol = (c1+c2)/2;
          if(board[midRow][midCol] && !board[midRow][midCol].startsWith(piece.split("-")[0])) return true;
        }
        return false;
      }

      // Movimento da Dama (King)
      if(isKing){
        if(Math.abs(r2-r1) === Math.abs(c2-c1)){
          let stepR = (r2 > r1 ? 1 : -1);
          let stepC = (c2 > c1 ? 1 : -1);
          let r = r1 + stepR, c = c1 + stepC;
          let enemyFound = false;

          while(r !== r2 && c !== c2){
            if(board[r][c]){
              if(board[r][c].startsWith(piece.split("-")[0])){
                return false; // Encontrou peça do mesmo time
              } else {
                if(enemyFound) return false;
                enemyFound = true; // Encontrou inimigo
              }
            }
            r += stepR;
            c += stepC;
          }
          return true;
        }
      }
      return false;
    }

    // ====== CHECA SE HÁ CAPTURA OBRIGATÓRIA ======
    function temCaptura(r, c, piece) {
      const isKing = piece.includes("king");
      const dirs = isKing 
        ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] 
        : (piece.startsWith("red") ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]]);

      for (const [dr, dc] of dirs) {
        const midR = r + dr;
        const midC = c + dc;
        const endR = r + dr * 2;
        const endC = c + dc * 2;

        if (endR >= 0 && endR < SIZE && endC >= 0 && endC < SIZE) {
          if (board[midR][midC] && !board[midR][midC].startsWith(piece.split("-")[0]) && !board[endR][endC]) {
            return true;
          }
        }
      }
      return false;
    }

    // ====== FUNÇÕES AUXILIARES ======
    function getCell(r,c){ return boardEl.children[r*SIZE+c]; }

    function redrawBoard(){
      for(let r=0;r<SIZE;r++){
        for(let c=0;c<SIZE;c++){
          const cell = getCell(r,c);
          cell.innerHTML="";
          cell.classList.remove("selected");
          if(board[r][c]) cell.appendChild(createPiece(board[r][c]));
        }
      }
    }

    function clearSelection(){
      for(let i=0;i<boardEl.children.length;i++) boardEl.children[i].classList.remove("selected");
    }

    function reiniciar(){ createBoard(); }

    function updatePlacar(){
      document.getElementById("pontosRed").innerText = pontos.red;
      document.getElementById("pontosBlack").innerText = pontos.black;
      const turnoEl = document.getElementById("turno");
      turnoEl.innerText = currentPlayer === "red" ? "Vez de: Vermelho " : "Vez de: Preto ";
    }

    function checkGameOver(){
      let redExists = board.flat().some(p => p && p.startsWith("red"));
      let blackExists = board.flat().some(p => p && p.startsWith("black"));
      if(!redExists) alert("Preto venceu!");
      if(!blackExists) alert("Vermelho venceu!");
    }

    // Inicia o jogo ao carregar a página
    createBoard();
