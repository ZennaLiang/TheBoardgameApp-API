const chai = require("chai");
const chaiHttp = require("chai-http");

chai.use(chaiHttp);

require("./api/auth.test");
require("./api/user.test");
require("./api/event.test");
require("./api/post.test");
