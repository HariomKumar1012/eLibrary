import { config as conf } from "dotenv";
conf(); //Jab tak ye call nahi hota tab tak dotenv us file me aata nahi hai

const _config = {
    port: process.env.PORT,
};

export const config = Object.freeze(_config); //Object.freeze make the _config read only
