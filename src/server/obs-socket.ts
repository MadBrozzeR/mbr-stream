import crypto from 'crypto';
import { MadSocketClient } from 'madsocket';
import { config } from './config';
import { ObsMessage, ObsMessageData } from './obs-socket-types';

const RECONNECT_DELAY = 10000;

function handleHello(messageData: ObsMessage<0>) {
  const result: ObsMessage<1> = {
    op: 1,
    d: {
      rpcVersion: 1,
      eventSubscriptions: 128,
    },
  };

  if (messageData.d.authentication) {
    const { salt, challenge } = messageData.d.authentication;
    const hashedPassword = crypto.createHash('sha256').update(config.obsPassword + salt).digest('base64');
    const secret = crypto.createHash('sha256').update(hashedPassword + challenge).digest('base64');

    result.d.auth = secret;
  }

  return result;
}

type Status = 'idle' | 'connected' | 'active' | 'pending';

export class OBSSocket {
  socket: MadSocketClient;
  status: Status = 'idle';
  password: string;

  constructor(url: string, password: string) {
    const obsSocket = this;
    this.password = password;
    this.socket = new MadSocketClient({
      connect() {
        console.log('Successfully connected to OBS');
        obsSocket.status = 'connected';
      },
      error(error) {
        console.error('Error in OBS Socket connection:', error);
      },
      disconnect() {
        console.log('OBS Disconnected');
        obsSocket.status = 'idle';
        obsSocket.connect(RECONNECT_DELAY);
      },
      message(message) {
        try {
          const messageData: {
            [K in keyof ObsMessageData]: ObsMessage<K>
          }[keyof ObsMessageData] = JSON.parse(message.toString());

          switch (messageData.op) {
            case 0:
              if (obsSocket.status === 'connected') {
                const response = handleHello(messageData);
                obsSocket.send(response);
              }
              break;
            case 2:
              if (obsSocket.status = 'connected') {
                obsSocket.status = 'active';
              }
              break;
            case 8:
              obsSocket.send({ op: 9, d: messageData.d });
              break;
          }
        } catch (error) {
          console.error('Failed to parse OBS Socket message:', error);
        }
      },
    }, { url });
  }

  send(message: ObsMessage, { withStatus = 'active' }: { withStatus?: Status } = {}) {
    if (this.status === withStatus) {
      this.socket.send(JSON.stringify(message));
    }
  }

  connect(delay = 0) {
    const obsSocket = this;
    this.status = 'pending';

    setTimeout(function () {
      obsSocket.socket.connect()
        .catch(function () {
          obsSocket.connect(RECONNECT_DELAY);
        });
    }, delay);
  }
}
