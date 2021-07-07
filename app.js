//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs=require("ejs");
const _= require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.DBURL,{ useNewUrlParser: true ,useUnifiedTopology: true ,useFindAndModify: false});

const itemsSchema=new mongoose.Schema({
  name:{
    type:String,
    required:[true,"Please check your data entry,no item specified"]
  }
});

const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
  name:"Buy fruits"
});

const item2=new Item({
  name:"Do assignment"
});

const item3=new Item({
  name:"Take bath"
});

const defaultItems=[item1,item2,item3];

const listSchema=mongoose.Schema({
    name:{
      type:String,
      unique:true
    },
    items:[itemsSchema]
});

const List=mongoose.model("List",listSchema);

app.get("/", function(req, res) {

  Item.find(function(err,foundItems){
    if(foundItems.length===0){
    Item.insertMany(defaultItems,function(err){
      if(err)
      {
        console.log(err);
      }
      else
      {
        console.log("Successfully saved");
      }
    });
    res.redirect("/");
   }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
   }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName=req.body.list;
  const item=new Item({
    name:itemName
  });
  
  if(listName==="Today")
  {
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }

});

app.post("/delete",function(req,res){
  const id=req.body.checkbox;
  const listName=req.body.listName;
  if(listName==="Today"){
  Item.findByIdAndRemove(id,function(err){
    if(err)
    {
      console.log(err);
    }
    else
    {
      console.log("Successfully deleted");
    }
    res.redirect("/");
    });
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:id}}},function(err,foundList){
      if(!err)
      {
        res.redirect("/"+listName);
      }
    });
  }
});

app.get("/:title",function(req,res){
  const title=_.capitalize(req.params.title);
  console.log(title);
  List.findOne({name:title},function(err,foundList){
    if(!err){
      if(!foundList){
        const list=new List({
          name:title,
          items:defaultItems
        });
        
        list.save();

        res.redirect("/"+title);
      }
      else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
    else console.log(err);
  });

});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started successfully");
});
