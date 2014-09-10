// =====================================================================
// DOM Ready
// =====================================================================

$(document).ready(function() {
  var home = new Home();

  // Show feeds
  home.displayFeed();

  // Set up menu buttons.
  $('#Home').on('click', 'a', function() {
    home.userOnly = true;
    home.displayFeed();
  });

  $('#QFeed').on('click', 'a', function() {
    home.userOnly = null;
    home.displayFeed();
  });

  // Submit Question button click.
  $('#btnSubmitQuestion').on('click', home.submitQuestion());

  // Infinite scroll.
  $(window).scroll(function() {
    var wintop = $(window).scrollTop();
    var docheight = $(document).height();
    var winheight = $(window).height();
    var scrolltrigger = 0.95;

    if  ((wintop/(docheight-winheight)) > scrolltrigger) {
      home.appendFeed();
    }
  });

});


// =====================================================================
// Functions
// =====================================================================

function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

function formatTodayYesterday(date) {
  var strTime = '';
  var todayDate = new Date();
  var yesterdayDate = new Date(new Date().getTime() - 1000*60*60*24*1);

  if (date.getDate() === todayDate.getDate()) {
    strTime += 'Today at ' + formatAMPM(date);
  } else if (date.getDate() === yesterdayDate.getDate()) {
    strTime += 'Yesterday at ' + formatAMPM(date);
  } else {
    strTime += date.toDateString().slice(4,11) + formatAMPM(date);
  }
  return strTime;
}


// =====================================================================
// Module
// =====================================================================

var Home = function() {
  var that = this;
  this.LIMIT = 5;
  this.userOnly = true;
  this.lastTimeissued = new Date();

  // Copied from
  this.RECEIVED = 0;
  this.SCHEDULED = 1;
  this.RUNNING = 2;
  this.SUCCEEDED = 3;
  this.CANCELLED = 4;
  this.FAILED = 5;

  // Heck to prevent creating multiple, overlapping feeds.
  this.lock = false;

  this.ros = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
  });

  this.ros.on('connection', function() {
    console.log('Connected to websocket server.');
  });

  this.ros.on('error', function(error) {
    console.log('Error connecting to websocket server: ', error);
  });

  this.ros.on('close', function() {
    console.log('Connection to websocket server closed.');
    location.reload(true);
  });

  var listener = new ROSLIB.Topic({
    ros : this.ros,
    name : '/queryjob_update',
    messageType : 'sara_queryjob_manager/QueryJobUpdate'
  });

  listener.subscribe(function(message) {
    console.log('Received message');
    console.log(message);

    // if ($.inArray("status", message.field_names)) {
    //   $.('#btn-'+message.queryjob_id).removeClass('btn-default');

    //   $.('#btn-'+message.queryjob_id).addClass('btn-default');
    //   $.('#btn-'+message.queryjob_id).addClass('btn-default');
    // }
  });
};

Home.prototype.callScheduleQueryJob = function(queryjob, callback) {
  var that = this;

  var scheduleQueryJob = new ROSLIB.Service({
    ros : that.ros,
    name : '/schedule_queryjob',
    serviceType : 'sara_queryjob_manager/ScheduleQueryJob'
  });

  var timeissuedSec = Math.floor(new Date(queryjob.timeissued).getTime()/1000);

  var request = new ROSLIB.ServiceRequest({
    queryjob_id : queryjob._id,
    timeissued : timeissuedSec
  });

  scheduleQueryJob.callService(request, function(result) {
    callback(result);
  });

};

Home.prototype.populateFeed = function(data) {
  var that = this;

  if (!that.lock) {
    that.lock = true;
  } else {
    return;
  }

  $.post('/queryjobs/listqueryjobs', data, function(results) {
    // var timeissued = null;
    if (results.length > 1) {
      that.lastTimeissued = results[results.length-1].timeissued;
    }

    $.each(results, function(index, queryjob) {

      // var divQueryJob = $('<div/>').css('padding-top', '30px').addClass("row");
      // var userInputLeftP = $('<p/>', {
      //   class: 'col-sm-8'
      // });
      // $('#feedList').append(queryJobDiv);


      // Create div for each QueryJob.
      $('#feedList').append('<div " id="' + queryjob._id + '"></div>');
      $('#'+queryjob._id).css('padding-top', '30px').addClass('row');

      // User info.
      $('#'+queryjob._id).append('<p class="col-sm-8" id="' + queryjob._id + '-userinput-left"></p>');
      $('#'+queryjob._id + '-userinput-left').append('<span class="name-text">' + queryjob.user_name + '&nbsp;&nbsp;<span class="time-text">' + formatTodayYesterday(new Date(queryjob.timeissued)) + '</span></span>');
      $('#'+queryjob._id + '-userinput-left').append('<span class="cmd-text">' + queryjob.typed_cmd + '</span>');

      // User input buttons.
      $('#'+queryjob._id).append('<p style="text-align: right;" class="col-sm-4" id="' + queryjob._id + '-userinput-right"></p>');
      if (queryjob.notification_email) {
        $('#'+queryjob._id + '-userinput-right').append('&nbsp;&nbsp;<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-default btn-xs">email</button>');
      }
      if (queryjob.deadline) {
        $('#'+queryjob._id + '-userinput-right').append('&nbsp;&nbsp;<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-default btn-xs">deadline at ' + formatAMPM(new Date(queryjob.deadline)) + '</button>');
      }

      // Cancel button.
      $('#'+queryjob._id).append('<div style="text-align: left;" class="col-xs-12" id="' + queryjob._id + '-buttons"></div>');
      if (queryjob.status === that.RECEIVED || queryjob.status === that.SCHEDULED || queryjob.status === that.RUNNING) {
        $('#'+queryjob._id + '-buttons').append('<button type="button" class="btn btn-default">Cancel</button>');
      }

      // Robot output buttons
      if (queryjob.status === that.SUCCEEDED || queryjob.status === that.CANCELLED || queryjob.status === that.FAILED) {
        $('#'+queryjob._id + '-buttons').append('<button type="button" class="btn btn-default">Show & Hide</button>');
      }
    });

    that.lock = false;
  }, 'JSON');
};

Home.prototype.displayFeed = function() {
  var that = this;

  var data = {
    startDate: new Date().toISOString(),
    limit: that.LIMIT,
    userOnly: that.userOnly
  };

  $('feedList').html('');
  that.populateFeed(data);
};

Home.prototype.appendFeed = function() {
  var that = this;

  var data = {
    startDate: that.lastTimeissued,
    limit: that.LIMIT,
    userOnly: that.userOnly
  };

  that.populateFeed(data);
};

Home.prototype.submitQuestion = function() {
  var that = this;

  return function(event) {
    event.preventDefault();

    var newQueryJob = {
      timeissued: new Date().toISOString(),
      typed_cmd: $('#submitQuestion input#inputTypedCmd').val(),
      notification_sms: $('#submitQuestion button#btnToggleSMS')
        .hasClass('active'),
      notification_email: $('#submitQuestion button#btnToggleEmail')
        .hasClass('active'),
      deadline: new Date(new Date().getTime() + 1000*60*60*1*1)
        .toISOString()
    };

    // Use AJAX to post the object to our adduser service.
    $.post('/queryjobs/addqueryjob', newQueryJob, function(result) {
      that.callScheduleQueryJob(result[0], function(res) {
        console.log(res);
        that.displayFeed();
      });
    }, 'JSON');
  };
};
