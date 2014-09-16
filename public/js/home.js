// =====================================================================
// ROS
// =====================================================================

// ROS setups.
var ros = new ROSLIB.Ros({
  url: urlROS
});

ros.on('connection', function() {
  console.log('Connected to websocket server.');
});

ros.on('error', function(error) {
  console.log('Error connecting to websocket server: ', error);
});

ros.on('close', function() {
  console.log('Connection to websocket server closed.');
  location.reload(true);
});

function callScheduleQueryJob(queryjob, callback) {
  var scheduleQueryJob = new ROSLIB.Service({
    ros: ros,
    name: '/schedule_queryjob',
    serviceType: 'sara_queryjob_manager/ScheduleQueryJob'
  });

  var timeissuedSec = Math.floor(new Date(queryjob.timeissued).getTime() / 1000);

  var request = new ROSLIB.ServiceRequest({
    queryjob_id: queryjob._id,
    timeissued: timeissuedSec
  });

  scheduleQueryJob.callService(request, function(result) {
    callback(result);
  }, function() {
    alert('Error while calling /schedule_queryjob ROS service.');
  });
}

function callCancelQueryJob(queryjobIDStr, callback) {
  var cancelQueryJob = new ROSLIB.Service({
    ros: ros,
    name: '/cancel_queryjob',
    serviceType: 'sara_queryjob_manager/CancelQueryJob'
  });

  var request = new ROSLIB.ServiceRequest({
    queryjob_id: queryjobIDStr
  });

  cancelQueryJob.callService(request, function(result) {
    callback(result);
  }, function() {
    alert('Error while calling /cancel_queryjob ROS service.');
  });
}

var listener = new ROSLIB.Topic({
  ros: ros,
  name: '/queryjob_update',
  messageType: 'sara_queryjob_manager/QueryJobUpdate'
});

listener.subscribe(function(message) {
  console.log(message);
  queryjobCards.refreshCard(message.queryjob_id);
});

//   function(message) {
//   if (cards[message.queryjob_id]) {

//     var data = {
//       queryjobID: message.queryjob_id,
//       limit: 1
//     };
//     $.post('/queryjobs/getqueryjobs', data, function(queryjobs) {
//       if (queryjobs.length !== 1) {
//         alert('Error while posting to /queryjobs/getqueryjobs.');
//       } else {
//         var queryjob = queryjobs[0];
//         cards[message.queryjob_id].html(cardManager.create(queryjob).html());
//       }
//     }, 'JSON').fail(function() {
//       alert('Error while posting to /queryjobs/getqueryjobs.');
//     });

//   } else {
//     console.log('unknown queryjob_id = ' + message.queryjob_id);
//   }
// });

// =====================================================================
// DOM Ready
// =====================================================================

$(document).ready(function() {

  // Make switches pretty.
  $('.js-switch').each(function(index) {
    new Switchery(this);
  });

  // Initialize contents.
  queryjobCards.init({
    callCancelQueryJob: callCancelQueryJob
  });

  // Infinite scroll setups.
  $(window).scroll(function() {
    var wintop = $(window).scrollTop();
    var docheight = $(document).height();
    var winheight = $(window).height();
    var scrolltrigger = 0.95;

    if ((wintop / (docheight - winheight)) > scrolltrigger) {
      queryjobCards.loadMoreCards();
    }
  });

  // Deadline setups.
  $('#inputDeadline').datetimepicker({
    defaultDate: new Date(new Date().getTime() +
      1000 * 60 * 60 * 1 * 1), // 1 hr later
    icons: {
      time: 'fa fa-clock-o fa-lg',
      date: 'fa fa-calendar fa-lg',
      up: 'fa fa-arrow-up fa-lg',
      down: 'fa fa-arrow-down fa-lg'
    },
    minuteStepping: 5,
    minDate: new Date(),
    maxDate: new Date(new Date().getTime() +
      1000 * 60 * 60 * 24 * 7), // week later
    sideBySide: true
  });



  var submitQuestion = function() {
    event.preventDefault();

    var inputDeadline = $('#inputDeadline').data('DateTimePicker').getDate();
    var soonestDeadline = new Date(
      new Date().getTime() + 1000 * 60 * 10 * 1 * 1);
    if (inputDeadline < soonestDeadline) {
      alert('Input deadline is too close. Please give more than 10min for ' +
        'DUB-E');
      return;
    }
    // var data =  {
    //   startDate: new Date(),
    //   userOnly: true
    // };
    // $.post('/queryjobs/getqueryjobs', data, function(queryjobs) {
    //   var stop = false;
    //   for (var i = queryjobs.length - 1; i >= 0; i--) {
    //     // Look for a task with running status.
    //     if (queryjobs[i].status === 2) {
    //       stop = true;
    //     }
    //   }
    // }, 'JSON').fail(function() {
    //   alert('Error while posting to /queryjobs/getqueryjobs.');
    // });

    // Parse data from DOM.
    var newQueryJob = {
      timeissued: new Date().toISOString(),
      typed_cmd: $('#submitQuestion input#inputTypedCmd').val(),
      notification_sms: false,
      notification_email: $('#submitQuestion input#inputEmail')
        .prop('checked'),
      'is_public': $('#submitQuestion input#inputPublic').prop('checked'),
      deadline: new Date(new Date().getTime() + 1000 * 60 * 60 * 1 * 1)
        .toISOString()
    };

    // Use AJAX to post the object to our adduser service.
    $.post('/queryjobs/addqueryjob', newQueryJob, function(result) {
      if (result.length !== 1) {
        alert('Error while posting to /queryjobs/addqueryjob.');
      }
      var queryjob = result[0];
      callScheduleQueryJob(queryjob, function() {
        var data = {
          queryjobID: queryjob._id,
          limit: 1
        };
        $.post('/queryjobs/getqueryjobs', data, function(queryjobs) {
          if (queryjobs.length !== 1) {
            alert('Error while posting to /queryjobs/getqueryjobs.');
          } else {
            queryjobCards.addQueryJobToCard(queryjobs[0]);
          }
        }, 'JSON').fail(function() {
          alert('Error while posting to /queryjobs/getqueryjobs.');
        });
      });
    }, 'JSON').fail(function() {
      alert('Error while posting to /queryjobs/addqueryjob.');
    }).always(function() {
      $('#submitQuestion input#inputTypedCmd').val('');
    });
  };


  // Submit Question button click.
  $('#aSubmitQuestion').on('click', submitQuestion);
  //- For using "Enter" key.
  $('#btnSubmitQuestion').on('click', submitQuestion);

});
