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
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
};

export default function VideoMeetComponent() {
    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState(true);
    let [audio, setAudio] = useState(true);
    let [screen, setScreen] = useState(false);
    let [showModal, setModal] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState(false);
    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");
    
    const videoRef = useRef([]); // To keep track of current videos in sync
    let [videos, setVideos] = useState([]);

    // 1. Get Permissions ONCE on mount
    useEffect(() => {
        getPermissions();
    }, []);

    const getPermissions = async () => {
        try {
            const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (userStream) {
                window.localStream = userStream;
                if (localVideoref.current) {
                    localVideoref.current.srcObject = userStream;
                }
                setVideoAvailable(true);
                setAudioAvailable(true);
            }
            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            }
        } catch (error) {
            console.error("Permission denied or error:", error);
        }
    };

    // 2. Handle Socket Connection
    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                setVideos((prevVideos) => {
                    const filtered = prevVideos.filter((v) => v.socketId !== id);
                    videoRef.current = filtered;
                    return filtered;
                });
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    if (connections[socketListId]) return; // Avoid duplicates

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    // Handle ICE Candidates
                    connections[socketListId].onicecandidate = (event) => {
                        if (event.candidate) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                        }
                    };

                    // Handle Incoming Track (The Fix!)
                    connections[socketListId].ontrack = (event) => {
                        let videoExists = videoRef.current.find(v => v.socketId === socketListId);

                        if (!videoExists) {
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.streams[0],
                                autoplay: true,
                                playsinline: true
                            };
                            setVideos(prev => {
                                const updated = [...prev, newVideo];
                                videoRef.current = updated;
                                return updated;
                            });
                        }
                    };

                    // Add Local Tracks to the connection
                    if (window.localStream) {
                        window.localStream.getTracks().forEach(track => {
                            connections[socketListId].addTrack(track, window.localStream);
                        });
                    }
                });

                // If I am the one who just joined, create offers to everyone else
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

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);

        if (fromId !== socketIdRef.current) {
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
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
            }
        }
    };

    // 3. Media Controls
    let handleVideo = () => {
        let newVideoState = !video;
        setVideo(newVideoState);
        window.localStream.getVideoTracks().forEach(track => track.enabled = newVideoState);
    };

    let handleAudio = () => {
        let newAudioState = !audio;
        setAudio(newAudioState);
        window.localStream.getAudioTracks().forEach(track => track.enabled = newAudioState);
    };

    let handleScreen = async () => {
        if (!screen) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                setScreen(true);
                replaceStream(screenStream);
                
                screenStream.getVideoTracks()[0].onended = () => {
                    setScreen(false);
                    replaceStream(window.localStream);
                };
            } catch (e) { console.log(e) }
        } else {
            setScreen(false);
            replaceStream(window.localStream);
        }
    };

    const replaceStream = (newStream) => {
        localVideoref.current.srcObject = newStream;
        for (let id in connections) {
            let videoTrack = newStream.getVideoTracks()[0];
            let sender = connections[id].getSenders().find(s => s.track.kind === 'video');
            if (sender) sender.replaceTrack(videoTrack);
        }
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prev) => [...prev, { sender, data }]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prev) => prev + 1);
        }
    };

    let sendMessage = () => {
        socketRef.current.emit('chat-message', message, username);
        setMessage("");
    };

    let connect = () => {
        setAskForUsername(false);
        connectToSocketServer();
    };

    return (
        <div>
            {askForUsername === true ?
                <div style={{ padding: "20px" }}>
                    <h2>Enter into Lobby</h2>
                    <TextField label="Username" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />
                    <Button variant="contained" onClick={connect} style={{ marginLeft: "10px", height: "55px" }}>Connect</Button>
                    <div style={{ marginTop: "20px" }}>
                        <video ref={localVideoref} autoPlay muted style={{ width: "300px", borderRadius: "10px" }}></video>
                    </div>
                </div> :
                <div className={styles.meetVideoContainer}>
                    {showModal && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h1>Chat</h1>
                                <div className={styles.chattingDisplay}>
                                    {messages.length !== 0 ? messages.map((item, index) => (
                                        <div style={{ marginBottom: "20px" }} key={index}>
                                            <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                                            <p>{item.data}</p>
                                        </div>
                                    )) : <p>No Messages Yet</p>}
                                </div>
                                <div className={styles.chattingArea}>
                                    <TextField fullWidth value={message} onChange={(e) => setMessage(e.target.value)} label="Enter Your chat" variant="outlined" />
                                    <Button variant='contained' onClick={sendMessage}>Send</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={() => window.location.href = "/"} style={{ color: "red" }}>
                            <CallEndIcon />
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                        {screenAvailable && (
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton>
                        )}
                        <Badge badgeContent={newMessages} color="primary">
                            <IconButton onClick={() => { setModal(!showModal); setNewMessages(0); }} style={{ color: "white" }}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>

                    <div className={styles.conferenceView}>
                        {videos.map((v) => (
                            <div key={v.socketId}>
                                <video
                                    autoPlay
                                    ref={ref => { if (ref) ref.srcObject = v.stream; }}
                                    style={{ width: "100%", borderRadius: "10px" }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            }
        </div>
    );
}