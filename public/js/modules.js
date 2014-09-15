// =====================================================================
// Functions
// =====================================================================

function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

function formatTodayYesterday(date) {
  var strTime = '';
  var todayDate = new Date();
  var yesterdayDate = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 1);

  if (date.getDate() === todayDate.getDate()) {
    strTime += 'Today at ' + formatAMPM(date);
  } else if (date.getDate() === yesterdayDate.getDate()) {
    strTime += 'Yesterday at ' + formatAMPM(date);
  } else {
    strTime += date.toDateString().slice(4, 11) + formatAMPM(date);
  }
  return strTime;
}


// =====================================================================
// Module
// =====================================================================

var queryjobCardManager = (function() {

  // ROS QueryJob status.
  var RECEIVED = 0;
  var SCHEDULED = 1;
  var RUNNING = 2;
  var SUCCEEDED = 3;
  var CANCELLED = 4;
  var FAILED = 5;

  // DOM templates.
  var cardTemplate = $('<div>').addClass('thumbnail').append(
    $('<div>').addClass('caption'));
  var nameTemplate = $('<span>').addClass('name-text');
  var timeTemplate = $('<span>').addClass('time-text');
  var tagTemplate = $('<button>').addClass('btn btn-xs')
    .css('opacity', 1).attr('disabled', 'disabled');

  // JQuery object for a card.
  var create = function(queryjob) {
    var card = cardTemplate.clone();

    $.each(['populateCard'], function(index, event) {
      card.on(event, events[event]);
    });

    card.trigger('populateCard', queryjob);

    return card;
  };

  // Possible events.
  var events = {

    populateCard: function(event, queryjob) {
      var card = $(this).addClass('queryjobCard');

      var cardRow = card.children() //caption
        .append($('<div>').addClass('row'))
        .children(); // row

      // Create user name and issued time.
      var userName = nameTemplate.clone()
        .text(queryjob.user_name).append('&nbsp;&nbsp;');
      var userTime = timeTemplate.clone()
        .text(formatTodayYesterday(new Date(queryjob.timeissued)));
      var userInfo = $('<p>').addClass('col-sm-12').css('text-align', 'left')
        .append(userName.append(userTime))
        .appendTo(cardRow);

      // Create typed command.
      cardRow.append($('<p>').addClass('col-sm-12').css('text-align', 'left').text(queryjob.typed_cmd));

      // Create user status tags.
      var userTags = $('<p>').addClass('col-sm-12').css('text-align', 'left')
        .appendTo(cardRow);
      if (JSON.parse(queryjob.notification_email || false)) {
        userTags.append(tagTemplate.clone().addClass('btn-default').text('text'));
      }
      if (queryjob.deadline) {
        userTags.append(tagTemplate.clone().addClass('btn-default').text('deadline at' + formatAMPM(new Date(queryjob.deadline))));
      }
      if (queryjob.status === RECEIVED || queryjob.status === SCHEDULED) {
        userTags.append('&nbsp;&nbsp;').append(tagTemplate.clone().text('in queue'));
      } else if (queryjob.status === RUNNING) {
        userTags.append('&nbsp;&nbsp;').append(tagTemplate.clone().removeClass('btn-xs').addClass('btn-warning btn-lg').text('running'));
      }
    }
  };

  return {
    create: create
  };

})();


var home = (function() {

  var NUM_INITIAL_CARDS = 5;
  var NUM_ADDITIONAL_CARDS = 5;

  var cardManager = null;

  var container = $('#container');
  var cards = {};
  var lastTimeissued = new Date();

  function refresh() {
    var elem = container;
    // Condition check.
    if (elem.is('.refreshing') || elem.is('.loading') || elem.is('.adding')) {
      console.log('Previous event not finished.');
      return;
    }

    // Set container state.
    elem.addClass('refreshing');

    // Remove contents in container.
    elem.find('div.thumbnail').remove();
    cards = {};

    var data = {
      startDate: new Date().toISOString(),
      limit: NUM_INITIAL_CARDS,
      userOnly: false,
      publicOnly: false
    };
    $.post('/queryjobs/getqueryjobs', data, function(queryjobs) {
      $.each(queryjobs, function(i, queryjob) {
        cards[queryjob._id] = cardManager
          .create(queryjob);
        cards[queryjob._id].appendTo(elem);
      });
      if (queryjobs.length >= 1) {
        lastTimeissued = queryjobs[queryjobs.length - 1].timeissued;
      }
    }, 'JSON').fail(function() {
      alert('Error while posting to /queryjobs/getqueryjobs.');
    }).always(function() {
      elem.removeClass('refreshing');
    });
  }

  // Append more QueryJobs to the container.
  function loadMore() {
    var elem = container;
    // Condition check.
    if (elem.is('.refreshing') || elem.is('.loading') || elem.is('.adding')) {
      console.log('Previous event not finished.');
      return;
    }

    elem.addClass('loading');

    var data = {
      startDate: lastTimeissued,
      limit: NUM_ADDITIONAL_CARDS,
      userOnly: false,
      publicOnly: false
    };
    $.post('/queryjobs/getqueryjobs', data, function(queryjobs) {
      $.each(queryjobs, function(index, queryjob) {
        cards[queryjob._id] = cardManager
          .create(queryjob);
        cards[queryjob._id].appendTo(elem);
      });
      if (queryjobs.length >= 1) {
        lastTimeissued = queryjobs[queryjobs.length - 1].timeissued;
      }
    }, 'JSON').fail(function() {
      alert('Error while posting to /queryjobs/getqueryjobs.');
    }).always(function() {
      elem.removeClass('loading');
    });
  }

  // Prepend newest QueryJob to the container.
  function add(queryjob) {
    // Condition checks.
    if (cards[queryjob._id]) {
      alert('QueryJob with ID=' + queryjob._id + ' already exists. ' +
        'Not submitting this question.');
      return;
    }
    var elem = container;
    if (elem.is('.refreshing') || elem.is('.loading') || elem.is('.adding')) {
      alert('Previous event was not finished, try again.');
      return;
    }

    // Set container state.
    elem.addClass('adding');

    cards[queryjob._id] = cardManager
          .create(queryjob);
    cards[queryjob._id].css('opacity', 0).prependTo(elem);
    cards[queryjob._id].animate({
      'opacity': 1
    }, 200, function() {
      elem.removeClass('adding');
    });

  }

  var submitQuestion = function() {

    event.preventDefault();

    var newQueryJob = {
      timeissued: new Date().toISOString(),
      typed_cmd: $('#submitQuestion input#inputTypedCmd').val(),
      notification_sms: false,
      notification_email: $('#submitQuestion button#btnToggleEmail')
        .hasClass('active'),
      'is_public': $('#submitQuestion button#btnTogglePublic')
        .hasClass('active'),
      deadline: new Date(new Date().getTime() + 1000 * 60 * 60 * 1 * 1)
        .toISOString()
    };

    // Use AJAX to post the object to our adduser service.
    $.post('/queryjobs/addqueryjob', newQueryJob, function(result) {
      if (result.length !== 1) {
        alert('Error while posting to /queryjobs/addqueryjob.');
      }
      container.trigger('add', [result[0]]);

      $('#submitQuestion input#inputTypedCmd').val('');
    }, 'JSON').fail(function() {
      alert('Error while posting to /queryjobs/addqueryjob.');
    });
  };

  var init = function(options) {
    cardManager = options.cardManager;
    refresh();
  };

  return {
    loadMore: loadMore,
    add: add,
    submitQuestion: submitQuestion,
    init: init
  };

})();
