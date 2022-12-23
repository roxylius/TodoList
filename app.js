const express = require("express");
const bodyParser = require("body-parser");
const { default: mongoose } = require("mongoose");
const _ = require("lodash");
require("dotenv").config();
const app = express();

app.set('view engine', 'ejs');

let port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URL, (err) => {
  if (err)
    console.log(err);
  else
    console.log("successfully connected to mongoDB sever!");
});

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("item", itemSchema);

const item1 = new Item({
  name: "Welcome to your To-Do List!"
});

const item2 = new Item({
  name: "HIT  the + Button to add a new task."
});

const item3 = new Item({
  name: "⟵ Hit this to delete a task."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  tasks: [itemSchema]
};

const List = new mongoose.model("list", listSchema);


app.get("/", function (req, res) {

  Item.find({}, (err, tasks) => {
    if (err)
      console.log(err);

    if (tasks.length == 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err)
          console.log(err);
        else
          console.log("Successfully added the default items to database!");
      });
      res.redirect("/");
    }
    else {
      // console.log(tasks);
      res.render("list", { listTitle: "Today", newListItems: tasks });
    }
  });

});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newTask = new Item({ name: itemName });

  if (listName == "Today") {
    newTask.save(newTask, (err) => {
      if (err)
        throw err;
      else
        console.log("Successfully Added the new task!");
    });

    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      if (err)
        throw err;
      else {
        foundList.tasks.push(newTask);
        foundList.save();
        console.log("Added new task to ", listName, "!");
        res.redirect(`/${listName}`);
      }
    })
  }

});

app.post("/delete", (req, res) => {

  const taskId = req.body.checkbox;
  const listName = req.body.list;
  console.log(listName);

  console.log("To be deleted id: ", taskId);

  if (listName === "Today") {
    Item.findByIdAndDelete(taskId, (err) => {
      if (err)
        throw err;
      else
        console.log("succesfully deleted task!");
    });
    res.redirect("/");

  }
  else {
    List.findOne({ name: listName }, (err, foundList) => {
      if (err)
        throw err;
      else {
        foundList.tasks.pull({ _id: taskId });
        foundList.save();
        console.log("Successfully deleted the task!");
      }
    });

    res.redirect(`/${listName}`);
  }
});

app.get("/:listType", (req, res) => {
  const category = _.capitalize(req.params.listType);
  console.log(category);

  List.findOne({ name: category }, (err, list) => {
    if (!err) {
      if (!list) {
        const list = new List({
          name: category,
          tasks: defaultItems
        });

        list.save();
        console.log("list saved in Database!");

        res.redirect(`/${category}`);
      }
      else if (list.tasks.length == 0) {
        let i = 0;
        defaultItems.forEach(element => {
          list.tasks.push(defaultItems[i++]);
        });
        list.save();
        res.redirect(`/${category}`);
      }
      else {
        res.render("list", { listTitle: list.name, newListItems: list.tasks });
      }
    }
    else
      throw err;

  });
})

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(port, function () {
  if (port == null)
    console.log("Server started on 3000...");
  else
    console.log("Server started on " + port);
});


