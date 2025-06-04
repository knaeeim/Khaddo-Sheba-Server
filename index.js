const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
const cors = require("cors");
const admin = require("firebase-admin");
const port = process.env.PORT || 3000;
// Firebase admin service account key decoded from base64
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
    "utf8"
);
// convert into the JSON
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

//  Middlewares
app.use(
    cors({
        origin: ["https://assignment-11-e46ad.web.app/", "http://localhost:5173",],
    })
);
app.use(express.json());

const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send({ message: "Unauthorized access" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.decodedToken = decodedToken;
        next();
    } catch (error) {
        return req.status(401).send({ message: "Unauthorized access" });
    }
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.plgxbak.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        const foodCollection = client.db("foodDB").collection("foods");
        const requestedFoodsCollection = client
            .db("foodDB")
            .collection("requestedFoods");

        // api starts
        // testing api
        app.get("/", (req, res) => {
            res.send("Server is running");
        });

        // get all foods
        app.get("/foods", async (req, res) => {
            const query = req.query.sortBy;
            const queryEmail = req.query.email;
            const limit = parseInt(req.query.limit) || 0;

            let sortQuery = {};
            if (query === "date" || query === "quantity") {
                if (query === "date") {
                    sortQuery = { date: 1 };
                } else if (query === "quantity") {
                    sortQuery = { foodQuantity: -1 };
                }

                const today = new Date();
                today.setHours(0, 0, 0, 0); // Set time to midnight to compare only dates
                const foods = await foodCollection
                    .find({ date: { $gte: today } })
                    .sort(sortQuery)
                    .limit(limit)
                    .toArray();

                res.send(foods);
            } else {
                const foodsByEmail = await foodCollection
                    .find({ email: queryEmail })
                    .toArray();
                res.send(foodsByEmail);
            }
        });

        // get single food by id
        app.get("/foods/:id", verifyFirebaseToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const food = await foodCollection.findOne(query);
            res.send(food);
        });

        app.post("/addFood", verifyFirebaseToken, async (req, res) => {
            const food = req.body;

            const decodedTokenEmail = req.decodedToken.email;
            console.log(decodedTokenEmail);

            if (req.body.email !== decodedTokenEmail) {
                return res.status(403).send({ message: "Forbidden access" });
            }

            if (food.date) {
                food.date = new Date(food.date);
            }

            console.log(food);
            const result = await foodCollection.insertOne(food);
            res.send(result);
        });

        app.put("/foods/:id", verifyFirebaseToken, async (req, res) => {
            const id = req.params.id;
            const food = req.body;

            const decodedTokenEmail = req.decodedToken.email;

            if (food.email !== decodedTokenEmail) {
                return res.status(403).send({ message: "Forbidden access" });
            }

            if (food?.date) {
                food.date = new Date(food.date);
            }

            const query = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    ...food,
                },
            };

            const result = await foodCollection.updateOne(query, updatedDoc);
            res.send(result);
        });

        app.delete("/foods/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await foodCollection.deleteOne(query);
            res.send(result);
        });

        // requested foods API's
        app.get("/myRequestedFoods", verifyFirebaseToken, async (req, res) => {
            const email = req.query.email;
            console.log(email);
            const decodedTokenEmail = req.decodedToken.email;

            if (email !== decodedTokenEmail) {
                return res.status(403).send({ message: "Forbidden Access" });
            }

            // now find the foods by email
            const query = { requestedUserEmail: email };
            const foods = await requestedFoodsCollection.find(query).toArray();
            res.send(foods);
        });

        app.post("/myRequestedFoods", verifyFirebaseToken, async (req, res) => {
            const food = req.body;
            console.log(food);
            const decodedTokenEmail = req.decodedToken.email;
            if (food.requestedUserEmail !== decodedTokenEmail) {
                return res.status(403).send({ message: "Forbidden access" });
            }
            const result = await requestedFoodsCollection.insertOne(food);
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log(
        //     "Pinged your deployment. You successfully connected to MongoDB!"
        // );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
