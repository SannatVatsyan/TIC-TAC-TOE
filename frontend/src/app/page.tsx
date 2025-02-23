"use client";  // ✅ Required for Next.js 15

import { useEffect, useState } from "react";
import io from "socket.io-client";
import { motion } from "framer-motion";

const socket = io("http://localhost:5001");

export default function Home() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    socket.on("boardUpdate", ({ board, isXTurn }) => {
      setBoard(board);
      setIsXTurn(isXTurn);
      setWinner(checkWinner(board));
    });
  }, []);

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXTurn ? "X" : "O";
    setBoard(newBoard);
    setIsXTurn(!isXTurn);

    socket.emit("move", { index });
  };

  const checkWinner = (board: string[]) => {
    const winningCombos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let [a, b, c] of winningCombos) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-8 text-accent">Tic Tac Toe</h1>
      <motion.div 
        className="grid grid-cols-3 gap-4 bg-gray-700 p-6 rounded-lg shadow-lg"
        initial={{ opacity: 0, scale: 0.8 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.5 }}
      >
        {board.map((cell, index) => (
          <motion.button
            key={index}
            className="w-24 h-24 flex items-center justify-center text-6xl font-extrabold border-2 border-gray-400 rounded-md transition-all duration-300 bg-gray-800 hover:bg-gray-600"
            whileTap={{ scale: 0.9 }}
            onClick={() => handleClick(index)}
          >
            {cell === "X" && (
              <motion.span 
                className="text-red-500 text-7xl font-extrabold drop-shadow-lg"
                animate={{ scale: [0.5, 1] }}
              >
                X
              </motion.span>
            )}
            {cell === "O" && (
              <motion.span 
                className="text-blue-500 text-7xl font-extrabold drop-shadow-lg"
                animate={{ scale: [0.5, 1] }}
              >
                O
              </motion.span>
            )}
          </motion.button>
        ))}
      </motion.div>
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
      <button 
        className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-800 text-white rounded-lg text-lg font-semibold shadow-md transition-all duration-300"
        onClick={() => {
          setBoard(Array(9).fill(null));
          setWinner(null);
          socket.emit("reset");
        }}
      >
        Restart Game
      </button>
    </div>
  );
}
