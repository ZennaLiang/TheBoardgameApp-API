const express = require('express');
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const expressValidator = require('express-validator');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

/**************************************************************************
**************************       DB Connection    ************************
**************************************************************************/
mongoose
    .connect(process.env.MONGO_URI, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: false
    })
    .then(() => console.log("DB Connected"));

mongoose.connection.on("error", err => {
    console.log(`DB connection error: ${err.message}`);
});

/**************************************************************************
****************************       Routes       ***************************
**************************************************************************/
const postRoutes = require("./routes/post");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const boardgameRoutes = require("./routes/boardgame");
const tradeRoutes = require("./routes/trade");

/**************************************************************************
**************************         API DOC         ************************
**************************************************************************/
app.get('/api', (req, res) => {
    fs.readFile('docs/apiDocs.json', (err, data) => {
        if (err) {
            res.status(400).json({
                error: err
            });
        }
        const docs = JSON.parse(data);
        res.json(docs);
    });
});

/**************************************************************************
**************************       Middleware       ************************
**************************************************************************/
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressValidator());
app.use(cors());
app.use('/api', postRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', boardgameRoutes);
app.use('/api', tradeRoutes);
// show error when user try to access web without authorization  
app.use(function (err, req, res, next) {
    if (err.name === "UnauthorizedError") {
        res.status(401).json({ error: "Unauthorized Access!" });
    }
});


const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`A Node Js API is listening on port: ${port}`);
});
