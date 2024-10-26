const UserService = require("../services/UserService");
exports.loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserService.login(email, password);

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.signupAdmin = async (req, res) => {
  try {
    const user = await UserService.signupAdmin(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, email, tableNumber } = req.body;

    const user = await UserService.createUser(username, email, tableNumber);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllUesrs = async (req, res) => {
  try {
    const users = await UserService.getAllUesrs();
    res.status(200).send(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.getAllUserswithAdmin = async (req, res) => {
  
  try {

      
          const users = await UserService.getAllUserswithAdmin();
    res.status(200).send(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};





const mongoose = require("mongoose");

exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;


    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID format");
    }

    const deletedUser = await UserService.getUserById(id)
    res.status(200).send(deletedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const user = await UserService.deleteUserById(req.params.id);
    res.status(201).send("حذف الزبون بنجاح");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUserTable = async (req, res) => {
  try {
    const { userId } = req.body;

    const users = await UserService.getUserTable(userId);
    res.status(200).send(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUserId = async (req, res) => {
  try {
    const { userId } = req.body;

    const users = await UserService.getUserId(userId);
    res.status(200).send(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
