import User from "../../src/models/user";
import app from "../../src/app";
import { createUser } from "../helper";
import { expect } from "chai";
import { it, describe, before, after } from "mocha";
import { IUser } from "../../src/types/index";
import request from "supertest";

describe("AuthController", () => {
  before((done: Mocha.Done) => {
    createUser("regUser@test.com", "john doe");
    setTimeout(function () {
      done();
    }, 500);
  });

  after((done: Mocha.Done) => {
    User.collection.drop();
    done();
  });

  describe("User login", () => {
    it("should show status 401 with wrong email", (done: Mocha.Done) => {
      request(app)
        .post("/api/signin")
        .send({
          email: "userwrong@test.com",
          password: "Password1",
        })
        .expect(401, done);
    });

    it("should show status 401 with wrong password", (done: Mocha.Done) => {
      request(app)
        .post("/api/signin")
        .send({
          email: "regUser@test.com",
          password: "Password112",
        })
        .expect(401, done);
    });

    it("should show status 200 with token correct login info", (done: Mocha.Done) => {
      request(app)
        .post("/api/signin")
        .send({
          email: "regUser@test.com",
          password: "Password1",
        })
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body).to.have.property("token");
          expect(res.body).to.have.property("user");
        })
        .end(done);
    });
  });

  describe("User Signup", () => {
    it("should signup user if user doesnt exist", (done: Mocha.Done) => {
      request(app)
        .post("/api/signup")
        .send({
          email: "newUser@test.com",
          name: "sam",
          password: "Password1",
          matchPassword: "Password1",
        })
        .expect(200, done);
    });
    it("should not signup & show 403 if user email exist", (done: Mocha.Done) => {
      request(app)
        .post("/api/signup")
        .send({
          email: "regUser@test.com",
          name: "john do",
          password: "Password1",
          matchPassword: "Password1",
        })
        .expect(403, done);
    });
    it("should not signup & show 403 if user name exist", (done: Mocha.Done) => {
      request(app)
        .post("/api/signup")
        .send({
          email: "regUser2@test.com",
          name: "john doe",
          password: "Password1",
          matchPassword: "Password1",
        })
        .expect(403)
        .end((_err: any) => {
          if (_err) {
            console.log(_err);
          }
          done();
        });
    });
  });
  describe("Forgot Password", () => {
    it("should show status 400 if req does not contain body", (done: Mocha.Done) => {
      request(app)
        .put("/api/forgot-password")
        .send({})
        .expect(400, done);
    });
    it("should show status 400 if req does not contain email", (done: Mocha.Done) => {
      request(app)
        .put("/api/forgot-password")
        .send({ email: null })
        .expect(400, done);
    });
    it("should show status 401 if email does not exist", (done: Mocha.Done) => {
      request(app)
        .put("/api/forgot-password")
        .send({ email: "null@test.com" })
        .expect(401, done);
    });
    it("should show status 200 with message if email exist", (done: Mocha.Done) => {
      request(app)
        .put("/api/forgot-password")
        .send({ email: "regUser@test.com" })
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.message).to.equal(
            `Email has been sent to regUser@test.com. Follow the instructions to reset your password.`
          );
        })
        .end(done);
    });
  });

  describe("Reset Password", () => {
    it("should show status 401 with invalid link", (done: Mocha.Done) => {
      request(app)
        .put("/api/reset-password")
        .send({ resetPasswordLink: "notvalidtoken", newPassword: "Abcd1234" })
        .expect(401)
        .expect((res: request.Response) => {
          expect(res.body.error).to.equal("Invalid Link!");
        })
        .end(done);
    });
    it("should show status 400 with invalid password", (done: Mocha.Done) => {
      request(app)
        .put("/api/reset-password")
        .send({
          resetPasswordLink: "DoesntMatterAsItCheckPasswordFirst",
          newPassword: "Abcd",
        })
        .expect(400)
        .expect((res: request.Response) => {
          expect(res.body).to.have.property("error");
        })
        .end(done);
    });
    it("should have valid message with correct token and password", (done: Mocha.Done) => {
      User.findOne({ email: "regUser@test.com" }, function (_err: any, data: IUser) {
        request(app)
          .put("/api/reset-password")
          .send({ resetPasswordLink: data.token, newPassword: "Abcd1234" })
          .expect((res: request.Response) => {
            expect(res.body).to.have.property("message");
          })
          .end(done);
      });
    });
  });
});
