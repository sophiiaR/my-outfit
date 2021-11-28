const router = require("express").Router();
const User = require("../models/User");
const { verifyTokenAndAuth, verifyTokenAndAdmin } = require("./verifyToken");

//UPDATE 
router.put("/:id", verifyTokenAndAuth, async (req,res) => {
    if(req.body.password) {
        req.body.password = CryptoJS.AES.encrypt(
            req.body.password, 
            process.env.PASSW_SECRET
        ).toString();
    }
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            {
                $set: req.body
            }, { new:true }
        );
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json(error);
    }
});

//DELETE
router.delete("/:id", verifyTokenAndAuth, async (req,res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json("User deleted successfully!");
    } catch (error) {
        res.status(500).json(error);
    }
});

//FIND USER
router.get("/find/:id", verifyTokenAndAdmin, async (req,res) => {
    try {
        const user = await User.findById(req.params.id);
        const { password, ...others } = user._doc;
        res.status(200).json(others);
       
    } catch (error) {
        res.status(500).json(error);
    }
});

//GET ALL USERS
router.get("/", verifyTokenAndAdmin, async (req,res) => {
    const query = req.query.new
    try {
        //if there is a query, it returns the latest user
        const users = query ? await User.find().sort({_id: -1}).limit(1) : await User.find();
        res.status(200).json(users);
       
    } catch (error) {
        res.status(500).json(error);
    }
});

//GET USER STATS
router.get("/stats", verifyTokenAndAdmin, async (req,res) => {
    const date = new Date();
    const lastYear = new Date(date.setFullYear(date.getFullYear() -1));
    try {
        const data = await User.aggregate([
            // condition: created at greater than last year
            { $match: { createdAt: { $gte: lastYear } } },
            //month where the users were created
            { $project: {
                month: { $month: "$createdAt" }
            } },
            //group users by creation month
            { $group: {
                _id: "$month",
                total: {$sum: 1}
            } }
        ]);
        res.status(200).json(data);
       
    } catch (error) {
        res.status(500).json(error);
    }
});

module.exports = router;