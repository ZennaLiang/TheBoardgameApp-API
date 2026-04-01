import User from "../../src/models/user";
import Event from "../../src/models/event";
import { createUser } from "../helper";
import app from "../../src/app";
import { expect } from "chai";
import { it, describe, before, after, beforeEach } from "mocha";
import { IUser, IEvent } from "../../src/types/index";
import request from "supertest";

let regUser: IUser;
let regUser2: IUser;
let adminUser: IUser;
let adminToken: string;
let regUserToken: string;
let regUser2Token: string;
let notLoginUser: IUser;
let event: IEvent;
let event2: IEvent;

describe("Event Controller", () => {
  before((done: Mocha.Done) => {
    regUser = createUser("regUser@test.com", "jane doe");
    regUser2 = createUser("regUser2@test.com", "john doe");
    notLoginUser = createUser("notlogin@test.com", "sam smith");
    adminUser = createUser("adminUser@test.com", "sam smith", "admin");

    event = new Event({
      title: "new event",
      startDate: new Date(),
      owner: regUser._id,
    }) as IEvent;
    event.save();
    setTimeout(function () {
      done();
    }, 500);
  });
  beforeEach((done: Mocha.Done) => {
    request(app)
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
          .end((_err: any, res: request.Response) => {
            expect(res).to.have.nested.property("body.token");
            regUser2Token = res.body.token;
            request(app)
              .post("/api/signin")
              .send({
                email: "adminUser@test.com",
                password: "Password1",
              })
              .end((_err: any, res: request.Response) => {
                expect(res).to.have.nested.property("body.token");
                adminToken = res.body.token;
                done();
              });
          });
      });
  });

  after((done: Mocha.Done) => {
    User.collection.drop();
    Event.collection.drop();
    done();
  });

  describe("Get event by eventId", () => {
    it("should show 401 if user not logged in", (done: Mocha.Done) => {
      request(app)
        .get(`/api/event/${event._id}`)
        .end((_err: any, res: request.Response) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"Unauthorized Access!"}'
          );
          expect(res).to.have.status(401);
          done();
        });
    });
    it("should show 400 if event doesnt exist", (done: Mocha.Done) => {
      request(app)
        .get(`/api/event/12`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .end((_err: any, res: request.Response) => {
          expect(res).to.have.status(400);
          done();
        });
    });
    it("should show 200 w/ event info if user logged in", (done: Mocha.Done) => {
      request(app)
        .get(`/api/event/${event._id}`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .end((_err: any, res: request.Response) => {
          expect(res).to.have.nested.property("body.title", "new event");
          expect(res).to.have.status(200);
          done();
        });
    });
  });
  describe("Get events by userId", () => {
    it("should show 401 if user not logged in", (done: Mocha.Done) => {
      request(app)
        .get(`/api/events/by/${notLoginUser._id}`)
        .end((_err: any, res: request.Response) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"Unauthorized Access!"}'
          );
          expect(res).to.have.status(401);
          done();
        });
    });
    it("should show 400 if user not found", (done: Mocha.Done) => {
      request(app)
        .get(`/api/events/by/123`)
        .end((_err: any, res: request.Response) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"User not found"}'
          );
          expect(res).to.have.status(400);
          done();
        });
    });
    it("should show 200 w/ empty array", (done: Mocha.Done) => {
      request(app)
        .get(`/api/events/by/${regUser2._id}`)
        .set("Authorization", `Bearer ${regUser2Token}`)
        .end((_err: any, res: request.Response) => {
          expect(res.body).to.be.an("array").that.is.empty;
          expect(res).to.have.status(200);
          done();
        });
    });
    it("should show 200 w/ array length 1", (done: Mocha.Done) => {
      event2 = new Event({
        title: "new event",
        startDate: new Date(),
        owner: regUser._id,
      }) as IEvent;
      event2.save();
      request(app)
        .get(`/api/events/by/${regUser._id}`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .end((_err: any, res: request.Response) => {
          expect(res.body).to.have.lengthOf(2);
          expect(res).to.have.status(200);
          done();
        });
    });
  });
  describe("Create new event", () => {
    it("should show 401 if user not logged in", (done: Mocha.Done) => {
      request(app)
        .post(`/api/event/new/${notLoginUser._id}`)
        .send({
          title: "new event2",
          startDate: new Date(),
          owner: notLoginUser._id,
        })
        .end((_err: any, res: request.Response) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"Unauthorized Access!"}'
          );
          expect(res).to.have.status(401);
          done();
        });
    });

    it("should show 200 when created by auth user", (done: Mocha.Done) => {
      request(app)
        .post(`/api/event/new/${regUser._id}`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .send({
          title: "new event2",
          startDate: new Date(),
        })
        .end((_err: any, res: request.Response) => {
          expect(res).to.have.nested.property("body.title", "new event2");
          expect(res).to.have.status(200);
          done();
        });
    });
  });
  describe("Update event", () => {
    it("should show 401 if user not logged in", (done: Mocha.Done) => {
      request(app)
        .put(`/api/event/${event._id}`)
        .send({
          title: "update event",
          startDate: new Date(),
        })
        .end((_err: any, res: request.Response) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"Unauthorized Access!"}'
          );
          expect(res).to.have.status(401);
          done();
        });
    });
    it("should show 403 if update by non admin/owner", (done: Mocha.Done) => {
      request(app)
        .put(`/api/event/${event._id}`)
        .set("Authorization", `Bearer ${regUser2Token}`)
        .send({
          title: "update event",
          startDate: new Date(),
        })
        .end((_err: any, res: request.Response) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"User is not authorized to perform this action"}'
          );
          expect(res).to.have.status(403);
          done();
        });
    });
    it("should show 200 if updated by owner", (done: Mocha.Done) => {
      request(app)
        .put(`/api/event/${event._id}`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .send({
          title: "update event",
          startDate: new Date(),
        })
        .end((_err: any, res: request.Response) => {
          expect(res).to.have.nested.property("body.title", "update event");
          expect(res).to.have.status(200);
          done();
        });
    });
    it("should show 200 if updated by admin", (done: Mocha.Done) => {
      request(app)
        .put(`/api/event/${event._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "update event again",
          startDate: new Date(),
        })
        .end((_err: any, res: request.Response) => {
          expect(res).to.have.nested.property(
            "body.title",
            "update event again"
          );
          expect(res).to.have.status(200);
          done();
        });
    });
  });
  describe("Delete event", () => {
    it("should show 401 if user not logged in", (done: Mocha.Done) => {
      request(app)
        .delete(`/api/event/${event._id}`)
        .send({
          title: "update event",
          startDate: new Date(),
        })
        .end((_err: any, res: request.Response) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"Unauthorized Access!"}'
          );
          expect(res).to.have.status(401);
          done();
        });
    });
    it("should show 403 if delete by non admin/owner", (done: Mocha.Done) => {
      request(app)
        .delete(`/api/event/${event._id}`)
        .set("Authorization", `Bearer ${regUser2Token}`)
        .end((_err: any, res: request.Response) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"User is not authorized to perform this action"}'
          );
          expect(res).to.have.status(403);
          done();
        });
    });
    it("should show 200 w/ array length 2 if delete by owner", (done: Mocha.Done) => {
      request(app)
        .delete(`/api/event/${event._id}`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .end((_err: any, res: request.Response) => {
          expect(res).to.have.status(200);
          request(app)
            .get(`/api/events/by/${regUser._id}`)
            .set("Authorization", `Bearer ${regUserToken}`)
            .end((_err: any, res: request.Response) => {
              expect(res.body).to.have.lengthOf(2);
              expect(res).to.have.status(200);
              done();
            });
        });
    });
    it("should show 200 w/ array length 1 if delete by admin", (done: Mocha.Done) => {
      request(app)
        .delete(`/api/event/${event2._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .end((_err: any, res: request.Response) => {
          expect(res).to.have.status(200);
          request(app)
            .get(`/api/events/by/${regUser._id}`)
            .set("Authorization", `Bearer ${regUserToken}`)
            .end((_err: any, res: request.Response) => {
              expect(res.body).to.have.lengthOf(1);
              expect(res).to.have.status(200);
              done();
            });
        });
    });
  });
});
