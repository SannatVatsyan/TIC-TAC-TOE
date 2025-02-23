import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway {
  @WebSocketServer()
  server!: Server;  // ✅ Fix: Non-null assertion to avoid TypeScript error

  private board: string[] = Array(9).fill(null);
  private isXTurn = true;

  @SubscribeMessage('move')
  handleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { index: number }
  ): void {
    if (!this.board[data.index]) {
      this.board[data.index] = this.isXTurn ? 'X' : 'O';
      this.isXTurn = !this.isXTurn;
      this.server.emit('boardUpdate', { board: this.board, isXTurn: this.isXTurn });
    }
  }
}
