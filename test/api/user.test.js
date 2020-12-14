const User = require("../../models/user");
const app = require("../../app"); // my express app
const chai = require("chai");
const chaiHttp = require("chai-http");
const { expect } = require("chai");
const { it } = require("mocha");
const should = chai.should();

describe("User Controller", () => {
  let regUser;
  let regUser2;
  let adminUser;
  before((done) => {
    regUser = new User({
      email: "user1@test.com",
      name: "janedoe",
      password: "testuser",
    });
    regUser2 = new User({
      email: "user2@test.com",
      name: "johndoe",
      password: "testuser",
    });
    adminUser = new User({
      email: "user3@test.com",
      name: "sam smith",
      password: "testuser",
      role: "admin",
    });
    regUser.save();
    regUser2.save();
    adminUser.save();
    setTimeout(function () {
      done();
    }, 500);
  });

  after((done) => {
    User.deleteMany();
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
        .get("/api/user/find/janedoe")
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
        .get(`/api/user/${regUser._id}`)
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
        .post("/api/signin")
        .send({
          email: "user1@test.com",
          password: "testuser",
        })
        .end((err, res) => {
          expect(res).to.have.nested.property("body.token");
          chai
            .request(app)
            .get(`/api/user/${regUser._id}`)
            .set("Authorization", `Bearer ${res.body.token}`)
            .end((err, res) => {
              expect(res).to.have.nested.property("body.name");
              expect(res).to.not.have.nested.property("body.hashed_password");
              expect(res).to.not.have.nested.property("body.salt");
              expect(res).to.have.status(200);
              done();
            });
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
          expect(res.body).to.have.lengthOf(3);
          done();
        });
    });
  });
  describe("update user", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .put(`/api/user/${regUser._id}`)
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
        .post("/api/signin")
        .send({
          email: "user2@test.com",
          password: "testuser",
        })
        .end((err, res) => {
          expect(res).to.have.nested.property("body.token");
          chai
            .request(app)
            .put(`/api/user/${regUser._id}`)
            .set("Authorization", `Bearer ${res.body.token}`)
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
    });
    it("should show 200 when updated by admin", (done) => {
      chai
        .request(app)
        .post("/api/signin")
        .send({
          email: "user3@test.com",
          password: "testuser",
        })
        .end((err, res) => {
          expect(res).to.have.nested.property("body.token");
          chai
            .request(app)
            .put(`/api/user/${regUser._id}`)
            .set("Authorization", `Bearer ${res.body.token}`)
            .set("Accept", "application/json")
            .field("about", "here")
            .end((err, res) => {
              expect(res).to.have.nested.property("body.user.about", "here");
              expect(res).to.have.status(200);
              done();
            });
        });
    });
    it("should show 200 when updated by owner", (done) => {
      chai
        .request(app)
        .post("/api/signin")
        .send({
          email: "user1@test.com",
          password: "testuser",
        })
        .end((err, res) => {
          expect(res).to.have.nested.property("body.token");
          chai
            .request(app)
            .put(`/api/user/${regUser._id}`)
            .set("Authorization", `Bearer ${res.body.token}`)
            .set("Accept", "application/json")
            .field("about", "here")
            .end((err, res) => {
              expect(res).to.have.nested.property("body.user.about", "here");
              expect(res).to.have.status(200);
              done();
            });
        });
    });
    it("should show 200 when updated by owner", (done) => {
      chai
        .request(app)
        .post("/api/signin")
        .send({
          email: "user1@test.com",
          password: "testuser",
        })
        .end((err, res) => {
          expect(res).to.have.nested.property("body.token");
          chai
            .request(app)
            .put(`/api/user/${regUser._id}`)
            .set("Authorization", `Bearer ${res.body.token}`)
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
          userId: regUser._id,
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
        .post("/api/signin")
        .send({
          email: "user1@test.com",
          password: "testuser",
        })
        .end((err, res) => {
          expect(res).to.have.nested.property("body.token");
          chai
            .request(app)
            .put(`/api/user/follow`)
            .set("Authorization", `Bearer ${res.body.token}`)
            .send({
              userId: regUser._id,
              followId: regUser2._id,
            })
            .end((err, res) => {
              expect(res).to.have.nested.property(
                "body.followers[0].name",
                "janedoe"
              );
              expect(res).to.have.status(200);
              done();
            });
        });
    });
  });
  describe("unfollow user", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .put(`/api/user/unfollow`)
        .send({
          userId: regUser._id,
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
        .post("/api/signin")
        .send({
          email: "user1@test.com",
          password: "testuser",
        })
        .end((err, res) => {
          expect(res).to.have.nested.property("body.token");
          chai
            .request(app)
            .put(`/api/user/unfollow`)
            .set("Authorization", `Bearer ${res.body.token}`)
            .send({
              userId: regUser._id,
              unfollowId: regUser2._id,
            })
            .end((err, res) => {
              expect(res).to.not.have.nested.property(
                "body.followers[0].name",
                "janedoe"
              );
              expect(res).to.have.status(200);
              done();
            });
        });
    });
  });
  describe("delete user", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .delete(`/api/user/${regUser._id}`)
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
        .post("/api/signin")
        .send({
          email: "user2@test.com",
          password: "testuser",
        })
        .end((err, res) => {
          expect(res).to.have.nested.property("body.token");
          chai
            .request(app)
            .delete(`/api/user/${regUser._id}`)
            .set("Authorization", `Bearer ${res.body.token}`)
            .end((err, res) => {
              expect(res).to.have.nested.property(
                "text",
                '{"error":"User is not authorized to perform this action"}'
              );
              expect(res).to.have.status(403);
              done();
            });
        });
    });
    it("should show 200 when delete by admin", (done) => {
      chai
        .request(app)
        .post("/api/signin")
        .send({
          email: "user1@test.com",
          password: "testuser",
        })
        .end((err, res) => {
          expect(res).to.have.nested.property("body.token");
          chai
            .request(app)
            .delete(`/api/user/${regUser._id}`)
            .set("Authorization", `Bearer ${res.body.token}`)
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
    });
    it("should show 200 when delete by owner", (done) => {
      chai
        .request(app)
        .post("/api/signin")
        .send({
          email: "user2@test.com",
          password: "testuser",
        })
        .end((err, res) => {
          expect(res).to.have.nested.property("body.token");
          chai
            .request(app)
            .delete(`/api/user/${regUser2._id}`)
            .set("Authorization", `Bearer ${res.body.token}`)
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
    });
  });
});
