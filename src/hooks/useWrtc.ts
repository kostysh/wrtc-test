import { useState, useEffect } from 'react';

export interface WrtcPeer {
  offer: RTCSessionDescriptionInit;
  candidates: RTCIceCandidateInit[];
}

export interface UseWrtcHook {
  connection?: RTCPeerConnection;
  peer?: WrtcPeer;
  message?: string;
  error?: string;
}

export const useWrtc = (): UseWrtcHook => {
  const [peer, setPeer] = useState<undefined | WrtcPeer>();
  const [error, setError] = useState<undefined | string>();
  const [connection, setConnection] = useState<undefined | RTCPeerConnection>();
  const [message, setMessage] = useState<undefined | string>();

  useEffect(() => {
    const configuration: RTCConfiguration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    };
    const conn = new RTCPeerConnection(configuration);
    const candidates: RTCIceCandidateInit[] = [];

    conn.onicecandidate = ({ candidate }) => {
      console.log('Candidate:', candidate);

      if (candidate) {
        candidates.push(candidate.toJSON());
      } else {
        // All candidates have been gathered.
        setPeer({
          offer: conn.localDescription!,
          candidates,
        });
      }
    };

    conn.oniceconnectionstatechange = () => {
      console.log('ICE Connection State change:', conn.iceConnectionState);
    };

    const dataChannel = conn.createDataChannel('getWrtcDataChannel');
    dataChannel.onopen = () => {
      console.log('Data channel is open');
    };
    dataChannel.onmessage = ({ data }) => setMessage(data);

    conn
      .createOffer()
      .then((offer) => conn.setLocalDescription(offer))
      .then(() => setConnection(conn))
      .catch(err => {
        setError(err.message);
      });

    return () => {
      setConnection(undefined);
      setPeer(undefined);
      setError(undefined);
      conn.close();
    };
  }, []);

  return {
    connection,
    peer,
    message,
    error,
  }
};