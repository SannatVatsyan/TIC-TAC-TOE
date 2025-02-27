import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  board: Array(9).fill(null),
  isXTurn: true,
  winner: null,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    makeMove: (state, action) => {
      if (!state.board[action.payload] && !state.winner) {
        state.board[action.payload] = state.isXTurn ? "X" : "O";
        state.isXTurn = !state.isXTurn;
      }
    },
    resetGame: (state) => {
      state.board = Array(9).fill(null);
      state.isXTurn = true;
      state.winner = null;
    },
    setWinner: (state, action) => {
      state.winner = action.payload;
    },
  },
});

export const { makeMove, resetGame, setWinner } = gameSlice.actions;
export default gameSlice.reducer;
