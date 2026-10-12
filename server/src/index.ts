import express from "express";
import cors from "cors";

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

app.get('/api/ping',(req,res)=> {
  res.json({
    message:'pong',
    time: new Date().toISOString()
  })
})

app.listen(PORT,() => {
  console.log(`Server running at http://localhost:${PORT}`)
})