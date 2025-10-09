const express = require("express");
const { getRouteLink } = require("../resources/libary");
const route = express.Router();

route.get("/", (req, res) => {
  try {
    const routeLinks = getRouteLink(req.originalUrl);
    res.render("homeLayout", { routeLinks });
  } catch (error) {}
});
module.exports = route;
