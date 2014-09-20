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
    publicMode: true,
    container: container
  };
  queryjobCards.init(option);
  queryjobCards.reloadCards();

  // Infinite scroll setups.
  infscroll.init({
    callback: queryjobCards.loadMoreCards
  });
});
