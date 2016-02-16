const _ = require("underscore");
const co = require("co");
const User = require("./src/models").User;
const UserStat = require("./src/models").UserStat;
const Submission = require("./src/models").Submission;

var criteria = {
    problemId: 3,
    userId: "123456789012345678901234",
    language: null,
    technology: null
};

co(function* () {
    
    var user = yield User.findByIdAndUpdate("569b75367b964a20f8145be5", {
        $inc: {'stats.languages.nodejs': 1}
    }, {new: true});
    //user.stats.technologies = {};
    //user.stats.languages = {};
    //yield user.save();
    console.log(user);
    return;
    UserStat.findOneAndUpdate(
        criteria,
        {$setOnInsert: criteria},
        {new: false, upsert: true},
        function () {
            console.log(arguments);
        }
    );
    //console.log(stat);
}).catch(e => {
    console.log(e);
    console.log(e.stack);
});
