import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    MessageBody,
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

@WebSocketGateway({ namespace: 'room' })
export class RoomGateway {
    // 채팅 게이트웨이 의존성 주입
    constructor(private readonly chatGateway: ChatGateway) {}
    rooms = [];

    // 서버 인스턴스 접근을 위한 변수 생성
    @WebSocketServer() server: Server;

    // createRoom 핸들러 메서드
    // 소켓없이 데이터만 받음
    @SubscribeMessage('createRoom')
    handleMessage(@MessageBody() data) {
        const { room, nickname } = data;

        // 채팅방 생성 시 이벤트 발생시켜 클라이언트에 송신
        this.chatGateway.server.emit('notice', {
            message: `${nickname}님이 ${room}방을 만들었습니다.`,
        });

        // 채팅방 이름 받아서 리스트에 추가
        this.rooms.push(room);
        // rooms 이벤트로 채팅방 리스트 전송
        this.server.emit('rooms', this.rooms);
    }

    // 채팅방 입장 시 실행되는 핸들러 메서드
    @SubscribeMessage('joinRoom')
    handleJoinRoom(socket: Socket, data) {
        const { nickname, room, toLeaveRoom } = data;

        // 기존에 방에서 먼저나감
        socket.leave(toLeaveRoom);
        this.chatGateway.server.emit('notice', {
            message: `${nickname}님이 ${room}방에 입장했습니다.`,
        });

        // 새로운 방에 입장
        socket.join(room);
    }
}
