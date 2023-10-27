import { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import QR from 'qrcode';
import QrReader from 'react-qr-reader';
import { useWrtc, type WrtcPeer } from './hooks/useWrtc';

function App() {
  const canvasRef = useRef(null);
  const [showScan, setShowScan] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [data, setData] = useState<undefined| string>();
  const [error, setError] = useState<undefined | string>();
  const { connection, peer, message } = useWrtc();

  const onShowQr = useCallback(() => {
    if (peer) {
      setShowQr(true);
      console.log('@@@@', peer);
      setTimeout(() => {
        QR.toCanvas(canvasRef.current, JSON.stringify(peer), { width: 500, });
      }, 1000);
    } else {
      setError('WRTC not initialized yet!');
    }
  }, [peer]);

  useEffect(() => {
    if (connection && data) {
      const remotePeer = JSON.parse(data) as WrtcPeer;
      connection
        .setRemoteDescription(new RTCSessionDescription(remotePeer.offer))
        .then(() => {
          console.log('$$$$', connection);
          const sendChannel = connection.createDataChannel('sendWrtcDataChannel');
          sendChannel.onopen = () => {
            sendChannel.send('Dude!!!');
          };
        })
        .catch((error) => console.log('>>>', error));
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
