import { Router } from "express";
import { register, login, guestLogin } from "../controllers/authControllers";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/guest-login", guestLogin);

export default router;
