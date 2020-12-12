const User = require("../../models/user");
const app = require("../../app"); // my express app
const chai = require("chai");
const chaiHttp = require("chai-http");
const { expect } = require("chai");
const { it } = require("mocha");
const should = chai.should();

describe("User Controller", () => {
  let nUser;
  let token;
  before((done) => {
    nUser = new User({
      email: "user12@test.com",
      name: "janedoe",
      password: "testuser",
    });
    nUser.save();

    setTimeout(function () {
      done();
    }, 500);
  });

  after((done) => {
    User.deleteMany();
    done();
  });

  describe("findUserByName", () => {
    it("should show status 404 if username not exist", (done) => {
      chai
        .request(app)
        .get(`/api/user/find/jane`)
        .send()
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("error");
          done();
        });
    });
    it("should show status 200 if username exist", (done) => {
      chai
        .request(app)
        .get("/api/user/find/janedoe")
        .send()
        .end((err, res) => {
          expect(res.body).to.have.property("user");
          expect(res).to.have.status(200);
          done();
        });
    });
    it("should show status 400 if no username sent", (done) => {
      chai
        .request(app)
        .get("/api/user/find/")
        .send()
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });
  describe("getUser", () => {
    it("should show status 400 if no userId sent", (done) => {
      chai
        .request(app)
        .get(`/api/user/`)
        .send()
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });
    it("should show status 401 if userId sent by unauthorized user", (done) => {
      chai
        .request(app)
        .get(`/api/user/${nUser._id}`)
        .send()
        .end((err, res) => {
          expect(res.text).to.equal('{"error":"Unauthorized Access!"}');
          expect(res).to.have.status(401);
          done();
        });
    });
    it("should show status 200 if userId sent by authorized user", (done) => {
      chai
        .request(app)
        .post("/api/signin")
        .send({
          email: "user12@test.com",
          password: "testuser",
        })
        .end((err, res) => {
          token = res.body.token;
          chai
            .request(app)
            .get(`/api/user/${nUser._id}`)
            .set("Authorization", `Bearer ${token}`)
            .end((err, res) => {
              expect(res).to.have.status(200);
              done();
            });
        });
    });
  });
});

