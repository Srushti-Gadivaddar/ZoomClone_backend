import crypto from 'crypto';
import { User } from '../models/user.js';
import httpStatus from 'http-status';
import bcrypt from 'bcrypt';
import { Meeting } from "../models/meeting.js";

const Login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({
            message: "All fields are required"
        });
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Invalid credentials"
            });
        }

        let token = crypto.randomBytes(20).toString("hex");

        user.token = token;
        await user.save();

        return res.status(httpStatus.OK).json({
            message: "Login Successful!",
            token: token
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error in login"
        });
    }
};


const Register = async (req, res) => {
    const {username, name, password} = req.body;

    try {
        const existingUser = await User.findOne({username});

        if(existingUser) {
            return res.status(httpStatus.CONFLICT).json({message: "User already exists!"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User({
           username:  username,
            name: name,
            password: hashedPassword,
        });

        await newUser.save();

        return res.status(httpStatus.CREATED).json({
            message: "User Registered Successfully"
        });

    } catch (error) {
        return res.status(500).json({message: "Internal Server Error in registering"});
    }
}


const getUserHistory = async (req, res) => {
    const {token} = req.query;
    try {
        const user = await User.findOne({token: token});
        const meetings = await Meeting.find({user_id: user.username});
        res.json(meetings);

    } catch (e) {
        res.json({message: `Something went wrong ${e}`});
    }
}


const addToHistory = async (req, res) => {
    const {token, meeting_code} = req.body;

    try {
        const user = await User.findOne({token : token});

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code,
        });

        await newMeeting.save();

        res.status(httpStatus.CREATED).json({message: "Added code to history"});

    } catch (e) {
        res.json({message: `Someting went wrong ${e}`});
    }
}

export {Login, Register, getUserHistory, addToHistory};