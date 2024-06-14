import express from "express";
import { createBook } from "./bookController";

const bookRouter = express.Router();

bookRouter.post("/register", createBook);

export default bookRouter;
