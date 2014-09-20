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
  var yesterdayDate = new Date(
    new Date().getTime() - 1000 * 60 * 60 * 24 * 1);

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

var queryjobCards = (function() {

  // Constants
  var NUM_INITIAL_CARDS = 10;
  var NUM_ADDITIONAL_CARDS = 5;

  // ROS QueryJob status.
  var RECEIVED = 0;
  var SCHEDULED = 1;
  var RUNNING = 2;
  var SUCCEEDED = 3;
  var CANCELLED = 4;
  var FAILED = 5;

  // State variables.
  var publicMode = false;

  // Selector variables.
  var container = null; // must be set from the init function.
  var cancelCallback = null;

  // DOM templates.
  // var cardTemplate = $('<div>').addClass('thumbnail').append(
  //   $('<div>').addClass('caption'));
  var cardTemplate = $('<div>').addClass('panel panel-default').append(
    $('<div>').addClass('panel-body'));
  var nameTemplate = $('<span>').addClass('name-text');
  var timeTemplate = $('<span>').addClass('time-text');
  var tagTemplate = $('<button>').addClass('btn btn-xs')
    .css('opacity', 1).attr('disabled', 'disabled');
  // var statusTemplate = $('<button>').addClass('btn btn-block')
  //   .css('opacity', 1).attr('disabled', 'disabled');
  var statusTemplate = $('<div>').addClass('alert')
    .css('text-align', 'center')
    // .css('margin-top', '20px')
    .css('margin-bottom', '0px');


  var cardEvents = {

    refresh: function(event) {
      var elem = $(this);

      var postInput = {
        queryjobID: elem.data('queryjob')._id,
        limit: 1
      };
      $.post('/queryjobs/getqueryjobs', postInput, function(queryjobs) {
        if (queryjobs.length !== 1) {
          alert('Error while posting to /queryjobs/getqueryjobs.');
        } else {

          var queryjob = queryjobs[0];
          elem.data('queryjob', queryjob);
          elem.trigger('updateStatus');

        }
      }, 'JSON').fail(function() {
        alert('Error while posting to /queryjobs/getqueryjobs.');
      });
    },

    populate: function(event, queryjob) {
      var elem = $(this);
      // Save queryjob data.
      elem.data('queryjob', queryjob);
      // Create row for a card.
      var cardRow = elem.children() //caption
        .append($('<div>').addClass('row'))
        .children(); // row


      // About User

      // Create user name and issued time.
      var userInfo = $('<p>').addClass('userInfo col-sm-12')
        .appendTo(cardRow);
      var userName = nameTemplate.clone().addClass('userName')
        .text(queryjob.user_name).append('&nbsp;&nbsp;')
        .appendTo(userInfo);
      var userTime = timeTemplate.clone().addClass('userTime')
        .text(formatTodayYesterday(new Date(queryjob.timeissued)))
        .appendTo(userName);

      // Create user status tags.
      var userTags = $('<p>').addClass('userTags col-sm-12')
        .appendTo(cardRow);
      if (!publicMode) {
        if (JSON.parse(queryjob.is_public || false)) {
          userTags.append(
            tagTemplate.clone().text('public')).append('&nbsp;&nbsp;');
        } else {
          userTags.append(
            tagTemplate.clone().text('private')).append('&nbsp;&nbsp;');
        }
      }
      // Email.
      if (JSON.parse(queryjob.notification_email || false)) {
        userTags.append(
          tagTemplate.clone().text('email')).append('&nbsp;&nbsp;');
      }
      // Deadline.
      if (queryjob.deadline) {
        userTags.append(
          tagTemplate.clone().text('deadline ' + formatTodayYesterday(
            new Date(queryjob.deadline)).toLowerCase()).append('&nbsp;&nbsp;'));
      }

      // Create user typed command.
      var userCmd = $('<p>').addClass('userCmd lead col-sm-12')
        .css('font-size', '25px')
        .text(queryjob.typed_cmd)
        .appendTo(cardRow);


      // About Dub-E

      // Create dube name and last update time.
      var dubeInfo = $('<p>').addClass('dubeInfo col-sm-12')
        .css('text-align', 'right')
        .appendTo(cardRow);
      var dubeName = nameTemplate.clone().addClass('dubeName')
        .text('DUB-E').append('&nbsp;&nbsp;')
        .appendTo(dubeInfo);
      var dubeTime = timeTemplate.clone().addClass('dubeTime')
        .text(formatTodayYesterday(new Date(queryjob.timeissued)))
        .appendTo(dubeName);

      var dubeTags = $('<p>').addClass('dubeTags col-sm-12')
        .css('text-align', 'right')
        .appendTo(cardRow);

      // Create response.
      var dubeResp = $('<p>').addClass('dubeResp lead col-sm-12')
        .css('text-align', 'right')
        .css('font-size', '25px')
        .appendTo(cardRow);

      var dubePic = $('<p>').addClass('dubePic col-sm-12')
        .css('text-align', 'right')
        .appendTo(cardRow);


      // About Status

      // Status tag.
      var statusTag = $('<p>').addClass('statusTag col-sm-12')
        .css('margin-bottom', '0')
        .appendTo(cardRow);


      var buttons = $('<p>').addClass('buttons col-sm-12')
        .appendTo(cardRow);

      var fotter = $('<div>').addClass('panel-footer')
        .appendTo(cardRow.parent().parent());
      fotter.append($('<div>').addClass('row'));
      fotter.children().append($('<p>').addClass('dubeInfo col-sm-12')
        .append($('<strong>').text('Mike Chung: '))
        .append($('<span>').text('That was cool.')));

      elem.trigger('updateStatus');
    },

    updateStatus: function(event) {
      var elem = $(this);
      var queryjob = elem.data('queryjob');


      // About Status

      // Status tag.
      var tag = statusTemplate.clone();
      if (queryjob.status === RECEIVED || queryjob.status === SCHEDULED) {
        tag.addClass('alert-info').text('In Queue');
      } else if (queryjob.status === RUNNING) {
        tag.addClass('alert-warning').text('Running');
      } else if (queryjob.status === SUCCEEDED) {
        tag.addClass('alert-success').text('Success :)');
      } else if (queryjob.status === CANCELLED) {
        tag.addClass('alert-danger').text('Cancelled');
      } else if (queryjob.status === FAILED) {
        tag.addClass('alert-danger').text('Failed :(');
      }
      elem.children().find('p.statusTag').children().remove();
      elem.children().find('p.statusTag').append(tag);


      // About Dub-E

      // Response tags.
      var dubeTags = elem.children().find('p.dubeTags').show();
      var dTag = tagTemplate.clone();
      if (queryjob.status === SUCCEEDED) {
        dTag.text(
          queryjob.response_confidence + ' % confidence');
      } else {
        dubeTags.hide();
      }
      dubeTags.children().remove();
      dubeTags.append(dTag);

      // Response text.
      var dubeResp = elem.children().find('p.dubeResp').show();
      if (queryjob.status === RECEIVED || queryjob.status === SCHEDULED) {
        dubeResp.text('Received your question.');
      } else if (queryjob.status === RUNNING) {
        dubeResp.text('Working on your question!');
      } else if (queryjob.status === SUCCEEDED ||
        queryjob.status === CANCELLED || queryjob.status === FAILED) {
        dubeResp.text(queryjob.response_text);
      } else {
        dubeResp.hide();
      }

      var dubePic = elem.children().find('p.dubePic').show();
      var img = $('<img>').addClass('img-thumbnail');
      if (queryjob.status === SUCCEEDED) {
        img
          .attr('alt', queryjob.response_img_path)
          .attr('src', queryjob.response_img_path);
      } else {
        dubePic.hide();
      }
      dubePic.children().remove();
      dubePic.append(img);

      var buttons = elem.children().find('p.buttons').show();
      // var btnCancel = $('<button>').addClass('btn btn-default').text('Cancel');
      var btnHeart = $('<button>').addClass('btn btn-default')
        .append($('<i>').addClass('fa fa-heart'));

      var formComment = $('<form>')
        .append($('<div>').addClass('form-group')
          .append($('<input>').addClass('form-control')
            .css('box-shadow', 'none')
            .attr('type', 'text')
            .attr('placeholder', 'Write a comment...')));

      // var btnCancel = $('<button>').addClass('btn btn-default').text('Cancel');
      // if (queryjob.status === SUCCEEDED) {
      //     buttons.data('btnCancel', btnCancel);
      //     btnCancel.click(function() {
      //       btnCancel.attr('disabled', 'disabled');
      //       if (cancelCallback) {
      //         cancelCallback(queryjob._id);
      //       }
      //     });
      // } else {
      //   buttons.hide();
      // }
      buttons.children().remove();
      // buttons.append(btnHeart);
      buttons.append(formComment);

    }
  };


  // Public Functions

  var reloadCards = function() {
    var postInput = {
      startDate: new Date().toISOString(),
      limit: NUM_INITIAL_CARDS,
      userOnly: !publicMode,
      publicOnly: publicMode
    };
    // Remove contents in container.
    container.find('div.thumbnail.card').remove();
    container.data('cards', {});
    container.trigger('loadCards', [postInput]);
  };

  var loadMoreCards = function() {
    var postInput = {
      startDate: container.data('lastTimeissued'),
      limit: NUM_ADDITIONAL_CARDS,
      userOnly: !publicMode,
      publicOnly: publicMode
    };
    // Remove contents in container.
    container.trigger('loadCards', [postInput]);
  };

  var addNewCard = function(queryjob) {
    var card = cardTemplate.clone()
      .data('container', container);
    $.each(['refresh', 'populate', 'updateStatus'],
      function(index, event) {
        card.on(event, cardEvents[event]);
      });
    card.trigger('populate', [queryjob]);
    container.prepend(card);
    container.data('cards')[queryjob._id] = card;
  };

  var refreshCard = function(queryjobIDStr) {
    container.data('cards')[queryjobIDStr].trigger('refresh');
  };


  // Init Function

  var init = function(options) {
    container = options.container;
    cancelCallback = options.cancelCallback;

    // Container Custom Events

    container.data('lastTimeissued', new Date());

    container.on('loadCards', function(event, postInput) {
      var elem = $(this);

      if (elem.is('.loading')) {
        console.log('Previous loading not finished.');
        return;
      }
      elem.addClass('loading');

      $.post('/queryjobs/getqueryjobs', postInput, function(queryjobs) {
        if (queryjobs.length > 0) {
          elem.data(
            'lastTimeissued', queryjobs[queryjobs.length - 1].timeissued);
          $.each(queryjobs, function(i, queryjob) {
            var card = cardTemplate.clone()
              .data('container', elem);
            $.each(['refresh', 'populate', 'updateStatus'],
              function(index, event) {
                card.on(event, cardEvents[event]);
              });
            card.trigger('populate', [queryjob]);
            elem.append(card);
            elem.data('cards')[queryjob._id] = card;
          });
        } else { // Report empty response from the post request case.
          console.log('Input queryjobs was empty.');
        }
      }, 'JSON').fail(function() {
        // Report /getqueryjob error.
        alert('Error while posting to /queryjobs/getqueryjobs.');
      }).always(function() {
        elem.removeClass('loading');
      });

    });

  };

  return {
    reloadCards: reloadCards,
    loadMoreCards: loadMoreCards,
    addNewCard: addNewCard,
    refreshCard: refreshCard,
    init: init
  };

}());
