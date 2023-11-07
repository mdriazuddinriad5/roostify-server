const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()


// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.wz04jag.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();

        const roomCollection = client.db('hotel').collection('rooms');



        // room related api

        app.get('/rooms', async (req, res) => {
            const cursor = roomCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/rooms/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const options = {
                projection: { _id: 1, roomDescription: 1, pricePerNight: 1, roomSize: 1, availability: 1, roomImages: 1, specialOffers: 1, date: 1, review: 1 }
            }

            const result = await roomCollection.findOne(query, options);

            res.send(result);

        })



        // Send a ping to confirm a successful connection
        client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hotel is running.....')
})

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
})