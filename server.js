const express = require('express');
const app = express();
const google = require('googleapis');
const mongoose = require('mongoose');

const CX = '017508338566255190072:jnbzntv6evc';
const API_KEY = 'AIzaSyAiw_5uh9PreVnDfkJK8NpoSA3alyC8Zrc';

var customsearch = google.customsearch('v1');

var port = process.env.PORT || 8080;

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://sabathh:sabathh2469@ds153392.mlab.com:53392/img-search');

var imgSearchSchema = new mongoose.Schema({
    term: String,
    when: String,
},{
    _id : false,
    __v : false
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
    
    console.log("Query: "+ imgQuery);
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
        
        customsearch.cse.list({ cx: CX, q: query, auth: API_KEY, searchType: 'image', start: start }, function (err, resp) {
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
    //db.collection.find().limit(1).sort({$natural:-1}).pretty()
    var outJson;
    
    var queryResult = imgSearch.find().sort({ field: 'asc', _id: -1 }).limit(2).exec(function(err, post) {
        if (err) return console.error(err);
        
        //post = post.map(function(post) { return post.term; });
        console.log('Begin')
        console.log(post)
        
        res.json(post)
        //var outJson = {term : post.term, when : post.when};
    });
    //console.log('Begin hear')
    //console.log(queryResult)
    
    //res.json(queryResult);
});

app.listen(port, function () {
  console.log('Node app is running on port ' + port);
});