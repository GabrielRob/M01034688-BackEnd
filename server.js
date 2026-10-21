require("dotenv").config()
const express = require("express")
const { MongoClient, ObjectId } = require("mongodb")

const app = express()
app.use(express.json())

let db
MongoClient.connect(process.env.MONGO_URI)
    .then(client => {
        db = client.db("Tutoring")
        console.log("Connected")
    })
    .catch(err => console.error(err))

app.use((req, res, next) => {
    console.log(new Date().toISOString() + " " + req.method + " " + req.url)
    next()
})
app.get("/lessons", (req,res) => {
    db.collection("lesson").find({}).toArray()
        .then(lessons => res.json(lessons))
        .catch(err => res.status(500).json ({ error: err.message}))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log("Server running on port " + PORT))