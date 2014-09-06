// =====================================================================
// DOM Ready
// =====================================================================

$(document).ready(function() {

  $('#btnimgresult1').click(function() {
    $('#imgresult1').toggle();
  });

  // $('#imgresult1').hover(function() {
  //     $(this).css("cursor", "pointer");
  //     $(this).animate({
  //         width: "300px",
  //         height: "280px"
  //     });

  // }, function() {
  //     $(this).animate({
  //         width: "128px",
  //         height: "128px"
  //     });

  // });

  // $('#submitQuestion #inputDeadline').timepicker();

  // Populate the user table on initial page load
  // populateFeed();

  // // Add User button click.
  // $('#btnGetQuery').on('click', getQuery);

  // // Add User button click.
  // $('#btnPatrol').on('click', sendPatrol);

  // // Add User button click.
  // $('#btnCSEXXX').on('click', sendCSE4XX);

  // // Add User button click.
  // $('#btnSTART').on('click', sendSTART);

  // // Username link click.
  // $('#userList table tbody').on('click', 'td a.linkshowuser', showUserInfo);

  // Add User button click.
  $('#btnSubmitQuestion').on('click', submitQuestion);

  // // Delete User link click.
  // $('#userList table tbody').on('click', 'td a.linkdeleteuser', deleteUser);
});


// ROS
var ros = new ROSLIB.Ros({
  url : 'ws://localhost:9090'
});

ros.on('connection', function() {
  console.log('Connected to websocket server.');
});

ros.on('error', function(error) {
  console.log('Error connecting to websocket server: ', error);
});

ros.on('close', function() {
  console.log('Connection to websocket server closed.');
});

var testService = function(queryjob_id, timeissued, cb) {
  var scheduleQueryJobClient = new ROSLIB.Service({
    ros : ros,
    name : '/schedule_query',
    serviceType : 'sara_queryjob_manager/ScheduleQueryJob'
  });

  var request = new ROSLIB.ServiceRequest({
    'queryjob_id' : queryjob_id,
    'timeissued' : timeissued
  });

  scheduleQueryJobClient.callService(request, cb);
};

// =====================================================================
// Functions
// =====================================================================

// // Fill table with data
// function populateTable() {

//     // Empty content string
//     var feedContent = '';

//     // jQuery AJAX call for JSON
//     $.getJSON('/queryjobs/listqueryjob', function( data ) {

//         // Stick our user data array into a userlist variable in the global object
//         userListData = data;

//         // // For each item in our JSON, add a table row and cells to the content string
//         // $.each(data, function(){
//         //     feedContent += '<tr>';
//         //     feedContent += '<td><a href="#" class="linkshowuser" rel="' + this.username + '" title="Show Details">' + this.username + '</a></td>';
//         //     feedContent += '<td>' + this.email + '</td>';
//         //     feedContent += '<td><a href="#" class="linkdeleteuser" rel="' + this._id + '">delete</a></td>';
//         //     feedContent += '</tr>';
//         // });

//         // // Inject the whole content string into our existing HTML table
//         // $('#userList table tbody').html(tableContent);
//     });
// }

// Add User.
function submitQuestion(event) {
  event.preventDefault();

  // TODO(mjyc): implement input validation.

  var newQueryJob = {
    'timeissued': new Date(),
    'typed_cmd': $('#submitQuestion input#inputTypedCmd').val(),
    'notification_sms': $('#submitQuestion button#btnToggleSMS').hasClass('active'),
    'notification_email': $('#submitQuestion button#btnToggleEmail').hasClass('active'),
  };

  // Use AJAX to post the object to our adduser service.
  $.ajax({
    type: 'POST',
    data: newQueryJob,
    url: '/queryjobs/addqueryjob',
    dataType: 'JSON'
  }).done(function(res) {
    console.log(res);
  }).fail(function() {
    console.log('error occured');
  });
}
