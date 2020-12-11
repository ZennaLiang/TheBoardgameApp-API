const User = require("../../models/user");
const app = require("../../app"); // my express app
const chai = require("chai");
const chaiHttp = require("chai-http");
const { expect } = require("chai");
const { it } = require("mocha");
const jwt = require("jsonwebtoken");
const should = chai.should();
const token = jwt.sign({ _id: "123", iss: "NODEAPI" }, process.env.JWT_SECRET);
describe("AuthController", () => {
  before((done) => {
    const nUser = new User({
      email: "user@test.com",
      name: "test user",
      password: "testuser",
    });
    nUser.save();

    done();
  });

  after((done) => {
    User.collection.drop();
    done();
  });

  describe("User login", () => {
    it("should show status 401 with wrong email", (done) => {
      chai
        .request(app)
        .post("/api/signin")
        .send({
          email: "userwrong@test.com",
          password: "testuser",
        })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    it("should show status 401 with wrong password", (done) => {
      chai
        .request(app)
        .post("/api/signin")
        .send({
          email: "user@test.com",
          password: "1testuser12",
        })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    it("should show status 200 with token correct login info", (done) => {
      chai
        .request(app)
        .post("/api/signin")
        .send({
          email: "user@test.com",
          password: "testuser",
        })
        .end((err, res) => {
          res.body.should.have.property("token");
          res.body.should.have.property("user");
          res.should.have.status(200);
          done();
        });
    });
  });

  describe("User Signup", () => {
    it("should signup user if user doesnt exist", (done) => {
      chai
        .request(app)
        .post("/api/signup")
        .send({
          email: "user11@test.com",
          name: "testuserone",
          password: "Testuser1",
          matchPassword: "Testuser1",
        })
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
    it("should not signup & show 403 if user email exist", (done) => {
      chai
        .request(app)
        .post("/api/signup")
        .send({
          email: "user@test.com",
          name: "testuserone",
          password: "Testuser1",
          matchPassword: "Testuser1",
        })
        .end((err, res) => {
          res.should.have.status(403);
          done();
        });
    });
    it("should not signup & show 403 if user name exist", (done) => {
      chai
        .request(app)
        .post("/api/signup")
        .send({
          email: "user1@test.com",
          name: "test user",
          password: "Testuser1",
          matchPassword: "Testuser1",
        })
        .end((err, res) => {
          if (err) {
            console.log(err);
          }
          res.should.have.status(403);
          done();
        });
    });
  });
  describe("Forgot Password", () => {
    it("should show status 400 if req does not contain body", (done) => {
      chai
        .request(app)
        .put("/api/forgot-password")
        .send({})
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });
    it("should show status 400 if req does not contain email", (done) => {
      chai
        .request(app)
        .put("/api/forgot-password")
        .send({ email: null })
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });
    it("should show status 401 if email does not exist", (done) => {
      chai
        .request(app)
        .put("/api/forgot-password")
        .send({ email: "null@test.com" })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
    it("should show status 200 with message if email exist", (done) => {
      chai
        .request(app)
        .put("/api/forgot-password")
        .send({ email: "user@test.com" })
        .end((err, res) => {
          res.body.message.should.equal(
            `Email has been sent to user@test.com. Follow the instructions to reset your password.`
          );
          res.should.have.status(200);
          done();
        });
    });
  });
  describe("Reset Password", () => {
    it("should show status 401 with invalid link", (done) => {
      chai
        .request(app)
        .put("/api/reset-password")
        .send({ resetPasswordLink: "notvalidtoken", newPassword: "Abcd1234" })
        .end((err, res) => {
          res.body.error.should.equal("Invalid Link!");
          res.should.have.status(401);
          done();
        });
    });
    it("should show status 400 with invalid password", (done) => {
      chai
        .request(app)
        .put("/api/reset-password")
        .send({ resetPasswordLink: "DoesntMatterAsItCheckPasswordFirst", newPassword: "Abcd" })
        .end((err, res) => {
          res.body.should.have.property("error");
          res.should.have.status(400);
          done();
        });
    });
    it("should have valid message with correct token and password", (done) => {
      User.findOne({ email: "user@test.com" }, function (err, data) {
        chai
          .request(app)
          .put("/api/reset-password")
          .send({ resetPasswordLink: data.token, newPassword: "Abcd1234" })
          .end((err, res) => {
            res.body.should.have.property("message");
            done();
          });
      });
    });
  });
});
