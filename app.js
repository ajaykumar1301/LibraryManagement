
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/libraryDB", { useUnifiedTopology: true, useNewUrlParser: true });

const bookSchema = new mongoose.Schema({
    author: String,
    language: String,
    link: String,
    title: String,
    year: Number,
    issue_date: String,
    renew_date: String
});

const Book = mongoose.model("Book", bookSchema);

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    address: String,
    password: String,
    books: [bookSchema]
});

const User = mongoose.model("User", userSchema);


app.get("/", function (req, res) {
    res.render("index");
});

let msg = "";
var cuser = "";

app.get("/login", function (req, res) {
    // console.log(cuser);
    res.render("login", { msg: msg });
});


app.post("/login", function (req, res) {
    let email = req.body.email;
    let password = req.body.password;

    User.findOne({ email: email }, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                if (foundUser.password == password) {
                    msg = "";
                    cuser = foundUser;
                    res.redirect("/home");
                } else {
                    msg = "Incorrect email or password";
                    res.redirect("/login");
                }
            }
        }
    });
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {
    console.log(req.body);
    let user_name = req.body.name;
    let user_email = req.body.email;
    let user_address = req.body.address;
    let user_password = req.body.password;

    const user = new User({
        name: user_name,
        email: user_email,
        address: user_address,
        password: user_password,
    });

    user.save();
    res.redirect("/login");
});

app.get("/add", function (req, res) {
    Book.find(function (err, books) {
        if (err) {
            console.log(err);
        } else {
            res.render("addBook", { books: books, user: cuser });
        }
    });
});

app.post("/add", function (req, res) {
    console.log(req.body.bookName);
    Book.findOne({ "title": req.body.bookName }, function (err, book) {
        // console.log(book);
        console.log(req.body.usr);

        User.findOne({ _id: req.body.usr }, async function (err, user) {
            if (err) {
                console.log(err);
            } else {
                var today = new Date();
                var i_date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
                today.setDate(today.getDate() + 7);
                var r_date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
                book.issue_date = i_date;
                book.renew_date = r_date;
                await user.books.push(book);
                user.save();
                res.redirect("/home");
            }
        });
    });
});


app.get("/home", function (req, res) {
    User.findOne({ _id: cuser._id }, async function (err, user) {
        await res.render("home", { user: user });
    });

});

app.get("/delete/:bookd", function (req, res) {
    const bookId = req.params.bookd;

    User.findOneAndUpdate({ _id: cuser._id }, { $pull: { books: { _id: bookId } } }, function (err, foundBook) {
        if (!err) {
            res.redirect("/home");
        }
    });
});

app.get("/edit/:bookd", function (req, res) {
    const bookId = req.params.bookd;

    User.findOne({ _id: cuser._id }, function (err, user) {
        if (!err) {
            user.books.forEach(function (book) {
                if (book._id == bookId) {
                    var date = new Date(book.renew_date);

                    date.setDate(date.getDate() + 7);
                    var ren_date = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

                    book.renew_date = ren_date;

                    user.save();

                    res.redirect("/home");
                }
            });
        }
    });
});

app.get("/logout", function (req, res) {
    res.redirect("/");
})

app.listen("3000", function () {
    console.log("server is running on port 3000");
});