const User = require("../models/user");

exports.createUser = (email, name, role = "subscriber") =>{
    let user = new User({
        email: email,
        name: name,
        role: role,
        password: "Password1",
    })
    user.save();
    return user;
}
