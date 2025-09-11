import User from "../src/models/user";
import { IUser } from "../src/types/index";

export const createUser = (email: string, name: string, role: string = "subscriber"): IUser => {
    const user = new User({
        email: email,
        name: name,
        role: role,
        password: "Password1",
    });
    user.save();
    return user;
};
