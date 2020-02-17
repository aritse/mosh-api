const router = require("express").Router();
const db = require("../models");

router.get("/all", (req, res) => {
  db.User.findAll()
    .then(users => res.json(users))
    .catch(err => res.status(500).json(err));
});

router.get("/:id", (req, res) => {
  db.User.findOne({
    where: {
      id: req.params.id
    }
  })
    .then(user => res.json(user))
    .catch(err => res.status(500).json(err));
});

router.put("/update/:id", (req, res) => {
  db.User.update(req.body, {
    where: {
      id: req.params.id
    }
  })
    .then(count => {
      if (count > 0) {
        res.json("updated");
      } else {
        res.json("not updated");
      }
    })
    .catch(err => res.status(500).json(err));
});

router.delete("/delete/:id", (req, res) => {
  db.User.destroy({
    where: {
      id: req.params.id
    }
  })
    .then(count => {
      if (count > 0) {
        res.json("deleted");
      } else {
        res.json("not deleted");
      }
    })
    .catch(err => res.status(500).json(err));
});

module.exports = router;
