import { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import QR from 'qrcode';
import QrReader from 'react-qr-reader';
import { compress, decompress } from 'lzutf8';
import { useWrtc, type WrtcPeer } from './hooks/useWrtc';

function App() {
  const canvasRef = useRef(null);
  const [showScan, setShowScan] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [data, setData] = useState<undefined| string>();
  const [error, setError] = useState<undefined | string>();
  const { connection, peer, message } = useWrtc();

  const onShowQr = useCallback(async () => {
    if (peer) {
      setShowQr(true);
      const peerData = compress(JSON.stringify(peer), { inputEncoding: 'String', outputEncoding: 'Base64' });
      setTimeout(() => {
        QR.toCanvas(canvasRef.current, peerData, { width: 500, });
      }, 1000);
    } else {
      setError('WRTC not initialized yet!');
    }
  }, [peer]);

  useEffect(() => {
    if (connection && data) {
      const onData = async () => {
        const peerData = decompress(data, { inputEncoding: 'Base64', outputEncoding: 'String' });
        const remotePeer = JSON.parse(peerData) as WrtcPeer;

        await connection.setRemoteDescription(new RTCSessionDescription(remotePeer.offer))
        remotePeer.candidates.forEach((candidate) => {
          connection.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.log);
        });

        console.log('$$$$ connection.iceConnectionState', connection.iceConnectionState);
        const sendChannel = connection.createDataChannel('sendWrtcDataChannel');
        sendChannel.onopen = () => {
          console.log('$$$$===');
          sendChannel.send('Dude!!!');
        };
      };

      onData().catch(console.log);
    }
  }, [connection, data]);

  return (
    <>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {message && <div style={{ color: 'blue' }}>{message}</div>}
      <div>
        <button onClick={onShowQr}>Show QR code</button>
      </div>
      {showQr && <div><canvas ref={canvasRef} /></div>}
      <div>
        <button onClick={() => setShowScan(!showScan)}>Show QR scanner</button>
      </div>
      {showScan &&
        <div>
          <QrReader
            facingMode="environment"
            delay={1000}
            onScan={(data: string | null) => {
              console.log('####', data);
              if (data) {
                setData(data);
                setShowScan(false);
              }
            }}
            onError={(error) => console.log(error)}
            style={{
              width: 300,
              height: 300,
            }}
          />
        </div>
      }
    </>
  )
}

export default App
