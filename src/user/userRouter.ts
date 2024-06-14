import express from "express";
import { createUser } from "./userController";

const userRouter = express.Router();

//user routes creation
userRouter.post("/register", createUser);

export default userRouter;
