exports.createPostValidator = (req, res, next) => {
  // title
  req.check("title", "Write a title").notEmpty();
  req.check("title", "Title must be between 4 to 150 characters").isLength({
    min: 4,
    max: 150
  });
  // body
  req.check("body", "Write a body").notEmpty();
  req.check("body", "Body must be between 4 to 2000 characters").isLength({
    min: 4,
    max: 2000
  });
  // check for errors
  const errors = req.validationErrors();
  // if error show the first one as they happen
  if (errors) {
    const firstError = errors.map(error => error.msg)[0];
    return res.status(400).json({ error: firstError });
  }
  // proceed to next middleware
  next();
};

exports.userSignupValidator = (req, res, next) => {
  // name is not null and between 4-10 characters
  req.check("name", "Name is required").notEmpty();
  req.check("email", "Email is required").notEmpty();
  req.check("password", "Password is required").notEmpty();
  req.check("matchPassword", "Please retype password").notEmpty();

  req
    .check("name")
    .isAlpha()
    .withMessage("Name can only contain alphabets")
    .isLength({ min: 2 })
    .withMessage("Name must have at least 2 or more characters");

  // email is not null, valid and normalized
  req
    .check("email", "Email must be between 3 to 32 characters")
    .isLength({
      min: 4,
      max: 2000
    })
    .matches(
      /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/
    )
    .withMessage("Please enter valid email address")
    .isLength({
      min: 4,
      max: 1000
    })
    .withMessage("Please enter valid email address");

  // check for password
 
  req
    .check("password")
    .isLength({ min: 6 })
    .withMessage("Password must contain at least 6 characters")
    .matches(/\d/)
    .withMessage("Password must contain number")
    .matches(/(?=.*[A-Z])/)
    .withMessage("Password must contain at least 1 uppercase alphabetical character")
    .custom(() => {
      if (req.body.password === req.body.matchPassword) return true;
      return false;
    })
    .withMessage("Password does not match");
  // check for errors
  const errors = req.validationErrors();
  // if error show the first one as they happen
  if (errors) {
    const firstError = errors.map(error => error.msg)[0];
    return res.status(400).json({ error: firstError });
  }
  // proceed to next middleware
  next();
};

exports.passwordResetValidator = (req, res, next) => {
  // check for password
  req.check("newPassword", "Password is required").notEmpty();
  req
    .check("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 chars long")
    .matches(/\d/)
    .withMessage("must contain a number")
    .withMessage("Password must contain a number");

  // check for errors
  const errors = req.validationErrors();
  // if error show the first one as they happen
  if (errors) {
    const firstError = errors.map(error => error.msg)[0];
    return res.status(400).json({ error: firstError });
  }
  // proceed to next middleware or ...
  next();
};
