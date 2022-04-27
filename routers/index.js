/**
 * The router module used to define routes
 */
const express = require("express");
const md5 = require("blueimp-md5");

const UserModel = require("../models/UserModel");
const CategoryModel = require("../models/CategoryModel");
const ProductModel = require("../models/ProductModel");
const RoleModel = require("../models/RoleModel");

//token expiration time
const TOKEN_DURATION = 1000 * 60 * 60 * 24;
// Get the router object
const router = express.Router();
// console.log('router', router)

// Specify the attributes to filter
const filter = { password: 0, __v: 0 };

// login
router.post("/login", (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;

  // Query the database users based on username and password.
  // If no, return error message, if yes, return login success message (including user)
  UserModel.findOne({ username, password: md5(password) })
    .then((user) => {
      if (user) {
        // After the login is successful, a cookie (userid: user._id) is generated and saved to the browser
        // res.cookie("userid", user._id, { maxAge: 1000 * 60 * 60 * 24 });

        // After the login is successful, add expiration time to user ,and return the user.
        const currentTime = new Date().getTime();
        user._doc.expirationTime = currentTime + TOKEN_DURATION;
        // console.log(user.expirationTime);

        if (user.role_id) {
          RoleModel.findOne({ _id: user.role_id }).then((role) => {
            user._doc.role = role;
            console.log("role user", user);
            res.send({ status: 0, data: user });
          });
        } else {
          user._doc.role = { menus: [] };
          // Return login success information (including user)
          res.send({ status: 0, data: user });
        }
      } else {
        // Login failed
        res.send({
          status: 1,
          // msg: 'Incorrect username or password:' + username + password,
          msg: "Incorrect username or password!",
        });
      }
    })
    .catch((error) => {
      console.error("Login exception", error);
      res.send({ status: 1, msg: "Login error, please try again." });
    });
});

// Add user
router.post("/manage/user/add", (req, res) => {
  const { user } = req.body;
  const { username, password } = user;
  // Processing: Determine whether the user already exists, if so, return an error message, if not, save
  UserModel.findOne({ username })
    .then((_user) => {
      if (_user) {
        res.send({ status: 1, msg: "This user already exists." });
        return new Promise(() => {});
      } else {
        return UserModel.create({
          ...user,
          password: md5(password || "2233"),
        });
      }
    })
    .then((user) => {
      //Returns json data containing user
      res.send({ status: 0, data: user });
    })
    .catch((error) => {
      console.error("Register exception", error);
      res.send({ status: 1, msg: "Add user exception, please try again." });
    });
});

// update user
router.post("/manage/user/update", (req, res) => {
  const { user } = req.body;
  UserModel.findOneAndUpdate({ _id: user._id }, user)
    .then((oldUser) => {
      const data = Object.assign(oldUser, user);
      res.send({ status: 0, data });
    })
    .catch((error) => {
      console.error("Update user exception", error);
      res.send({ status: 1, msg: "Update user exception, please try again." });
    });
});

// delete users
router.post("/manage/user/delete", (req, res) => {
  const { userId } = req.body;
  UserModel.deleteOne({ _id: userId }).then((doc) => {
    res.send({ status: 0 });
  });
});

// get a list of all users
router.get("/manage/user/list", (req, res) => {
  UserModel.find({ username: { $ne: "admin" } })
    .then((users) => {
      RoleModel.find().then((roles) => {
        res.send({ status: 0, data: { users, roles } });
      });
    })
    .catch((error) => {
      console.error("Get user list exception", error);
      res.send({
        status: 1,
        msg: "Error getting user list, please try again.",
      });
    });
});

// add category
router.post("/manage/category/add", (req, res) => {
  const { categoryName, parentId } = req.body;
  CategoryModel.create({ name: categoryName, parentId: parentId || "0" })
    .then((category) => {
      res.send({ status: 0, data: category });
    })
    .catch((error) => {
      console.error("Add category exception", error);
      res.send({ status: 1, msg: "Add category exception, please try again." });
    });
});

