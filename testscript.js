var TEST = {};
TEST.baseURL = "http://localhost:39999/~dlederle/hw4/";
$(document).ready(function() {
  $('button').each(function(ind, el) { $(el).click(TEST[el.id]); });
});

TEST.handleResponse = function(data) {
  console.log(data);
}

TEST.add = function add () {
  var submitData = '<?xml version="1.0"?><Addends>';
  submitData += '<Addend>' + 2 + '</Addend>';
  submitData += '<Addend>' + 3 + '</Addend>';
  submitData += '</Addends>';
  $.ajax({
    url: TEST.baseURL + "add.php",
    type: "POST",
    contentType: "text/xml",
    data: submitData,
    dataType: "json"
  }).always(TEST.handleResponse);
}

TEST.factor = function factor () {
  var submitData = "num=60";
  $.ajax({
    url: TEST.baseURL + "factor.php",
    type: "GET",
    data: submitData,
    dataType: "xml"
  }).always(TEST.handleResponse);
}


TEST.GPA = function GPA () {
  var submitData = [];
  submitData.push({ "prefix":"CPSC", "number":"220", "grade":"B" });
  submitData.push({ "prefix":"CPSC", "number":"110", "grade":"A" });
  submitData.push({ "prefix":"CPSC", "number":"326", "grade":"A" });
  $.ajax({
    url: TEST.baseURL + "gpa.php",
    type: "POST",
    contentType: "text/json",
    data: JSON.stringify(submitData),
    dataType: "json"
  }).done(TEST.handleResponse);
}


TEST.degree_eval = function degree_eval () {
  console.log("EVAL!!");
}
