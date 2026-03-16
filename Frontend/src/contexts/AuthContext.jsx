import { Children, createContext, useContext, useState } from "react";
import axios from "axios";
import httpStatus from 'http-status';
import { useNavigate } from "react-router-dom";
// import environment from "../environment";


export const AuthContext = createContext();
const client = axios.create({
    baseURL: `https://zoomclone-backend-pzrh.onrender.com/api/v1/users`,
    withCredentials: true,

});

export const AuthProvider = ({ children }) => {
    const authContext = useContext(AuthContext);

    const [userData, setUserData] = useState(authContext);

    const handleRegister = async(name, username, password) => {
        // eslint-disable-next-line no-useless-catch
        try {
            let request = await client.post("/register" , {
                name: name,
                username: username,
                password: password,
            });
            setUserData(request.data);
            if(request.status === httpStatus.CREATED) {
                return request.data.message;
            }

        } catch(e) {
            throw e;
        }
    }

    const handleLogin = async(username, password) => {
        // eslint-disable-next-line no-useless-catch
        try {
            let request = await client.post("/login", {
                username: username,
                password: password,
            });

            if(request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                router("/home");
            }
        } catch(e) {
            throw e;
        }
    }


    const router = useNavigate();

    const getHistoryOfUser = async() => {
        // eslint-disable-next-line no-useless-catch
        try {

            let request = await client.get("/get_all_activity", {
                params : {
                    token: localStorage.getItem("token")

                }
            });

            return request.data;

        } catch (e) {
            throw e;
        }
    }

const addToUserHistory = async(meeting) => {
    // eslint-disable-next-line no-useless-catch
    try {
        let request = await client.post("/add_to_activity", {
            token: localStorage.getItem("token"),
            meeting_code: meeting
        });

        return request;
    } catch (e) {
        throw e;
    }
}



   const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
    getHistoryOfUser,
    addToUserHistory
    }


    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}