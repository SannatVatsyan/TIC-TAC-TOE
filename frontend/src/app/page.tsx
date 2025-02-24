"use client"; // ✅ Required for Next.js 15

import { useEffect, useState } from "react";
import io from "socket.io-client";
import { motion } from "framer-motion";

const socket = io("http://localhost:5001");

export default function Home() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isPlayingAI, setIsPlayingAI] = useState(false);
  const [isDraw, setIsDraw] = useState(false); // ✅ Track draw condition

  useEffect(() => {
    socket.on("boardUpdate", ({ board, isXTurn }) => {
      setBoard(board);
      setIsXTurn(isXTurn);
      const result = checkWinner(board);
      if (result) {
        setWinner(result.winner);
        setWinningLine(result.line);
      } else if (board.every(cell => cell !== null)) {
        handleDraw();
      }
    });
  }, []);

  useEffect(() => {
    if (isPlayingAI && !isXTurn && !winner) {
      const bestMove = getBestMove(board);
      if (bestMove !== -1) {
        setTimeout(() => {
          handleClick(bestMove, true);
        }, 500);
      }
    }
  }, [isXTurn, isPlayingAI, board]);

  const handleClick = (index: number, isAI = false) => {
    if (board[index] || winner || isDraw || (isPlayingAI && !isAI && !isXTurn)) return;

    const newBoard = [...board];
    newBoard[index] = isXTurn ? "X" : "O";
    setBoard(newBoard);
    setIsXTurn(!isXTurn);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
    } else if (newBoard.every(cell => cell !== null)) {
      handleDraw();
    }

    socket.emit("move", { index });
  };

  const handleDraw = () => {
    setIsDraw(true);
    setTimeout(() => {
      resetGame();
    }, 3000); // 🔄 Auto-reset after 3 seconds
  };

  const checkWinner = (board: string[]) => {
    const winningCombos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];
    for (let line of winningCombos) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line };
      }
    }
    return null;
  };

  const getBestMove = (board: string[]) => {
    let bestScore = -Infinity;
    let move = -1;
    board.forEach((cell, index) => {
      if (!cell) {
        board[index] = "O";
        let score = minimax(board, 0, false);
        board[index] = null;
        if (score > bestScore) {
          bestScore = score;
          move = index;
        }
      }
    });
    return move;
  };

  const minimax = (board: string[], depth: number, isMaximizing: boolean) => {
    const result = checkWinner(board);
    if (result) return result.winner === "O" ? 10 - depth : -10 + depth;
    if (board.every(cell => cell !== null)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      board.forEach((cell, index) => {
        if (!cell) {
          board[index] = "O";
          let score = minimax(board, depth + 1, false);
          board[index] = null;
          bestScore = Math.max(score, bestScore);
        }
      });
      return bestScore;
    } else {
      let bestScore = Infinity;
      board.forEach((cell, index) => {
        if (!cell) {
          board[index] = "X";
          let score = minimax(board, depth + 1, true);
          board[index] = null;
          bestScore = Math.min(score, bestScore);
        }
      });
      return bestScore;
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine(null);
    setIsDraw(false);
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
            resetGame();
          }}
        >
          Play vs Player
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${isPlayingAI ? "bg-blue-600" : "bg-gray-600"} hover:bg-blue-800`}
          onClick={() => {
            setIsPlayingAI(true);
            resetGame();
          }}
        >
          Play vs AI
        </button>
      </div>

      {/* Game Board */}
      <motion.div 
        className="grid grid-cols-3 gap-4 bg-gray-700 p-6 rounded-lg shadow-lg"
        initial={{ opacity: 0, scale: 0.8 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.5 }}
      >
        {board.map((cell, index) => (
          <motion.button
            key={index}
            className={`w-24 h-24 flex items-center justify-center text-7xl font-extrabold border-2 border-gray-400 rounded-md transition-all duration-300 bg-gray-800 hover:bg-gray-600 
              ${winningLine?.includes(index) ? "bg-green-500 text-white" : ""}`}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleClick(index)}
          >
            {cell}
          </motion.button>
        ))}
      </motion.div>

      {/* Winner or Draw Display */}
      {winner && (
        <motion.div 
          className="mt-6 text-3xl font-semibold text-green-400"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.5 }}
        >
          🎉 Winner: {winner} 🎉
        </motion.div>
      )}
      {isDraw && (
        <motion.div 
          className="mt-6 text-3xl font-semibold text-yellow-400"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.5 }}
        >
          😔 Sorry, better luck next time!
        </motion.div>
      )}

      {/* Restart Button */}
      <button 
        className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-800 text-white rounded-lg text-lg font-semibold shadow-md transition-all duration-300"
        onClick={resetGame}
      >
        Restart Game
      </button>
    </div>
  );
}
