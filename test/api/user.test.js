const User = require("../../models/user");
const app = require("../../app"); // my express app
const chai = require("chai");
const chaiHttp = require("chai-http");
const { expect } = require("chai");
const { it } = require("mocha");
const should = chai.should();
let regUserToken;
let regUser2Token;
let adminToken;
let regUser;
let regUser2;
let notLoginUser;
let adminUser;
/**
 * regUser, regUser2, & adminUser are logged in with token
 * regUser has photo
 * adminUser has "admin" role
 */
describe("User Controller", () => {
  before((done) => {
    regUser = new User({
      email: "regUser@test.com",
      name: "jane doe",
      password: "Password1",
    });
    regUser2 = new User({
      email: "regUser2@test.com",
      name: "john doe",
      password: "Password1",
    });
    notLoginUser = new User({
      email: "notlogin@test.com",
      name: "sam smith",
      password: "Password1",
    });
    adminUser = new User({
      email: "adminUser@test.com",
      name: "sam smith",
      password: "Password1",
      role: "admin",
    });
    regUser.save();
    regUser2.save();
    notLoginUser.save();
    adminUser.save();
    setTimeout(function () {
      done();
    }, 500);
  });
  beforeEach((done) => {
    chai
      .request(app)
      .post("/api/signin")
      .send({
        email: "regUser@test.com",
        password: "Password1",
      })
      .end((err, res) => {
        expect(res).to.have.nested.property("body.token");
        regUserToken = res.body.token;
        chai
          .request(app)
          .post("/api/signin")
          .send({
            email: "regUser2@test.com",
            password: "Password1",
          })
          .end((err, res) => {
            expect(res).to.have.nested.property("body.token");
            regUser2Token = res.body.token;
            chai
              .request(app)
              .post("/api/signin")
              .send({
                email: "adminUser@test.com",
                password: "Password1",
              })
              .end((err, res) => {
                expect(res).to.have.nested.property("body.token");
                adminToken = res.body.token;
                done();
              });
          });
      });
  });
  after((done) => {
    User.collection.drop();
    done();
  });

  describe("find user by name", () => {
    it("should show status 404 if username not exist", (done) => {
      chai
        .request(app)
        .get(`/api/user/find/jane`)
        .send()
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res).to.have.nested.property("body.error");
          done();
        });
    });
    it("should show status 200 if username exist", (done) => {
      chai
        .request(app)
        .get("/api/user/find/jane doe")
        .send()
        .end((err, res) => {
          expect(res).to.have.nested.property("body.user");
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
  describe("get user", () => {
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
    it("should show status 401 if user did not log in", (done) => {
      chai
        .request(app)
        .get(`/api/user/${notLoginUser._id}`)
        .send()
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"Unauthorized Access!"}'
          );
          expect(res).to.have.status(401);
          done();
        });
    });
    it("should show status 200 w/ user info if user log in", (done) => {
      chai
        .request(app)
        .get(`/api/user/${regUser._id}`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .end((err, res) => {
          expect(res).to.have.nested.property("body.name");
          expect(res).to.not.have.nested.property("body.hashed_password");
          expect(res).to.not.have.nested.property("body.salt");
          expect(res).to.have.status(200);
          done();
        });
    });
  });
  describe("find all user", () => {
    it("should return list with 3 users", (done) => {
      chai
        .request(app)
        .get(`/api/users`)
        .send()
        .end((err, res) => {
          expect(res.body).to.have.lengthOf(4);
          done();
        });
    });
  });
  describe("update user", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .put(`/api/user/${notLoginUser._id}`)
        .type("form")
        .send({
          about: "hello",
        })
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"Unauthorized Access!"}'
          );
          expect(res).to.have.status(401);
          done();
        });
    });
    it("should show 403 when updated by someone that is not the owner nor admin", (done) => {
      chai
        .request(app)
        .put(`/api/user/${regUser._id}`)
        .set("Authorization", `Bearer ${regUser2Token}`)
        .type("form")
        .send({
          about: "hello",
        })
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"User is not authorized to perform this action"}'
          );
          expect(res).to.have.status(403);
          done();
        });
    });
    it("should show 200 w/ update when updated by admin", (done) => {
      chai
        .request(app)
        .put(`/api/user/${regUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json")
        .field("about", "here")
        .end((err, res) => {
          expect(res).to.have.nested.property("body.user.about", "here");
          expect(res).to.have.status(200);
          done();
        });
    });
    it("should show 200 w/ update when updated by owner", (done) => {
      chai
        .request(app)
        .put(`/api/user/${regUser._id}`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .set("Accept", "application/json")
        .field("about", "here")
        .attach("photo", "./test/defaultProfile.png")
        .end((err, res) => {
          expect(res).to.have.nested.property("body.user.photo");
          expect(res).to.have.nested.property("body.user.about", "here");
          expect(res).to.have.status(200);
          done();
        });
    });
  });
  describe("get user photo", () => {
    it("should contain data if user have photo", (done) => {
      chai
        .request(app)
        .get(`/api/user/photo/${regUser._id}`)
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "header.content-type",
            "application/octet-stream"
          );

          done();
        });
    });
    it("should not contain data if user does not have a photo", (done) => {
      chai
        .request(app)
        .get(`/api/user/photo/${regUser2._id}`)
        .end((err, res) => {
          expect(res).to.not.have.nested.property("header.content-type");
          expect(res).to.have.status(200);
          done();
        });
    });
  });
  describe("follow user", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .put(`/api/user/follow`)
        .send({
          userId: notLoginUser._id,
          followId: regUser2._id,
        })
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"Unauthorized Access!"}'
          );
          expect(res).to.have.status(401);
          done();
        });
    });
    it("should 200 if user logged in", (done) => {
      chai
        .request(app)
        .put(`/api/user/follow`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .send({
          userId: regUser._id,
          followId: regUser2._id,
        })
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "body.followers[0].name",
            "jane doe"
          );
          expect(res).to.have.status(200);
          done();
        });
    });
  });
  describe("unfollow user", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .put(`/api/user/unfollow`)
        .send({
          userId: notLoginUser,
          followId: regUser2._id,
        })
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"Unauthorized Access!"}'
          );
          expect(res).to.have.status(401);
          done();
        });
    });
    it("should 200 if user logged in", (done) => {
      chai
        .request(app)
        .put(`/api/user/unfollow`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .send({
          userId: regUser._id,
          unfollowId: regUser2._id,
        })
        .end((err, res) => {
          expect(res).to.not.have.nested.property(
            "body.followers[0].name",
            "jane doe"
          );
          expect(res).to.have.status(200);
          done();
        });
    });
  });
  describe("delete user", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .delete(`/api/user/${notLoginUser._id}`)
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"Unauthorized Access!"}'
          );
          expect(res).to.have.status(401);
          done();
        });
    });
    it("should show 403 when delete by someone that is not the owner nor admin", (done) => {
      chai
        .request(app)
        .delete(`/api/user/${regUser._id}`)
        .set("Authorization", `Bearer ${regUser2Token}`)
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"User is not authorized to perform this action"}'
          );
          expect(res).to.have.status(403);
          done();
        });
    });
    it("should show 200 when delete by admin", (done) => {
      let temp = new User({
        email: "regUser2@test.com",
        name: "john doe",
        password: "Password1",
      });
      temp.save();
      chai
        .request(app)
        .delete(`/api/user/${temp._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send()
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"message":"User deleted successfully"}'
          );
          expect(res).to.have.status(200);
          done();
        });
    });
    it("should show 200 w/ 3 users when delete by owner", (done) => {
      chai
        .request(app)
        .delete(`/api/user/${regUser2._id}`)
        .set("Authorization", `Bearer ${regUser2Token}`)
        .send()
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"message":"User deleted successfully"}'
          );
          expect(res).to.have.status(200);
          chai
            .request(app)
            .get(`/api/users`)
            .send()
            .end((err, res) => {
              expect(res.body).to.have.lengthOf(3);
              done();
            });
        });
    });
  });
});
