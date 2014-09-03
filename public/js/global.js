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

  $('#submitQuestion #inputDeadline').timepicker();

  // // Populate the user table on initial page load
  // populateTable();

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


  // ROS

  // var ros = new ROSLIB.Ros({
  //   url : 'ws://localhost:9090'
  // });

  // ros.on('connection', function() {
  //   console.log('Connected to websocket server.');
  // });

  // ros.on('error', function(error) {
  //   console.log('Error connecting to websocket server: ', error);
  // });

  // ros.on('close', function() {
  //   console.log('Connection to websocket server closed.');
  // });

});


// function (queryjob_id, timeissued) {

//   var scheduleQueryJobClient = new ROSLIB.Service({
//     ros : ros,
//     name : '/schedule_query',
//     serviceType : 'sara_queryjob_manager/ScheduleQueryJob'
//   });

//   var request = new ROSLIB.ServiceRequest({
//     queryjob_id : queryjob_id,
//     queryjob_id : timeissued
//   });

//   addTwoIntsClient.callService(request, function(result) {
//     return
//   });

//   // return
// }


// =====================================================================
// Functions
// =====================================================================

// Add User.
function submitQuestion(event) {
  event.preventDefault();

  // get toggle state and other state
  // then send to the server

  // // TODO(mjyc): do better validation
  // var errorCount = 0;
  // $('#addUser input').each(function(index, val) {
  //     if($(this).val() === '') { errorCount++; }
  // });

  // Check and make sure errorCount's still at zero
  // if(errorCount === 0) {

    // If it is, compile all user info into one object.
    var newQueryJob = {
      'timeissued': new Date(),
      'typed_cmd': $('#submitQuestion input#inputTypedCmd').val(),
      'sms_notification': $('#submitQuestion button#btnToggleSMS').hasClass('active'),
      'email_notification': $('#submitQuestion button#btnToggleEmail').hasClass('active'),
    };

    // Use AJAX to post the object to our adduser service.
    $.ajax({
      type: 'POST',
      data: newQueryJob,
      url: '/queryjobs/addqueryjob',
      dataType: 'JSON'
    }).done(function( response ) {
      // Check for successful (blank) response
      if (response.msg === '') {
        console.log('successful!! Yay!!');
        if (response.msg === '') {
          console.log();
        }
      }
      else {
        // If something goes wrong, alert the error message that our service returned
        alert('Error: ' + response.msg);
      }
    });
  // }
  // else {
  //     // If errorCount is more than 0, error out
  //     alert('Please fill in all fields');
  //     return false;
  // }
}
