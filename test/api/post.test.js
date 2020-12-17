const User = require("../../models/user");
const Post = require("../../models/post");
const { createUser } = require("../helper");
const app = require("../../app");
const chai = require("chai");
const chaiHttp = require("chai-http");
const { expect } = require("chai");
const { it } = require("mocha");
const should = chai.should();

let regUser;
let regUser2;
let adminUser;
let adminToken;
let regUserToken;
let regUser2Token;
let notLoginUser;
let post;
let comment;
describe("Post Controller", () => {
  before((done) => {
    regUser = createUser("regUser@test.com", "jane doe");
    regUser2 = createUser("regUser2@test.com", "john doe");
    notLoginUser = createUser("notlogin@test.com", "sam smith");
    adminUser = createUser("adminUser@test.com", "sam smith", "admin");
    post = new Post({
      title: "new post",
      body: "At vim hinc civibus.",
      startDate: new Date(),
      postedBy: regUser._id,
    });
    post.save();
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
    Post.collection.drop();
    done();
  });
  describe("Get post by postId", () => {
    it("should show 400 if post doesnt exist", (done) => {
      chai
        .request(app)
        .get(`/api/post/12`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
    it("should show 200 w/ post info ", (done) => {
      chai
        .request(app)
        .get(`/api/post/${post._id}`)
        .end((err, res) => {
          expect(res).to.have.nested.property("body.title", "new post");
          expect(res).to.have.status(200);
          done();
        });
    });
  });
  describe("Get posts", () => {
    it("should show 200 w length of 1", (done) => {
      chai
        .request(app)
        .get(`/api/posts`)
        .end((err, res) => {
          expect(res.body).to.have.lengthOf(1);
          expect(res).to.have.status(200);
          done();
        });
    });
  });
  describe("Get posts by userId", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .get(`/api/posts/by/${notLoginUser._id}`)
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"Unauthorized Access!"}'
          );
          expect(res).to.have.status(401);
          done();
        });
    });
    it("should show 400 if user not found", (done) => {
      chai
        .request(app)
        .get(`/api/posts/by/123`)
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"User not found"}'
          );
          expect(res).to.have.status(400);
          done();
        });
    });
    it("should show 200 w/ empty array", (done) => {
      chai
        .request(app)
        .get(`/api/posts/by/${regUser2._id}`)
        .set("Authorization", `Bearer ${regUser2Token}`)
        .end((err, res) => {
          expect(res.body).to.be.an("array").that.is.empty;
          expect(res).to.have.status(200);
          done();
        });
    });
    it("should show 200 w/ array length 2", (done) => {
      post2 = new Post({
        title: "new post2",
        body: "At vim hinc civibus.",
        startDate: new Date(),
        postedBy: regUser._id,
      });
      post2.save();
      chai
        .request(app)
        .get(`/api/posts/by/${regUser._id}`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .end((err, res) => {
          expect(res.body).to.have.lengthOf(2);
          expect(res).to.have.status(200);
          done();
        });
    });
  });
  describe("Like post", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .put(`/api/post/like`)
        .send({
          postId: post._id,
          userId: regUser2._id,
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
    it("should show 200 w/ length of 1 if user logged in", (done) => {
      chai
        .request(app)
        .put(`/api/post/like`)
        .set("Authorization", `Bearer ${regUser2Token}`)
        .send({
          postId: post._id,
          userId: regUser2._id,
        })
        .end((err, res) => {
          expect(res.body.likes).to.have.lengthOf(1);
          expect(res).to.have.status(200);
          done();
        });
    });
  });

  describe("Unlike post", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .put(`/api/post/unlike`)
        .send({
          postId: post._id,
          userId: regUser2._id,
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
    it("should show 200 w/ length of 0 if user logged in", (done) => {
      chai
        .request(app)
        .put(`/api/post/unlike`)
        .set("Authorization", `Bearer ${regUser2Token}`)
        .send({
          postId: post._id,
          userId: regUser2._id,
        })
        .end((err, res) => {
          expect(res.body.likes).to.have.lengthOf(0);
          expect(res).to.have.status(200);
          done();
        });
    });
  });

  describe("Comment post", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .put(`/api/post/comment`)
        .send({
          postId: post._id,
          userId: regUser2._id,
          comment: { text: "awesome post" },
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
    it("should show 200 w/ length of 1 if user logged in", (done) => {
      chai
        .request(app)
        .put(`/api/post/comment`)
        .set("Authorization", `Bearer ${regUser2Token}`)
        .set("Accept", "application/json")
        .send({
          postId: post._id,
          userId: regUser2._id,
          comment: { text: "awesome post" },
        })
        .end((err, res) => {
          expect(res.body.comments).to.have.lengthOf(1);
          expect(res).to.have.status(200);
          comment = res.body.comments[0];
          done();
        });
    });
    it("should show 400 if post not found", (done) => {
      chai
        .request(app)
        .put(`/api/post/comment`)
        .set("Authorization", `Bearer ${regUser2Token}`)
        .set("Accept", "application/json")
        .send({
          postId: "19292929",
          userId: regUser2._id,
          comment: { text: "awesome post" },
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  describe("Uncomment post", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .put(`/api/post/uncomment`)
        .send({
          postId: post._id,
          userId: regUser2._id,
          comment: comment,
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
    it("should show 200 w/ length of 0 if user logged in", (done) => {
      chai
        .request(app)
        .put(`/api/post/uncomment`)
        .set("Authorization", `Bearer ${regUser2Token}`)
        .set("Accept", "application/json")
        .send({
          postId: post._id,
          userId: regUser2._id,
          comment: comment,
        })
        .end((err, res) => {
          expect(res.body.comments).to.have.lengthOf(0);
          expect(res).to.have.status(200);
          done();
        });
    });
    it("should show 400 if post not found", (done) => {
      chai
        .request(app)
        .put(`/api/post/uncomment`)
        .set("Authorization", `Bearer ${regUser2Token}`)
        .set("Accept", "application/json")
        .send({
          postId: "19292929",
          userId: regUser2._id,
          comment: comment,
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });
});
