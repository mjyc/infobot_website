// =====================================================================
// DOM Ready
// =====================================================================

$(document).ready(function() {
  var home = new Home();

  // Show feeds
  home.displayFeeds();

  // Set up menu buttons.
  $('#Home').on('click', 'a', function() {
    home.userOnly = true;
    home.displayFeeds();
  });

  $('#QFeed').on('click', 'a', function() {
    home.userOnly = null;
    home.displayFeeds();
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
      home.appendFeeds();
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
  this.LIMIT = 10;
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
    that.displayFeeds();
  });

  this.cancel = new ROSLIB.Topic({
    ros : that.ros,
    name : '/run_query/cancel',
    messageType : 'actionlib_msgs/GoalID'
  });
  this.goalID = new ROSLIB.Message({});
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

Home.prototype.populateFeed = function(queryjob) {
  var that = this;

  if (!that.lock) {
    that.lock = true;
  } else {
    return;
  }

  // User info.
  $('#'+queryjob._id).append('<p class="col-sm-8" id="' + queryjob._id + '-userinput-left"></p>');
  $('#'+queryjob._id + '-userinput-left').append('<span class="name-text">' + queryjob.user_name + '&nbsp;&nbsp;<span class="time-text">' + formatTodayYesterday(new Date(queryjob.timeissued)) + '</span></span>');
  $('#'+queryjob._id + '-userinput-left').append('<span class="cmd-text">' + queryjob.typed_cmd + '</span>');

  // User status buttons.
  $('#'+queryjob._id).append('<p style="text-align: right;" class="col-sm-4" id="' + queryjob._id + '-userinput-right"></p>');
  if (queryjob.notification_email === 'true') {
    $('#'+queryjob._id + '-userinput-right').append('&nbsp;&nbsp;<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-default btn-xs">email</button>');
  }
  if (queryjob.deadline) {
    $('#'+queryjob._id + '-userinput-right').append('&nbsp;&nbsp;<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-default btn-xs">deadline at ' + formatAMPM(new Date(queryjob.deadline)) + '</button>');
  }
  // Show "in queue".
  if (queryjob.status === that.RECEIVED || queryjob.status === that.SCHEDULED) {
    $('#'+queryjob._id + '-userinput-right').append('&nbsp;&nbsp;<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-info btn-xs">in queue</button>');
  }
  // Show "running".
  if (queryjob.status === that.RUNNING) {
    $('#'+queryjob._id + '-userinput-right').append('&nbsp;&nbsp;<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-warning btn-xs">running</button>');
  }

  // Cancel button.
  $('#'+queryjob._id).append('<div style="text-align: left;" class="col-xs-12" id="' + queryjob._id + '-user-buttons"></div>');
  // if (queryjob.status === that.RECEIVED || queryjob.status === that.SCHEDULED || queryjob.status === that.RUNNING) {
  if (queryjob.status === that.RUNNING) {
    $('#'+queryjob._id + '-user-buttons').append('<button type="button" class="btn btn-default" id="' + queryjob._id + '-user-buttons-cancel">Cancel</button>');
    $('#'+queryjob._id + '-user-buttons-cancel').click(function() {
      that.cancel.publish(that.goalID);
    });
  }

  // Show results.
  if (queryjob.status === that.SUCCEEDED || queryjob.status === that.CANCELLED || queryjob.status === that.FAILED) {

    // DUB-E info.
    $('#'+queryjob._id).append('<p class="col-sm-8" id="' + queryjob._id + '-dube-left"></p>');
    $('#'+queryjob._id + '-dube-left').append('<span class="name-text">DUB-E&nbsp;&nbsp;<span class="time-text">' + formatTodayYesterday(new Date(queryjob.timeissued)) + '</span></span>');
    if (queryjob.response_text) {
      $('#'+queryjob._id + '-dube-left').append('<span class="cmd-text">' + queryjob.response_text + '</span>');
    }

    // DUB-E status buttons.
    $('#'+queryjob._id).append('<p style="text-align: right;" class="col-sm-4" id="' + queryjob._id + '-dube-right"></p>');
    if (queryjob.status === that.SUCCEEDED) {
      $('#'+queryjob._id + '-dube-right').append('&nbsp;&nbsp;<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-default btn-xs">' + queryjob.response_confidence + '% confidence</button>');
      $('#'+queryjob._id + '-dube-right').append('&nbsp;&nbsp;<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-success btn-xs">success</button>');
    } else if (queryjob.status === that.CANCELLED) {
      $('#'+queryjob._id + '-dube-right').append('&nbsp;&nbsp;<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-danger btn-xs">cancelled</button>');
    } else if (queryjob.status === that.FAILED) {
      $('#'+queryjob._id + '-dube-right').append('&nbsp;&nbsp;<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-danger btn-xs">failed</button>');
    }

    // Show results.
    if (queryjob.status === that.SUCCEEDED) {
      $('#'+queryjob._id).append('<div style="text-align: center; padding-bottom: 10px;" class="col-xs-12" id="' + queryjob._id + '-result-img"></div>');
      $('#'+queryjob._id + '-result-img').append('<img src="' + queryjob.response_img_path + '" class="img-thumbnail" alt="Result">');

      // Robot output buttons
      $('#'+queryjob._id).append('<div style="text-align: center;" class="col-xs-12" id="' + queryjob._id + '-result-buttons"></div>');
      $('#'+queryjob._id + '-result-buttons').append('<button type="button" class="btn btn-default"><i class="fa fa-thumbs-o-up"></i></button>&nbsp;&nbsp;');
      $('#'+queryjob._id + '-result-buttons').append('<button type="button" class="btn btn-default"><i class="fa fa-thumbs-o-down"></i></button>');
    }

  }

  that.lock = false;
};

Home.prototype.populateFeeds = function(data) {
  var that = this;

  $.post('/queryjobs/getqueryjobs', data, function(results) {
    // var timeissued = null;
    if (results.length > 1) {
      that.lastTimeissued = results[results.length-1].timeissued;
    }

    $.each(results, function(index, queryjob) {
      // Create div for each QueryJob.
      $('#feedList').append('<div " id="' + queryjob._id + '"></div>');
      $('#'+queryjob._id).css('padding-top', '30px').addClass('row');
      that.populateFeed(queryjob);

    });

  }, 'JSON');
};

Home.prototype.displayFeeds = function() {
  var that = this;

  var data = {
    startDate: new Date().toISOString(),
    limit: that.LIMIT,
    userOnly: that.userOnly
  };

  $('#feedList').children().remove();
  that.populateFeeds(data);
};

Home.prototype.appendFeeds = function() {
  var that = this;

  var data = {
    startDate: that.lastTimeissued,
    limit: that.LIMIT,
    userOnly: that.userOnly
  };

  that.populateFeeds(data);
};

Home.prototype.submitQuestion = function() {
  var that = this;

  return function(event) {
    event.preventDefault();

    var newQueryJob = {
      timeissued: new Date().toISOString(),
      typed_cmd: $('#submitQuestion input#inputTypedCmd').val(),
      notification_sms: false,
      notification_email: $('#submitQuestion button#btnToggleEmail')
        .hasClass('active'),
      'public': $('#submitQuestion button#btnTogglePublic')
        .hasClass('active'),
      deadline: new Date(new Date().getTime() + 1000*60*60*1*1)
        .toISOString()
    };

    // Use AJAX to post the object to our adduser service.
    $.post('/queryjobs/addqueryjob', newQueryJob, function(result) {
      that.callScheduleQueryJob(result[0], function(res) {
        that.displayFeeds();
      });
    }, 'JSON');
  };
};
