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

Home.prototype.populateFeed = function(data, callback) {
  var that = this;

  if (!that.lock) {
    that.lock = true;
  } else {
    return callback(null);  // return null
  }
  $.post('/queryjobs/listqueryjobs', data, function(results) {
    var timeissued = null;
    if (results.length > 1) {
      timeissued = results[results.length-1].timeissued;
    }

    var feedContent = '';
    $.each(results, function(index, value) {
      var queryjob = value;
      var id_userinput_dashboard = queryjob._id + '-userinput-dashboard';
      // var id_userinput_dashboard = queryjob._id + '-userinput-dashboard';
      // var id_result_dashboard = queryjob._id + '-result-dashboard';

      // feedContent += that.createFeed(value);
      feedContent += '<div style="padding-top: 30px" class="row" id="' + queryjob._id + '">';
      feedContent += '<p class="col-sm-8">';
      feedContent += '<span style="display: inline-block; font-weight: bold; padding-right: 10px">' + queryjob.user_name + '&nbsp;';
      feedContent += '<span style="font-weight: normal; color: gray;">' + formatTodayYesterday(new Date(queryjob.timeissued)) + '</span>';
      feedContent += '</span>';
      feedContent += '<span style="display: inline-block;">' + queryjob.typed_cmd + '</span>';
      feedContent += '</p>';
      feedContent += '<p style="text-align: right;" class="col-sm-4" id="' + id_userinput_dashboard + '">';
      feedContent += '</p>';
      // feedContent += '<div style="text-align: left;" class="col-xs-12">';
      // feedContent += '<button type="button" class="btn btn-default">Cancel</button>';
      // feedContent += '</div>';
      feedContent += '</div>';
    });

    // Assumes feedContents are set to HTML in callback.
    if (timeissued !== null) {
      callback({ 'timeissued': timeissued, 'feedContent': feedContent });
    } else {
      callback(null);
    }

    // Update userinput dashboard
    $.each(results, function(index, value) {
      var queryjob = value;
      var id_userinput_dashboard = queryjob._id + '-userinput-dashboard';

      if (queryjob.deadline) {
        $('#'+id_userinput_dashboard).append('<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-default btn-xs">deadline at ' + formatAMPM(new Date(queryjob.deadline)) + '</button>');
      }

      var cancelBtn = '';
      cancelBtn += '<div style="text-align: left;" class="col-xs-12">';
      cancelBtn += '<button type="button" class="btn btn-default">Cancel</button>';
      cancelBtn += '</div>';
      if (queryjob.status === that.RECEIVED || queryjob.status === that.SCHEDULED) {
        $('#'+id_userinput_dashboard).append('&nbsp;&nbsp;<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-default btn-xs">in queue</button>');
        $('#'+id_userinput_dashboard).add(cancelBtn);
      } else if (queryjob.status === that.RUNNING) {
        $('#'+id_userinput_dashboard).append('&nbsp;&nbsp;<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-warning btn-xs">running</button>');
        $('#'+id_userinput_dashboard).add(cancelBtn);
      }
    });

    // Update result dashboard
    $.each(results, function(index, value) {
      var queryjob = value;
      var id_userinput_dashboard = queryjob._id + '-userinput-dashboard';
      // var id_result_dashboard = queryjob._id + '-result-dashboard';
      var id_result_dashboard = queryjob._id + '-userinput-dashboard';

      var resultP = '';
      resultP += '<p style="text-align: right;" class="col-sm-4" id="' + id_result_dashboard + '">';
      resultP += '</p>';

      var toggleBtn = '';
      toggleBtn += '<div style="text-align: left;" class="col-xs-12">';
      toggleBtn += '<button type="button" class="btn btn-default">Cancel</button>';
      toggleBtn += '</div>';

      if (queryjob.status === that.SUCCEEDED || queryjob.status === that.CANCELLED || queryjob.status === that.FAILED) {
        $('#'+id_userinput_dashboard).add(resultP);

        if (queryjob.status === that.SUCCEEDED) {
          $('#'+id_result_dashboard).append('&nbsp;&nbsp;<button type="button" class="btn btn-success btn-xs">succeeded</button>');
          $('#'+id_result_dashboard).append(toggleBtn);
        } else if (queryjob.status === that.CANCELLED) {
          $('#'+id_result_dashboard).append('&nbsp;&nbsp;<button type="button" class="btn btn-danger btn-xs">cancelled</button>');
          $('#'+id_result_dashboard).append(toggleBtn);
        } else if (queryjob.status === that.FAILED) {
          $('#'+id_result_dashboard).append('&nbsp;&nbsp;<button type="button" class="btn btn-danger btn-xs">failed</button>');
          $('#'+id_result_dashboard).append(toggleBtn);
        }
      }
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
    if (result) {
      $('#feedList').html(result.feedContent);
      that.lastTimeissued = result.timeissued;
    }
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
    if (result) {
      $('#feedList').append(result.feedContent);
      that.lastTimeissued = result.timeissued;
    }
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
      that.callScheduleQueryJob(result[0], function(res) {
        console.log(res);
        that.displayFeed();
      });
    }, 'JSON');
  };
};
