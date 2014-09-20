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
    if (callback) {
      callback(result);
    }
  }, function() {
    console('Error while calling /schedule_queryjob ROS service.');
    alert('Oops, something went wrong. Please try refreshing the page.');
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

  cancelQueryJob.callService(request, function(result, callback) {
    if (callback) {
      callback(result);
    }
  }, function() {
    console('Error while calling /cancel_queryjob ROS service.');
    alert('Oops, something went wrong. Please try refreshing the page.');
  });
}

var listener = new ROSLIB.Topic({
  ros: ros,
  name: '/queryjob_update',
  messageType: 'sara_queryjob_manager/QueryJobUpdate'
});

listener.subscribe(function(message) {
  queryjobCards.refreshCard(message.queryjob_id);
});


// =====================================================================
// Module
// =====================================================================

var infscroll = (function() {

  var scrolltrigger = 0.95;
  var callback = function() {};

  $(window).scroll(function() {
    var wintop = $(window).scrollTop();
    var docheight = $(document).height();
    var winheight = $(window).height();

    if ((wintop / (docheight - winheight)) > scrolltrigger) {
      callback();
    }
  });

  var init = function(option) {
    scrolltrigger = option.scrolltrigger || 0.95;
    callback = option.callback || function() {};
  };

  return {
    init: init
  };

}());


// =====================================================================
// DOM Ready
// =====================================================================

$(document).ready(function() {

  // Make switches pretty.
  $('.js-switch').each(function(index) {
    new Switchery(this);
  });

  // Initialize contents.
  var container = $('#container');
  var option = {
    container: container,
    cancelCallback: callCancelQueryJob
  };
  queryjobCards.init(option);
  queryjobCards.reloadCards();

  // Infinite scroll setups.
  infscroll.init({
    callback: queryjobCards.loadMoreCards
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
    minuteStepping: 1,
    // minDate: new Date(),
    minDate: new Date(
      new Date().getTime() + 1000 * 60 * 10 * 1 * 1), // at least 10min
    maxDate: new Date(new Date().getTime() +
      1000 * 60 * 60 * 24 * 7), // week later
    sideBySide: true
  });

  // Submit question callback setup.
  var submitQuestion = function(event) {
    event.preventDefault();

    if ($('#submitQuestion input#inputTypedCmd').val() === '') {
      return;
    }

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
        console.log('Error while posting to /queryjobs/addqueryjob.');
        alert('Oops, something went wrong. Please try refreshing the page.');

      }
      var queryjob = result[0];
      callScheduleQueryJob(queryjob, function() {
        var data = {
          queryjobID: queryjob._id,
          limit: 1
        };
        $.post('/queryjobs/getqueryjobs', data, function(queryjobs) {
          if (queryjobs.length !== 1) {
            console.log('Error while posting to /queryjobs/getqueryjobs.');
            alert(
              'Oops, something went wrong. Please try refreshing the page.');

          } else {
            queryjobCards.addNewCard(queryjobs[0]);
          }
        }, 'JSON').fail(function() {
          console.log('Error while posting to /queryjobs/getqueryjobs.');
          alert('Oops, something went wrong. Please try refreshing the page.');

        });
      });
    }, 'JSON').fail(function() {
      console.log('Error while posting to /queryjobs/addqueryjob.');
      alert('Oops, something went wrong. Please try refreshing the page.');

    }).always(function() {
      $('#submitQuestion input#inputTypedCmd').val('');
    });
  };

  // Submit Question button click.
  $('#aSubmitQuestion').on('click', submitQuestion);
  //- For using "Enter" key.
  $('#btnSubmitQuestion').on('click', submitQuestion);

});
