import Peer, { DataConnection } from 'peerjs';
import { P2PMessage } from '../types';

class P2PService {
    peer: Peer | null = null;
    conn: DataConnection | null = null;
    onMessage: ((msg: P2PMessage) => void) | null = null;
    onConnect: (() => void) | null = null;

    initialize(id?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            // Using default PeerJS cloud server.
            // In production, you might want your own Turn/Stun or PeerServer.
            this.peer = new Peer(id, {
                debug: 2
            });

            this.peer.on('open', (myId) => {
                console.log('My Peer ID:', myId);
                resolve(myId);
            });

            this.peer.on('connection', (conn) => {
                this.handleConnection(conn);
            });

            this.peer.on('error', (err) => {
                console.error('PeerJS Error:', err);
                reject(err);
            });
        });
    }

    connectToPeer(peerId: string) {
        if (!this.peer) return;
        const conn = this.peer.connect(peerId);
        this.handleConnection(conn);
    }

    handleConnection(conn: DataConnection) {
        this.conn = conn;
        
        this.conn.on('open', () => {
            console.log('Connected to peer!');
            if (this.onConnect) this.onConnect();
        });

        this.conn.on('data', (data) => {
            if (this.onMessage) {
                this.onMessage(data as P2PMessage);
            }
        });

        this.conn.on('close', () => {
            console.log('Connection closed');
            this.conn = null;
        });
    }

    send(msg: P2PMessage) {
        if (this.conn && this.conn.open) {
            this.conn.send(msg);
        }
    }
}

export const p2pService = new P2PService();
