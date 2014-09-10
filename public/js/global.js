// =====================================================================
// DOM Ready
// =====================================================================

$(document).ready(function() {

  // // ROS Setups.
  // var ros = new ROSLIB.Ros({
  //   url : 'ws://localhost:9090'
  // });

  // ros.on('connection', function() {
  //   console.log('Connected to websocket server.');
  // });

  // ros.on('error', function(error) {
  //   // TODO: redirect to other page.
  //   console.log('Error connecting to websocket server: ', error);
  //   alert('There is some problem with DUB-E... Please visit us later.');
  // });

  // ros.on('close', function() {
  //   // TODO: redirect to other page.
  //   console.log('Connection to websocket server closed.');
  //   alert('There is some problem with DUB-E... Please visit us later.');
  // });

  // // Populate query feeds.
  // populateFeed(qFeedPage);

  // // Set up buttons.
  // $('#Home').on('click', 'a', function() {
  //   qFeedPage = false;
  //   populateFeed(qFeedPage);
  // });

  // $('#QFeed').on('click', 'a', function() {
  //   qFeedPage = true;
  //   populateFeed(qFeedPage);
  // });

  // // Submit Question button click.
  // $('#btnSubmitQuestion').on('click', submitQuestion);

  // $(window).scroll(function() {
  //   var wintop = $(window).scrollTop();
  //   var docheight = $(document).height();
  //   var winheight = $(window).height();
  //   var scrolltrigger = 0.95;

  //   if  ((wintop/(docheight-winheight)) > scrolltrigger) {
  //     populateFeed(qFeedPage, lastDate);
  //   }

  // });

});

var Home = function() {
  var that = this;

  var populateFeed = function(data, callback) {
    $.post('/queryjobs/listqueryjobs', data, function(results) {
        var timeissued = null;
        if (results.length > 1) {
          timeissued = results[results.length-1].timeissued;
        }

        var feedContent = '';
        $.each(results, function(index, value){
          console.log(index);
          console.log(value);
          // outData.feedContent += createFeed(this);
        });

        callback({
          'timeissued': timeissued,
          'feedContent': feedContent
        });
    }, 'JSON');
  };

};

// Home.prototype.refreshFeed = function(data) {
//   var that = this;

//   var data = {
//     'startDate': new Date(),
//     'limit': LIMIT,
//     'userOnly': data.userOnly
//   };
//   var callback = function(result) {
//     $('#feedList').html(result.feedContent);
//   };

//   that.populateFeed(data, callback);
// };



// =====================================================================
// Functions
// =====================================================================

// function formatAMPM(date) {
//   var hours = date.getHours();
//   var minutes = date.getMinutes();
//   var ampm = hours >= 12 ? 'pm' : 'am';
//   hours = hours % 12;
//   hours = hours ? hours : 12; // the hour '0' should be '12'
//   minutes = minutes < 10 ? '0'+minutes : minutes;
//   var strTime = hours + ':' + minutes + ' ' + ampm;
//   return strTime;
// }

// function formatTodayYesterday(date) {
//   var strTime = '';
//   var todayDate = new Date();
//   var yesterdayDate = new Date(new Date().getTime() - 1000*60*60*24*1);

//   if (date.getDate() === todayDate.getDate()) {
//     strTime += 'Today at ' + formatAMPM(date);
//   } else if (date.getDate() === yesterdayDate.getDate()) {
//     strTime += 'Yesterday at ' + formatAMPM(date);
//   } else {
//     strTime += date.toDateString().slice(4,11) + formatAMPM(date);
//   }
//   return strTime;
// }

// // Display Feeds

// function createFeed(queryjob) {
//   var feed = '';
//   feed += '<div style="padding-top: 30px" class="row">';
//   feed += '<p class="col-sm-8">';
//   feed += '<span style="display: inline-block; font-weight: bold; padding-right: 10px">' + queryjob.user_name + '&nbsp;';
//   feed += '<span style="font-weight: normal; color: gray;">' + formatTodayYesterday(new Date(queryjob.timeissued)) + '</span>';
//   feed += '</span>';
//   feed += '<span style="display: inline-block;">' + queryjob.typed_cmd + '</span>';
//   feed += '</p>';
//   feed += '<p style="text-align: right;" class="col-sm-4">';
//   feed += '<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-default btn-xs">deadline at ' + formatAMPM(new Date(queryjob.deadline)) + '</button>';
//   feed += '&nbsp;&nbsp;';
//   feed += '<button type="button" disabled="disabled" style="opacity: 1;" class="btn btn-default btn-xs">in queue</button>';
//   feed += '</p>';
//   feed += '<div style="text-align: left;" class="col-xs-12">';
//   feed += '<button type="button" class="btn btn-default">Cancel</button>';
//   feed += '</div>';
//   feed += '</div>';
//   return feed;
// }

// Submit question.
function submitQuestion(event) {
  event.preventDefault();

  // TODO: implement input validation.

  var newQueryJob = {
    'timeissued': new Date(),
    'typed_cmd': $('#submitQuestion input#inputTypedCmd').val(),
    'notification_sms': $('#submitQuestion button#btnToggleSMS')
      .hasClass('active'),
    'notification_email': $('#submitQuestion button#btnToggleEmail')
      .hasClass('active'),
    'deadline': new Date(new Date().getTime() + 1000*60*60*1*1)
      .toISOString()
  };

  // Use AJAX to post the object to our adduser service.
  $.ajax({
    type: 'POST',
    data: newQueryJob,
    url: '/queryjobs/addqueryjob',
    dataType: 'JSON'
  }).done(function(res) {
    console.log(res);
    // populateFeed(qFeedPage);
  }).fail(function() {
    console.log('error occured');
  });
}
