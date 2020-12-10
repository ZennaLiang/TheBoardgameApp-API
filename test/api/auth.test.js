const User = require("../../models/user");
const app = require("../../app"); // my express app
const chai = require("chai");
const chaiHttp = require("chai-http");
const { expect } = require("chai");
const should = chai.should();

describe("AuthController", () => {
  before((done) => {
    const user = {
      email: "user@test.com",
      name: "test user",
      password: "testuser",
    };
    const nUser = new User(user);
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
          res.body.should.have.property('token');
          res.body.should.have.property('user');
          res.should.have.status(200);
          done();
        });
    });
  });

  describe("User Signup", () => {
    const user = {
      email: "user11@test.com",
      name: "testuserone",
      password: "Testuser1",
      matchPassword: "Testuser1",
    };
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
});
