import chai from 'chai';
import chaiHttp from 'chai-http';

chai.use(chaiHttp);

import './api/auth.test';
import './api/user.test';
import './api/event.test';