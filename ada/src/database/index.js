const { JsonDatabase } = require("wio.db");
const { QuickDB } = require("quick.db");
const {owner} = require("../../config.json");


const db = new JsonDatabase({databasePath:"./src/database/general.json"});
const tk = new QuickDB({filePath:"./src/database/ticket.sqlite"});

module.exports = {
    owner,
    db,
    tk
};