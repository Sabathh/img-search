const configEnv = require('dotenv').config();

const express = require('express');
const app = express();
const google = require('googleapis');
const mongoose = require('mongoose');

var customsearch = google.customsearch('v1');

var port = process.env.PORT || 8080;

// Configure environment
configEnv;

mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGODB);

var imgSearchSchema = new mongoose.Schema({
    term: String,
    when: String,
});

var imgSearch = mongoose.model('imgSearchDb', imgSearchSchema);

var imgOutputFormat = function (url, snippet, thumbnail, context)
{
    return {url : url, snippet : snippet, thumbnail : thumbnail, context : context};
};

var imgOutput = function(res)
{
    var imgJson=[];
    
    for(var i = 0; i < res.items.length;i++)
    {
        imgJson.push(imgOutputFormat(res.items[i].link,res.items[i].snippet,res.items[i].image.thumbnailLink,res.items[i].image.contextLink));
    }
    return (imgJson);
};

var saveQuery = function(term)
{
    var date = new Date();
    
    console.log("Date: "+ date);
    
    var imgQuery = new imgSearch({term : term, when : date});
    
    
    imgQuery.save(function(err) {
            if (err) return console.error(err);
          });
};

app.get('/imagesearch/:imgQuery*', function (req, res){
    
    var query =req.params.imgQuery;
    var offset = 0;
    
    if (query != "favicon.ico")
    {
        saveQuery(query);
        
        if (req.query.offset)
        {
            offset = parseInt(req.query.offset,0);
            
        }
        
        var start = 1 + offset;
        
        customsearch.cse.list({ cx: process.env.CX, q: query, auth: process.env.API_KEY, searchType: 'image', start: start }, function (err, resp) {
            if (err) {
                res.json({error: err});
            }
            
            // Got the response from custom search
            if (resp.items && resp.items.length > 0) 
            {
                res.json(imgOutput(resp));
            }
        });
    }
});

app.get('/imagesearch/favicon.ico', function(req, res) {
    res.send(204);
});

app.get('/latest', function(req, res) {
    var outJson = [];
    
    imgSearch.find().sort({ field: 'asc', _id: -1 }).limit(10).exec(function(err, results) {
       if (err) return console.error(err);
       
       var jsonObj; 
       for(var i = 0; i < results.length; i++)
       {
           jsonObj = results[i].toObject();
           delete jsonObj._id;
           delete jsonObj.__v;
           
           outJson.push(jsonObj);
       }
       
       res.json(outJson);
    });
});

app.listen(port, function () {
  console.log('Node app is running on port ' + port);
});