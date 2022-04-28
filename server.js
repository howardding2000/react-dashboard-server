/** 
 * The startup module of the application
 * 1. Start the server using express
 * 2. Connect to the database through Mongoose
 * Note: Start the server only after connecting to the database
 * 3. Use middleware
*/

const path = require('path')
const mongoose = require('mongoose')
const express = require('express')
// Generating application objects
const app = express() 

// Declare using static middleware 
// app.use(express.static('public'))

/**
 * Declare middleware that parses POST requests
 * 1. The request body parameter is: name=tom&pwd=123
 * 2. The request body parameters are JSON structures: {name: tom, pwd: 123}
 * 3. Declare middleware that uses cookie data parsing
 * 4. Declare the use of router middleware
 */
app.use(express.urlencoded({extended: true})) 
app.use(express.json())
const cookieParser = require('cookie-parser')
app.use(cookieParser())
const indexRouter = require('./routers')
app.use('/api', indexRouter)  //

const fs = require('fs')

//download images
app.use('/upload',  express.static(path.join(__dirname, '/public/upload')))

// Must be declared after the router
/*app.use((req, res) => {
  fs.readFile(__dirname + '/public/index.html', (err, data)=>{
    if(err){
      console.log(err)
      res.send('Background server error.')
    } else {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
      });
      res.end(data)
    }
  })
})*/

// Connect to the database through Mongoose
mongoose.connect('mongodb://localhost/server_db2', {useNewUrlParser: true})
  .then(() => {
    console.log('Database connect succeefully!!!')
    // Start the server only when the database is connected
    app.listen('5000', () => {
      console.log('Server started successfully, please visit: http://localhost:5000')
    })
  })
  .catch(error => {
    console.error('Database connection failure', error)
  })

