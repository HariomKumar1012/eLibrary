import app from "./src/app";
import { config } from "./src/config/config";
import connectDB from "./src/config/db";

const startServer = async () => {
    //connect to database
    await connectDB();

    const port = config.port || 3000;

    app.listen(port, () => {
        console.log(`Listning on port: ${port}`);
    });
};

startServer();
