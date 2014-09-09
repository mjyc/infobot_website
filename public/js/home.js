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

Home.prototype.createFeed = function(queryjob) {
  var feed = '';
  feed += '<div style="padding-top: 30px" class="row">';
  feed += '<p class="col-sm-8">';
  feed += '<span style="display: inline-block; font-weight: bold; padding-right: 10px">' + queryjob.user_name + '&nbsp;';
  feed += '<span style="font-weight: normal; color: gray;">' + formatTodayYesterday(new Date(queryjob.timeissued)) + '</span>';
  feed += '</span>';
  feed += '<span style="display: inline-block;">' + queryjob.typed_cmd + '</span>';
  feed += '</p>';
  feed += '<p style="text-align: right;" class="col-sm-4">';
  feed += '<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-default btn-xs">deadline at ' + formatAMPM(new Date(queryjob.deadline)) + '</button>';
  feed += '&nbsp;&nbsp;';
  feed += '<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-default btn-xs">in queue</button>';
  feed += '</p>';
  feed += '<div style="text-align: left;" class="col-xs-12">';
  feed += '<button type="button" class="btn btn-default">Cancel</button>';
  feed += '</div>';
  feed += '</div>';
  return feed;
};

Home.prototype.populateFeed = function(data, callback) {
  var that = this;

  if (!that.lock) {
    that.lock = true;
  } else {
    return callback({
      'timeissued': null,
      'feedContent': ''
    });
  }
  $.post('/queryjobs/listqueryjobs', data, function(results) {
    var timeissued = null;
    if (results.length > 1) {
      timeissued = results[results.length-1].timeissued;
    }

    var feedContent = '';
    $.each(results, function(index, value){
      feedContent += that.createFeed(value);
    });

    callback({
      'timeissued': timeissued,
      'feedContent': feedContent
    });
    that.lock = false;
  }, 'JSON');
};

Home.prototype.displayFeed = function() {
  var that = this;

  var data = {
    'startDate': new Date().toISOString(),
    'limit': that.LIMIT,
    'userOnly': that.userOnly
  };
  var callback = function(result) {
    $('#feedList').html(result.feedContent);
    that.lastTimeissued = result.timeissued;
  };

  that.populateFeed(data, callback);
};

Home.prototype.appendFeed = function() {
  var that = this;

  var data = {
    'startDate': that.lastTimeissued,
    'limit': that.LIMIT,
    'userOnly': that.userOnly
  };
  var callback = function(result) {
    $('#feedList').append(result.feedContent);
    that.lastTimeissued = result.timeissued;
  };

  that.populateFeed(data, callback);
};

Home.prototype.submitQuestion = function() {
  var that = this;

  return function(event) {
    event.preventDefault();

    var newQueryJob = {
      'timeissued': new Date().toISOString(),
      'typed_cmd': $('#submitQuestion input#inputTypedCmd').val(),
      'notification_sms': $('#submitQuestion button#btnToggleSMS')
        .hasClass('active'),
      'notification_email': $('#submitQuestion button#btnToggleEmail')
        .hasClass('active'),
      'deadline': new Date(new Date().getTime() + 1000*60*60*1*1)
        .toISOString()
    };

    // Use AJAX to post the object to our adduser service.
    $.post('/queryjobs/addqueryjob', newQueryJob, function(result) {
      that.displayFeed();
      that.callScheduleQueryJob(result[0], function(res) {
        console.log(res);
      });
    }, 'JSON');
  };
};
