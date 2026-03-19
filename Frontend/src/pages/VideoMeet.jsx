import React, { useEffect, useRef, useState } from 'react';
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import styles from "../styles/videoComponent.module.css";
import server from '../environment';

const server_url = server;
var connections = {};
const peerConfigConnections = {
    "iceServers": [{ "urls": "stun:stun.l.google.com:19302" }]
};

export default function VideoMeetComponent() {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoref = useRef();
    const localStreamRef = useRef(); // Use a Ref to persist the stream

    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [screen, setScreen] = useState(false);
    const [showModal, setModal] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [videos, setVideos] = useState([]);
    const videoRef = useRef([]); // Internal sync for the videos state

    // 1. Initialize Media on Mount
    useEffect(() => {
        const initMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                if (localVideoref.current) {
                    localVideoref.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing media devices:", err);
            }
        };
        initMedia();
    }, []);

    // 2. Signaling logic
    const gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);
        if (fromId === socketIdRef.current) return;

        if (signal.sdp) {
            connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                if (signal.sdp.type === 'offer') {
                    connections[fromId].createAnswer().then((description) => {
                        connections[fromId].setLocalDescription(description).then(() => {
                            socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }));
                        });
                    });
                }
            });
        }
        if (signal.ice) {
            connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
        }
    };

    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', (data, sender, id) => {
                setMessages((prev) => [...prev, { sender, data }]);
                if (id !== socketIdRef.current) setNewMessages((prev) => prev + 1);
            });

            socketRef.current.on('user-left', (id) => {
                setVideos((prev) => {
                    const updated = prev.filter(v => v.socketId !== id);
                    videoRef.current = updated;
                    return updated;
                });
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    if (connections[socketListId]) return;

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    connections[socketListId].onicecandidate = (event) => {
                        if (event.candidate) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                        }
                    };

                    connections[socketListId].ontrack = (event) => {
                        setVideos((prev) => {
                            if (prev.find(v => v.socketId === socketListId)) return prev;
                            const newVideo = { socketId: socketListId, stream: event.streams[0] };
                            const updated = [...prev, newVideo];
                            videoRef.current = updated;
                            return updated;
                        });
                    };

                    if (localStreamRef.current) {
                        localStreamRef.current.getTracks().forEach(track => {
                            connections[socketListId].addTrack(track, localStreamRef.current);
                        });
                    }
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;
                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }));
                            });
                        });
                    }
                }
            });
        });
    };

    // 3. Handlers
    const handleVideo = () => {
        const enabled = localStreamRef.current.getVideoTracks()[0].enabled;
        localStreamRef.current.getVideoTracks()[0].enabled = !enabled;
        setVideo(!enabled);
    };

    const handleAudio = () => {
        const enabled = localStreamRef.current.getAudioTracks()[0].enabled;
        localStreamRef.current.getAudioTracks()[0].enabled = !enabled;
        setAudio(!enabled);
    };

    const connect = () => {
        setAskForUsername(false);
        connectToSocketServer();
    };

    return (
        <div style={{ backgroundColor: "#202124", minHeight: "100vh", color: "white" }}>
            {askForUsername ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                    <h2>Join Meeting</h2>
                    <TextField 
                        sx={{ input: { color: 'white' }, label: { color: 'white' } }} 
                        label="Username" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                    />
                    <Button sx={{ ml: 2, height: '56px' }} variant="contained" onClick={connect}>Join Call</Button>
                    <div style={{ marginTop: "20px" }}>
                        <video ref={localVideoref} autoPlay muted style={{ width: "400px", borderRadius: "10px", border: "2px solid #5f6368" }} />
                    </div>
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>
                    {showModal && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h3>Meeting Chat</h3>
                                <div className={styles.chattingDisplay}>
                                    {messages.map((item, index) => (
                                        <div key={index} style={{ marginBottom: "10px" }}>
                                            <b>{item.sender}:</b> {item.data}
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.chattingArea}>
                                    <TextField fullWidth size="small" value={message} onChange={(e) => setMessage(e.target.value)} />
                                    <Button onClick={() => { socketRef.current.emit('chat-message', message, username); setMessage(""); }}>Send</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} color="inherit">{video ? <VideocamIcon /> : <VideocamOffIcon />}</IconButton>
                        <IconButton onClick={() => window.location.reload()} color="error"><CallEndIcon /></IconButton>
                        <IconButton onClick={handleAudio} color="inherit">{audio ? <MicIcon /> : <MicOffIcon />}</IconButton>
                        <Badge badgeContent={newMessages} color="primary">
                            <IconButton onClick={() => { setModal(!showModal); setNewMessages(0); }} color="inherit"><ChatIcon /></IconButton>
                        </Badge>
                    </div>

                    {/* Local Video Overlay */}
                    <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted />

                    {/* Remote Videos Grid */}
                    <div className={styles.conferenceView}>
                        {videos.map((v) => (
                            <div key={v.socketId} className={styles.videoWrapper}>
                                <video
                                    autoPlay
                                    playsInline
                                    ref={ref => { if (ref) ref.srcObject = v.stream; }}
                                    style={{ width: "100%", borderRadius: "8px" }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}