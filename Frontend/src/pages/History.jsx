import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import Box from '@mui/material/Box';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch (err) {
                console.log("Error fetching history:", err);
            }
        };
        fetchHistory();
    }, [getHistoryOfUser]);

    const formatDate = (dateInput) => {
        let date;
        if (!dateInput) return "Invalid Date";

        // Check if it's a timestamp (number)
        if (typeof dateInput === "number") {
            date = new Date(dateInput);
        } else {
            date = new Date(dateInput);
        }

        if (isNaN(date.getTime())) return "Invalid Date";

        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    return (
        <Box sx={{ padding: 2 }}>
            {/* Home button */}
            <IconButton
                onClick={() => navigate("/home")}
                sx={{
                    backgroundColor: "orange",
                    color: "black",
                    "&:hover": { backgroundColor: "#ffb74d" },
                    fontSize: 40,
                    padding: 2,
                    mb: 2
                }}
            >
                <HomeIcon sx={{ fontSize: 40 }} />
            </IconButton>

            {/* Meetings history */}
            {meetings.length !== 0 ? (
                meetings.map((e, i) => (
                    <Card key={i} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                Code: {e.meetingCode || "N/A"}
                            </Typography>

                            <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                Date: {formatDate(e.date)}
                            </Typography>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Typography sx={{ mt: 2 }} color="text.secondary">
                    No meetings found.
                </Typography>
            )}
        </Box>
    );
}
