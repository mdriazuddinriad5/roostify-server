const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')


// middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.wz04jag.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// custom middlewares

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    if (!token) {
        // next()
        return res.status(401).send({ message: 'Unauthorized' });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized me' })
        }

        req.user = decoded;

        next()
    })
}



async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();

        const roomCollection = client.db('hotel').collection('rooms');
        const bookingCollection = client.db('hotel').collection('bookings');
        const reviewCollection = client.db('hotel').collection('reviews');
        const testimonialCollection = client.db('hotel').collection('testimonials');
        


        // auth related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none'
                })
                .send({ success: true });
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('Logging out', user);
            res
                .clearCookie('token', { maxAge: 0 })
                .send({ success: true })
        })


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
                projection: { _id: 1, roomNumber: 1, roomDescription: 1, pricePerNight: 1, roomSize: 1, availability: 1, roomImages: 1, specialOffers: 1, date: 1, review: 1 }
            }

            const result = await roomCollection.findOne(query, options);

            res.send(result);

        })


        // booking related api

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })


        app.get('/bookings',verifyToken,  async (req, res) => {
            
            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query);
            res.send(result);
        })

        app.patch('/bookings/:id', async (req, res) => {

            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBooking = req.body;

            const updateDoc = {
                $set: {
                    date: updatedBooking.date,
                },
            };

            const result = await bookingCollection.updateOne(filter, updateDoc);
            res.send(result)
        });

       
        // review related api


        app.post('/reviews',async(req,res)=>{
            const review = req.body;
            console.log(review);
            const result = await reviewCollection.insertOne(review);
            res.send(result);

        })

        app.get('/reviews', async(req,res)=>{
            const cursor = reviewCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        app.post('/testimonials',async(req,res)=>{
            const testimonial = req.body;
            console.log(testimonial);
            const result = await testimonialCollection.insertOne(testimonial);
            res.send(result);

        })

        app.get('/testimonials', async(req,res)=>{
            const cursor = testimonialCollection.find();
            const result = await cursor.toArray();
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