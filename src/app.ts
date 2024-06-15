import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { HttpError } from "http-errors";
import { config } from "./config/config";
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";
import globalErrorHandler from "./middlewares/globalErrorHandler";

const app = express();
app.use(
    cors({
        origin: config.frontendDomain,
    })
);
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to E library",
    });
});

//user router
app.use("/api/users", userRouter);

//book router
app.use("/api/books", bookRouter);

//globle Error Handler
app.use(globalErrorHandler);

export default app;
