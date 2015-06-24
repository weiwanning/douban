var Crawler = require("crawler");
var MongoClient = require('mongodb').MongoClient;

var mongoUrl = 'mongodb://localhost:27017/douban';

var options = {
    maxConnections : 10,
    userAgent: "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/525.28.3 (KHTML, like Gecko) Version/3.2.3 ChromePlus/4.0.222.3 Chrome/4.0.222.3 Safari/525.28.3",
    callback: function(error, result, $) {
      // $ is Cheerio by default
      // a lean implementation of core jQuery designed specifically for the server
      if (error) {
          console.log("Crawl error: ", error);
      } else {
          var movies = [];
          console.log("Crawl succeed.");
          $('div.pl2').each(function(index, element) {
              var movie = {};
              movie.id = $(this).children('a').attr('href').match(/http:\/\/movie\.douban\.com\/subject\/([\d]+)\//)[1];
              movie.href = $(this).children('a').attr('href');
              movie.name = $(this).children('a').text().replace(/ /g,'').replace(/\n/g, '');
              movie.desc = $(this).children('p').text().replace(/ /g,'');
              movie.rating = $(this).children('div').children('span.rating_nums').text();
              movie.rates = $(this).children('div').children('span.pl').text();
              console.log("Crawled movie: ", movie.name);
              if (movie.id) {
                  movies.push(movie);
              }
          });

          if (movies.length > 0) {
              MongoClient.connect(mongoUrl, function(err, db) {
                  if (err) {
                      console.log("Mongo connection failed.", err);
                  } else {
                      console.log("Connected correctly to server");
                      var collection = db.collection('movies');

                      collection.insert(movies, function(err, result) {
                          if (err) {
                              console.log("Mongo insert failed.", err);
                          } else {
                              console.log("successfully inserted data in Mongo");
                          }
                          db.close();
                      });
                  }
              });
          }
      }
  }
};

var c = new Crawler(options);
var year = 2006;
while (year > 1964) {
  var start = 0;
  while (start < 2000) {
      c.queue('http://movie.douban.com/tag/' + year + '?start=' + start);
      start += 20;
  }
  year--;
}

console.log("finished loading.");
