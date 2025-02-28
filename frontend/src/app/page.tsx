"use client"; // ✅ Required for Next.js 15

import { useEffect, useState } from "react";
import io from "socket.io-client";
import { motion } from "framer-motion";

const socket = io("http://localhost:5001");

export default function Home() {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isPlayingAI, setIsPlayingAI] = useState(false);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [isDraw, setIsDraw] = useState(false);

  useEffect(() => {
    socket.on("boardUpdate", ({ board, isXTurn }) => {
      setBoard(board);
      setIsXTurn(isXTurn);
      checkGameState(board);
    });
  }, []);

  useEffect(() => {
    if (isPlayingAI && difficulty && !isXTurn && !winner) {
      const bestMove = getBestMove(board);
      if (bestMove !== -1) {
        setTimeout(() => {
          handleClick(bestMove, true);
        }, 500);
      }
    }
  }, [isXTurn, isPlayingAI, difficulty, board]);

  const checkGameState = (board: (string | null)[]) => {
    const result = checkWinner(board);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
    } else if (board.every((cell) => cell !== null)) {
      handleDraw();
    }
  };

  const handleClick = (index: number, isAI = false) => {
    if (board[index] || winner || isDraw || (isPlayingAI && !isAI && !isXTurn)) return;

    const newBoard = [...board];
    newBoard[index] = isXTurn ? "X" : "O";
    setBoard(newBoard);
    setIsXTurn(!isXTurn);

    checkGameState(newBoard);
    socket.emit("move", { index });
  };

  const handleDraw = () => {
    setIsDraw(true);
    setTimeout(() => {
      resetGame();
    }, 3000);
  };

  const checkWinner = (board: (string | null)[]) => {
    const winningCombos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], 
      [0, 3, 6], [1, 4, 7], [2, 5, 8], 
      [0, 4, 8], [2, 4, 6] 
    ];
    for (let line of winningCombos) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line };
      }
    }
    return null;
  };

  const getBestMove = (board: (string | null)[]) => {
    if (difficulty === "Easy") {
      const emptyCells = board.map((cell, index) => (cell === null ? index : null)).filter((i) => i !== null);
      return emptyCells.length ? emptyCells[Math.floor(Math.random() * emptyCells.length)] as number : -1;
    }

    if (difficulty === "Medium") {
      return minimax(board, 0, false, -Infinity, Infinity).index;
    }

    return minimax(board, 0, true, -Infinity, Infinity).index; 
  };

  const minimax = (board: (string | null)[], depth: number, isMaximizing: boolean, alpha: number, beta: number) => {
    const result = checkWinner(board);
    if (result) return { score: result.winner === "O" ? 10 - depth : -10 + depth, index: -1 };
    if (board.every((cell) => cell !== null)) return { score: 0, index: -1 };

    let bestMove = isMaximizing ? { score: -Infinity, index: -1 } : { score: Infinity, index: -1 };

    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = isMaximizing ? "O" : "X";
        const move = minimax(board, depth + 1, !isMaximizing, alpha, beta);
        board[i] = null;

        if (isMaximizing) {
          if (move.score > bestMove.score) bestMove = { score: move.score, index: i };
          alpha = Math.max(alpha, move.score);
        } else {
          if (move.score < bestMove.score) bestMove = { score: move.score, index: i };
          beta = Math.min(beta, move.score);
        }
        if (beta <= alpha) break;
      }
    }

    return bestMove;
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine(null);
    setIsDraw(false);
    setDifficulty(null);
    socket.emit("reset");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-8 text-red-500">Tic Tac Toe</h1>

      {/* Game Mode Selection */}
      <div className="mb-4 flex gap-4">
        <button
          className={`px-4 py-2 rounded-lg ${!isPlayingAI ? "bg-blue-600" : "bg-gray-600"} hover:bg-blue-800`}
          onClick={() => {
            setIsPlayingAI(false);
            setDifficulty(null);
            resetGame();
          }}
        >
          Play vs Player
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${isPlayingAI ? "bg-blue-600" : "bg-gray-600"} hover:bg-blue-800`}
          onClick={() => {
            setIsPlayingAI(true);
            setDifficulty(null);
            resetGame();
          }}
        >
          Play vs AI
        </button>
      </div>

      {/* Difficulty Selection */}
      {isPlayingAI && difficulty === null && (
        <div className="mb-4">
          <label className="mr-4">Select AI Difficulty:</label>
          <select
            className="px-4 py-2 bg-gray-800 text-white rounded-lg"
            value={difficulty || ""}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">--Select--</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      )}

      {/* Game Board */}
      {(difficulty !== null || !isPlayingAI) && (
        <motion.div 
          className="grid grid-cols-3 gap-4 bg-gray-700 p-6 rounded-lg shadow-lg"
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5 }}
        >
          {board.map((cell, index) => (
            <motion.button
              key={index}
              className={`w-24 h-24 flex items-center justify-center text-7xl font-extrabold border-2 border-gray-400 rounded-md transition-all duration-300 bg-gray-800 hover:bg-gray-600 ${
                winningLine?.includes(index) ? "bg-green-500 text-white" : ""
              }`}
              onClick={() => handleClick(index)}
            >
              {cell}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Winner & Draw Message */}
      {winner && <p className="mt-4 text-3xl text-green-400">🎉 Winner: {winner} 🎉</p>}
      {isDraw && <p className="mt-4 text-3xl text-yellow-400">😔 Better luck next time!</p>}

      {/* Restart Button */}
      <button className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-800 text-white rounded-lg text-lg font-semibold shadow-md transition-all duration-300" onClick={resetGame}>
        Restart Game
      </button>
    </div>
  );
}