// delete category
router.post("/manage/category/delete", (req, res) => {
  const { categoryId } = req.body;
  CategoryModel.deleteOne({ _id: categoryId }, { parentId: categoryId })
    .then(() => {
      CategoryModel.deleteMany({ parentId: categoryId }).then(() => {
        res.send({ status: 0 });
      });
    })
    .catch((error) => {
      console.error("Delete category exceptions", error);
      res.send({
        status: 1,
        msg: "Delete categoryn exception, please try again.",
      });
    });
});

// Get the category list
router.get("/manage/category/list", (req, res) => {
  const parentId = req.query.parentId || "0";
  let categories;
  //if -1, get all categories and sub categories in one list
  if (parentId === "-1") {
    categories = CategoryModel.find();
  }
  //if not -1, get categories by parentId
  if (parentId !== "-1") {
    categories = CategoryModel.find({ parentId });
  }

  categories
    .then((categorys) => {
      res.send({ status: 0, data: categorys });
    })
    .catch((error) => {
      console.error("Get category list exception", error);
      res.send({
        status: 1,
        msg: "Get category list exception, please try again.",
      });
    });
});

// Update category name
router.post("/manage/category/update", (req, res) => {
  const { categoryId, categoryName } = req.body;
  CategoryModel.findOneAndUpdate({ _id: categoryId }, { name: categoryName })
    .then((oldCategory) => {
      res.send({ status: 0 });
    })
    .catch((error) => {
      console.error("Update category name exception", error);
      res.send({
        status: 1,
        msg: "Update category name exception, please try again.",
      });
    });
});

// Get category by categoryId
router.get("/manage/category/info", (req, res) => {
  const categoryId = req.query.categoryId;
  CategoryModel.findOne({ _id: categoryId })
    .then((category) => {
      res.send({ status: 0, data: category });
    })
    .catch((error) => {
      console.error("Get category exception", error);
      res.send({ status: 1, msg: "Get category exception, please try again." });
    });
});

// Add product
router.post("/manage/product/add", (req, res) => {
  const { product } = req.body;
  // console.log(product);
  ProductModel.create(product)
    .then((product) => {
      res.send({ status: 0, data: product });
    })
    .catch((error) => {
      console.error("Add product exception", error);
      res.send({ status: 1, msg: "Add product exception, please try again" });
    });
});

// Get products list
router.get("/manage/product/list", (req, res) => {
  const { pageNum, pageSize } = req.query;
  ProductModel.find({})
    .then((products) => {
      res.send({ status: 0, data: pageFilter(products, pageNum, pageSize) });
    })
    .catch((error) => {
      console.error("Get products list exception", error);
      res.send({
        status: 1,
        msg: "Get products list exception, please try again.",
      });
    });
});

// Search product list
router.get("/manage/product/search", (req, res) => {
  const { pageNum, pageSize, productName, productDesc } = req.query;
  // console.log(pageNum, pageSize, productName, productDesc);
  let contition = {};
  if (productName) {
    contition = { name: new RegExp(`^.*${productName}.*$`) };
  } else if (productDesc) {
    contition = { desc: new RegExp(`^.*${productDesc}.*$`) };
  }
  ProductModel.find(contition)
    .then((products) => {
      res.send({ status: 0, data: pageFilter(products, pageNum, pageSize) });
    })
    .catch((error) => {
      console.error("Search product list exception", error);
      res.send({
        status: 1,
        msg: "Search product list exception, please try again.",
      });
    });
});

// Update product
router.post("/manage/product/update", (req, res) => {
  const { product } = req.body;
  // console.log(product);
  ProductModel.findOneAndUpdate({ _id: product._id }, product)
    .then((oldProduct) => {
      console.log(oldProduct);
      res.send({ status: 0 });
    })
    .catch((error) => {
      console.error("Update product exception", error);
      res.send({
        status: 1,
        msg: "Update product exception, please try again.",
      });
    });
});

