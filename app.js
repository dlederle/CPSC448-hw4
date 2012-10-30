//Base code yoink'd from this blog post:
//http://www.thecodinghumanist.com/blog/archives/2011/5/6/serving-static-files-from-node-js

var http   = require('http'),
    path   = require('path'),
    fs     = require('fs'),
    xml2js = require('xml2js');

var parser = new xml2js.Parser();

var serv = http.createServer(function (req, res) {
  //console.log("Got a request!");

  //Parse POST data
  req.setEncoding('utf8');
  var data;
  req.on("data", function(indata) { data = indata; });

  var filePath = '.' + req.url;
  if (filePath == './') { filePath = './index.html'; };
  var queries = filePath.split("?")[1];
  filePath = filePath.split("?")[0];
  var extname = path.extname(filePath);
  var contentType = 'text/html';
  var phpHandler = null;
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.php':
      phpHandler = HANDLERS[path.basename(filePath, '.php')]; 
      break;
  }


  fs.exists(filePath, function(exists) {
    if (exists) {
      //Serving static files, for debugging
      fs.readFile(filePath, function(error, content) {
        if (error) {
          res.writeHead(500);
          res.end();
        } else {
          res.writeHead(200, { 'Content-Type' : contentType });
          res.end(content, 'utf-8');
        }
      });
    } else {
      if (phpHandler) {
        if(req.method === "POST") {
          //console.log("POST");
        } else if(req.method === "GET") {
          data = queries;
        }
        phpHandler.call(phpHandler, data, res);
      } else {
        res.writeHead(404);
        res.end();
      }
    }
  });
}).listen(39999);

HANDLERS = {};


HANDLERS.factor = function(data, res) {
  //console.log("factor");
  var obj = HANDLERS.init(data);
  obj.contentType = "application/xml";
  obj.data = '<?xml version="1.0"?>';
  if(data) {
    var num = parseInt(data.trim().split("num=")[1]);
    if (!num) {
      obj.data += '<Error>malformed parameter</Error>';
    } else {
      obj.data += '<Result>';
      var factors = factorize(num);
      factors.forEach(function(el, ind, arr) {
        if(el.multiplicity > 0) {
          obj.data += '<Factor multiplicity="' + el.multiplicity + '">' + el.number + '</Factor>';
        } else {
          obj.data += '<Factor>' + el.number + '</Factor>';
        }
      });
      obj.data += '</Result>';
    }
  } else {
    obj.data += '<Error>missing parameter</Error>';
  }
  res.writeHead(200, { 'Content-Type' : obj.data.contentType });
  res.end(obj.data, 'utf-8');
};

HANDLERS.gpa = function(data, res) {
  var obj = HANDLERS.init(data);
  var x = JSON.parse(data);
  var qualityPoints = function(grade) {
    switch (grade) {
      case 'A':
        return 4.00;
        break;
      case 'A-':
        return 3.70;
        break;
      case 'B+':
        return 3.30;
        break;
      case 'B':
        return 3.00;
        break;
      case 'B-':
        return 2.70;
        break;
      case 'C+':
        return 2.30;
        break;
      case 'C':
        return 2.00;
        break;
      case 'C-':
        return 1.70;
        break;
      case 'D+':
        return 1.30;
        break;
      case 'D':
        return 1.30;
        break;
      case 'F':
        return 0.00;
        break;
    }
    console.log("NONE OF THE ABOVE! PANIC!");
    return -1;
  }

  if (!x) {
    obj.data = { "error":"badJSON" };
    res.writeHead(200, { 'Content-Type' : obj.data.contentType });
    res.end(obj.data, 'utf-8');
  } else {
    //add credits
    x.forEach(function(el, ind, arr) {
      if(!el.credits) {
        http.get("http://rosemary.umw.edu/~stephen/cpsc448/numCredits.php?prefix=" + el.prefix + "&number=" + el.number, function(res) {
          res.setEncoding('utf8');
          res.on('data', function(chunk) {
            parser.parseString(chunk, function(err, result) {
              el.credits = result.NumCredits;
              sendRes(el);
            });
          });
        });
      }
    });
    var finished = [];
    var sendRes = function(course) {
      finished.push(course);
      if(x.length === finished.length) {
        finished.map(function(i) {
          i.pts = qualityPoints(i.grade) * i.credits; 
        });

        var total  = finished.reduce(function(prev, curr, ind, arr) {
          return { 
            pts: parseInt(curr.pts) + parseInt(prev.pts), 
            credits: parseInt(prev.credits) + parseInt(curr.credits) 
          };
        });
        obj.data = JSON.stringify({ "gpa" : total.pts/total.credits });

        res.writeHead(200, { 'Content-Type' : obj.data.contentType });
        res.end(obj.data, 'utf-8');
      }
    }
  }
};

HANDLERS.add = function(data, res) {
  var obj = HANDLERS.init(data);
  if (data) {
    obj.data.sum;

    parser.parseString(data, function(err, inresult) {
      if(inresult.Addends.Addend) {
        obj.data.sum = inresult.Addends.Addend.reduce(function(a, b) {
          return parseInt(a) + parseInt(b);
        });
      }
    });

    if(obj.data.sum) {
      obj.data.responseCode = "0";
      obj.data.sum += "";
      obj.data = JSON.stringify(obj.data);
      res.writeHead(200, { 'Content-Type' : obj.data.contentType });
      res.end(obj.data, 'utf-8');
    }
  }
  obj.data.responseCode = "1";
  res.writeHead(200, { 'Content-Type' : obj.data.contentType });
  res.end(obj.data, 'utf-8');
};

HANDLERS.init = function(data) {
  var obj = {};
  obj.data = {};
  obj.contentType = "application/json";
  return obj;
};

var factorize = function(num) {
  //Adapted from
  //http://bateru.com/news/2012/05/code-of-the-day-javascript-prime-factors-of-a-number/
  num = Math.floor(num);
  var root, ret = [], factors = [], x, sqrt = Math.sqrt, doLoop = 1 < num;
  while (doLoop) {
    root = sqrt(num);
    x = 2;
    if (num % x) {
      x = 3;
      while ((num % x) && ((x += 2) < root));
    }
    x = (x > root) ? num : x;
    factors.push(x);
    doLoop = (x != num);
    num /= x;
  }

  //Adapted from
  //http://ryanbosinger.com/blog/2011/javascript-count-duplicates-in-an-array/
  var copy = factors.slice(0);
  for (var i=0; i<factors.length; i++) {
    var count = 0;
    for(var w =0; w<copy.length; w++) {
      if(factors[i] == copy[w]) {
        count++;
        delete copy[w];
      }
    }
    if (count > 0) {
      ret.push({number: factors[i], multiplicity: count});
    }
  }
  return ret;
}
