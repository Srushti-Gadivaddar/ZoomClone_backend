import { useNavigate } from "react-router-dom";
import WithAuth from "../utils/WithAuth";
import { useState } from "react";
import "../App.css";
import { Button, IconButton, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

function Home() {

    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");

    const {addToUserHistory} = useContext(AuthContext);

    let handleJoinVideoCall = async() => {
        await addToUserHistory(meetingCode);
        navigate(`${meetingCode}`);
    }

    return ( 
        <>
            <div className="navBar">
                <div style={{display: "flex", alignItems: "center", }}>
                    <h2 style={{color: "black"}}>Apna Video Call</h2>
                </div>
                <div style={{display: "flex", alignItems: "center", }}>

                   <IconButton onClick={() => navigate("/history")}>
    <RestoreIcon />
    History
</IconButton>



                    <Button onClick={() => {
                        localStorage.removeItem("token")
                        navigate("/auth");
                    }}>
                        Logout
                    </Button>

                </div>
            </div>

            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2 style={{color: "black"}}>Providing Quality Video Call Just Like Quality Education</h2>
                        <div style={{display: "flex", gap: "10px"}}>
                            <TextField
                                        id="outlined-basic"
                                        label="Meeting Code"
                                        value={meetingCode}
                                        onChange={(e) => setMeetingCode(e.target.value)}
                                        variant="outlined"
                            />
                            <Button variant="contained" onClick={handleJoinVideoCall}>
                                Join
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rightPanel">
                    <img src="/logo3.png" alt="Right panel image" />
                </div>
            </div>
        </>
     );
}

export default WithAuth(Home);

