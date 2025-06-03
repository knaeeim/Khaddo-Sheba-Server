const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
require("dotenv").config();
const cors = require("cors");
const admin = require("firebase-admin");
const port = process.env.PORT || 3000;
// Firebase admin service account key decoded from base64
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString("utf8");
// convert into the JSON
const serviceAccount = JSON.parse(decoded);


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

//  Middlewares
app.use(cors());
app.use(express.json());

// 5dKPsAXlnEk3kvlR
// assignment-11




const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.plgxbak.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        // Database and collection will be created here 


        // api starts 
        // testing api 
        app.get("/", (req, res) => {
            res.send("Server is running");
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
