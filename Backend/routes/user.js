import express from 'express';
import { addToHistory, getUserHistory, Login, Register } from '../controllers/user.js';
const router = express.Router();

// Example route: Get user profile
router.route("/login").post(Login);
router.route("/register").post(Register);
router.route("/add_to_activity").post(addToHistory);
router.route("/get_all_activity").get(getUserHistory);
 
export default router;