// Delete product
router.post("/manage/product/delete", (req, res) => {
  const { productId } = req.body;
  // console.log(product);
  // keep this product at least
  if (productId === "5e12b97de31bb727e4b0e349") {
    console.error("Error:Keep this product at least");
    res.send({
      status: 1,
      msg: "Sorry. This product is protected! You can not delete this product.",
    });
  } else {
    ProductModel.deleteOne({ _id: productId })
      .then((acknowledged) => {
        console.log(acknowledged);
        res.send({ status: 0, acknowledged });
      })
      .catch((error) => {
        console.error("Delete product exception", error);
        res.send({
          status: 1,
          msg: "Delete product exception, please try again.",
        });
      });
  }
});

// Update product status (1: On Sale, 2: Sold Out)
router.post("/manage/product/updateStatus", (req, res) => {
  const { productId, status } = req.body;
  ProductModel.findOneAndUpdate({ _id: productId }, { status })
    .then((oldProduct) => {
      res.send({ status: 0 });
    })
    .catch((error) => {
      console.error("Update product status exception", error);
      res.send({
        status: 1,
        msg: "Update product status exception, please try again.",
      });
    });
});

// Add role
router.post("/manage/role/add", (req, res) => {
  const { roleName } = req.body;
  RoleModel.create({ name: roleName })
    .then((role) => {
      res.send({ status: 0, data: role });
    })
    .catch((error) => {
      console.error("Add role exception", error);
      res.send({ status: 1, msg: "Add role exception, please try again." });
    });
});

// Get role list
router.get("/manage/role/list", (req, res) => {
  RoleModel.find()
    .then((roles) => {
      res.send({ status: 0, data: roles });
    })
    .catch((error) => {
      console.error("Get role list exception", error);
      res.send({
        status: 1,
        msg: "Get role list exception, please try again.",
      });
    });
});

// Get users of role
router.get("/manage/role/users", (req, res) => {
  const roleId = req.query.roleId;
  UserModel.findOne({ role_id: roleId })
    .then((user) => {
      res.send({ status: 0, data: user });
    })
    .catch((error) => {
      console.error("Get user exception", error);
      res.send({ status: 1, msg: "Get user exception, please try again." });
    });
});

// Update role (set permissions)
router.post("/manage/role/update", (req, res) => {
  const { role } = req.body;
  console.log(role);
  if (!role.auth_time) {
    console.log(role.auth_time);
    role.auth_time = Date.now();
  }
  RoleModel.findOneAndUpdate({ _id: role._id }, role)
    .then((oldRole) => {
      // console.log('---', oldRole._doc)
      console.log("---", oldRole);
      res.send({ status: 0, data: { ...oldRole, ...role } });
    })
    .catch((error) => {
      console.error("Update role exception", error);
      res.send({ status: 1, msg: "Update role exception, please try again." });
    });
});

// Delete role
router.post("/manage/role/delete", (req, res) => {
  const { roleId } = req.body;

  /**
   * Before detele the role, check if these are uers under it.
   */
  UserModel.findOne({ role_id: roleId })
    .then((user) => {
      if (!user) {
        RoleModel.deleteOne({ _id: roleId }).then((acknowledged) => {
          console.log(roleId, acknowledged);
          res.send({ status: 0, acknowledged });
        });
      }
    })
    .catch((error) => {
      console.error("Delete role exception", error);
      res.send({ status: 1, msg: "Delete role exception, please try again." });
    });
});

/**
 * Get the paging information of the specified array
 */

function pageFilter(arr, pageNum, pageSize) {
  pageNum = pageNum * 1;
  pageSize = pageSize * 1;
  const total = arr.length;
  const pages = Math.floor((total + pageSize - 1) / pageSize);
  const start = pageSize * (pageNum - 1);
  const end = start + pageSize <= total ? start + pageSize : total;
  const list = [];
  for (var i = start; i < end; i++) {
    list.push(arr[i]);
  }

  return {
    pageNum,
    total,
    pages,
    pageSize,
    list,
  };
}

require("./file-upload")(router);

module.exports = router;
