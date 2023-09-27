import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway() // 웹소켓 서버 설정 데코레이터
export class ChatGateway {
    // 웹소켓 서버 인스턴스 선언
    @WebSocketServer() server: Server;

    // message 이벤트 구독
    @SubscribeMessage('message')
    handleMessage(socket: Socket, data: any): void {
        // 메시지와 닉네임을 데이터에서 추출
        const { message, nickname } = data;

        // 닉네임을 포함한 메시지 전송
        // socket.broadcast.emit() 은 전송을 요청한 클라이언트를 제외한 다른 클라이언트들에게 데이터 전송
        socket.broadcast.emit('message', `${nickname}: ${message}`);
    }
}
