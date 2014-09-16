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

  // Variables

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

  // DOM templates for a card.
  var cardTemplate = $('<div>').addClass('thumbnail').append(
    $('<div>').addClass('caption'));
  var nameTemplate = $('<span>').addClass('name-text');
  var timeTemplate = $('<span>').addClass('time-text');
  var tagTemplate = $('<button>').addClass('btn btn-xs')
    .css('opacity', 1).attr('disabled', 'disabled');
  var statusTemplate = $('<button>').addClass('btn btn-xs')
    .css('opacity', 1).attr('disabled', 'disabled');

  // Selectors.
  var container = $('#container');
  var cards = {};
  var lastTimeissued = new Date();
  var callCancelQueryJob = null;


  // Single Card Operations

  var updateStatus = function(card, queryjob) {
    var statusTag = $('<p>').addClass('col-xs-2')
      .css('text-align', 'right');
    if (queryjob.status === RECEIVED || queryjob.status === SCHEDULED) {
      statusTag.append(
        statusTemplate.clone().addClass('btn-info').text('in queue'));
    } else if (queryjob.status === RUNNING) {
      statusTag.append(
        statusTemplate.clone().addClass('btn-warning').text('running'));
    } else if (queryjob.status === SUCCEEDED) {
      statusTag.append(
        statusTemplate.clone().addClass('btn-success').text('success'));
    } else if (queryjob.status === CANCELLED) {
      statusTag.append(
        statusTemplate.clone().addClass('btn-danger').text('cancelled'));
    } else if (queryjob.status === FAILED) {
      statusTag.append(
        statusTemplate.clone().addClass('btn-danger').text('failed'));
    }
    card.data('queryjob', queryjob);
    card.data('statusTag').html(statusTag.html());
  };

  var updateDUBEInfo = function(card, queryjob) {
    var dubeInfo = $('<p>').addClass('col-sm-12').css('text-align', 'right');
    var dubeName = nameTemplate.clone().text('DUB-E').append('&nbsp;&nbsp;');
    var dubeTime = timeTemplate.clone();

    if (queryjob.status === RECEIVED || queryjob.status === SCHEDULED) {
      dubeTime
        .text(formatTodayYesterday(new Date(queryjob.timeissued)));
    } else if (queryjob.status === RUNNING) {
      dubeTime
        .text(formatTodayYesterday(new Date(queryjob.timestarted)));
    } else if (queryjob.status === SUCCEEDED ||
        queryjob.status === CANCELLED || queryjob.status === FAILED) {
      dubeTime
        .text(formatTodayYesterday(new Date(queryjob.timecompleted)));
    }

    dubeInfo.append(dubeName.append(dubeTime));

    card.data('queryjob', queryjob);
    card.data('dubeInfo').html(dubeInfo.html());
  };

  var updateDUBETags = function(card, queryjob) {
    card.data('dubeTags').children().remove();
    if (queryjob.status === SUCCEEDED) {
      card.data('dubeTags').show()
        .append(tagTemplate.clone().text(
          queryjob.response_confidence + ' % confidence'));
    } else {
      card.data('dubeTags').hide();
    }
  };

  var updateDUBEResp = function(card, queryjob) {
    var dubeResp = $('<p>').addClass('col-sm-12').css('text-align', 'right');

    if (queryjob.status === RECEIVED || queryjob.status === SCHEDULED) {
      dubeResp
        .text('Received your question.');
    } else if (queryjob.status === RUNNING) {
      dubeResp
        .text('Working on your question!');
    } else if (queryjob.status === SUCCEEDED ||
        queryjob.status === CANCELLED || queryjob.status === FAILED) {
      dubeResp
        .text(queryjob.response_text);
    }

    card.data('queryjob', queryjob);
    card.data('dubeResp').html(dubeResp.html());
  };

  var updateDUBEPic = function(card, queryjob) {
    card.data('dubePic').children().remove();
    if (queryjob.status === SUCCEEDED) {
      var img = $('<img src="' + queryjob.response_img_path + '" class="img-thumbnail" alt="Result">').addClass('result-img-sm');
      // var img = $('<img class="img-thumbnail" alt="Result">').addClass('result-img-sm');
      img.click(function(event) {
        if ($(this).is('.result-img-lg')) {
          $(this).removeClass('result-img-lg');
          $(this).addClass('result-img-sm');
        } else {
          $(this).removeClass('result-img-sm');
          $(this).addClass('result-img-lg');
        }
      });
      card.data('dubePic').show()
        .append(img);
    } else {
      card.data('dubePic').hide();
    }
  };

  var updateButtons = function(card, queryjob) {
    var buttons = card.data('buttons');
    if (queryjob.status === RUNNING && !buttons.data('btnCancel')) {
      var btnCancel = $('<button>').addClass('btn btn-default').text('Cancel')
        .appendTo(buttons);
      buttons.show();
      buttons.data('btnCancel', btnCancel);
      btnCancel.click(function() {
        btnCancel.attr('disabled', 'disabled');
        cancelCard(queryjob._id);
      });
    } else if (queryjob.status === SUCCEEDED || queryjob.status === FAILED) {
      if (!buttons.data('inputComment') && !queryjob.comment) {
        var inputComment = $('<div>').addClass('form-inline')
          .append(
            $('<div>').addClass('form-group')
              .append($('<input>').addClass('form-control').attr('id', 'inputComment')
                .css('width', '400px')
                .attr('placeholder', 'Please leave your comment here.')
                .attr('type', 'text')))
          .append('&nbsp;&nbsp;')
          .append(
            $('<button>').addClass('btn btn-default').attr('id', 'btnComment')
              .attr('type', 'submit')
              .text('Submit'))
          .appendTo(buttons);
        buttons.show();
        buttons.data(inputComment, 'inputComment');
        buttons.children().find('#btnComment').on('click', function() {
          var data = {
            queryjobID: queryjob._id,
            comment: $('#inputComment').val()
          };
          $.post('/queryjobs/updatequeryjob', data, function(result) {
            console.log(result);
            refreshCard(queryjob._id);
          });
        });
      }
    }
    if (queryjob.status !== RUNNING && queryjob.status !== SUCCEEDED &&
        queryjob.status !== FAILED) {
      buttons.hide();
      if (buttons.data('btnCancel')) {
        buttons.data('btnCancel').remove();
        buttons.removeData('btnCancel');
      }
      if (buttons.data('inputComment')) {
        buttons.data('inputComment').remove();
        buttons.removeData('inputComment');
      }
    }
  };

  var createCard = function(queryjob) {
    var card = cardTemplate.clone();
    card.data('queryjob', queryjob);

    var cardRow = card.children() //caption
      .append($('<div>').addClass('row'))
      .children(); // row

    // Create user name and issued time.
    var userName = nameTemplate.clone()
      .text(queryjob.user_name).append('&nbsp;&nbsp;');
    var userTime = timeTemplate.clone()
      .text(formatTodayYesterday(new Date(queryjob.timeissued)));
    var userInfo = $('<p>').addClass('col-xs-10').css('text-align', 'left')
      .append(userName.append(userTime))
      .appendTo(cardRow);

    // Status tag.
    var statusTag = $('<p>').addClass('col-xs-2').css('text-align', 'right')
      .appendTo(cardRow);
    card.data('statusTag', statusTag);
    updateStatus(card, queryjob);

    // Create user status tags.
    var userTags = $('<p>').addClass('col-sm-12').css('text-align', 'left')
      .appendTo(cardRow);
    // Public.
    if (JSON.parse(queryjob.is_public || false)) {
      userTags.append(
        tagTemplate.clone().text('public')).append('&nbsp;&nbsp;');
    } else {
      userTags.append(
        tagTemplate.clone().text('private')).append('&nbsp;&nbsp;');
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

    // Create typed command.
    cardRow.append($('<p>').addClass('col-sm-12').css(  'text-align', 'left')
      .text(queryjob.typed_cmd));


    // Create dube name and update time.
    var dubeInfo = $('<p>').addClass('col-sm-12').css('text-align', 'right')
      .appendTo(cardRow);
    card.data('dubeInfo', dubeInfo);
    updateDUBEInfo(card, queryjob);

    var dubeTags = $('<p>').addClass('col-sm-12').css('text-align', 'right')
      .appendTo(cardRow).hide();
    card.data('dubeTags', dubeTags);
    updateDUBETags(card, queryjob);

    // Create response.
    var dubeResp = $('<p>').addClass('col-sm-12').css('text-align', 'right')
      .appendTo(cardRow);
    card.data('dubeResp', dubeResp);
    updateDUBEResp(card, queryjob);

    var dubePic = $('<p>').addClass('col-sm-12').css('text-align', 'right')
      .appendTo(cardRow);
    card.data('dubePic', dubePic);
    updateDUBEPic(card, queryjob);

    var buttons = $('<p>').addClass('col-sm-12').css('text-align', 'left')
      .appendTo(cardRow).hide();
    card.data('buttons', buttons);
    updateButtons(card, queryjob);

    if (queryjob.status === CANCELLED) {
      card.css('opacity', 0.5);
    }

    return card;
  };

  var cancelCard = function(queryjobIDStr) {
    callCancelQueryJob(queryjobIDStr, function() {
      // container.data('cards')[queryjobIDStr].hide();
      // delete container.data('cards')[queryjobIDStr];
      console.log('refreshing');
      refreshCard(queryjobIDStr);
    });
  };

  var refreshCard = function(queryjobIDStr) {
    reloadCards();
    // var data = {
    //   queryjobID: queryjobIDStr,
    //   limit: 1
    // };
    // $.post('/queryjobs/getqueryjobs', data, function(queryjobs) {
    //   if (queryjobs.length !== 1) {
    //     alert('Error while posting to /queryjobs/getqueryjobs.');
    //   } else {

    //     // var newCard = createCard(queryjobs[0]);
    //     // container.data('cards')[queryjobIDStr].html(newCard.html());

    //     var queryjob = queryjobs[0];
    //     var newCard = createCard(queryjob);
    //     newCard.data('container', container);
    //     container.data('cards')[queryjobIDStr].replaceWith(newCard);

    //     // updateStatus(container.data('cards')[queryjobIDStr], queryjob);
    //     // updateDUBEInfo(container.data('cards')[queryjobIDStr], queryjob);
    //     // updateDUBEResp(container.data('cards')[queryjobIDStr], queryjob);
    //     // updateButtons(container.data('cards')[queryjobIDStr], queryjob);
    //     // if (queryjob.status === CANCELLED) {
    //     //   container.data('cards')[queryjobIDStr].css('opacity', 0.5);
    //     // }

    //     // container.data('cards')[queryjobIDStr].css('opacity', 0);
    //     // container.data('cards')[queryjobIDStr].animate({
    //     //   opacity: 1
    //     // }, 300);

    //   }
    // }, 'JSON').fail(function() {
    //   alert('Error while posting to /queryjobs/getqueryjobs.');
    // });
  };


  // Multiple Cards Operations

  var attachCard = function(card, prepend) {
    if (prepend) {
      card.prependTo(container);
    } else {
      card.appendTo(container);
    }
    container.data('cards')[card.data('queryjob')._id] = card;
    card.data('container', container);
  };

  var loadCards = function(data, callback) {
    $.post('/queryjobs/getqueryjobs', data, function(queryjobs) {
      callback(queryjobs);
    }, 'JSON').fail(function() {
      alert('Error while posting to /queryjobs/getqueryjobs.');
    }).always(function() {
      container.removeClass('loading');
    });
  };

  var createCardsNAppend = function(queryjobs) {
    if (queryjobs.length > 0) {
      lastTimeissued = queryjobs[queryjobs.length - 1].timeissued;
      $.each(queryjobs, function(i, queryjob) {
        attachCard(createCard(queryjob));
        // if (queryjob.status === CANCELLED) {
        //   container.data('cards')[queryjob].hide();
        // }
      });
    } else {
      console.log('Input queryjobs was empty.');
    }
  };

  var reloadCards = function() {
    // Condition check.
    if (container.is('.loading')) {
      console.log('Previous operation not finished.');
      return;
    }
    // Set container state.
    container.addClass('loading');

    // Remove contents in container.
    container.find('div.thumbnail').remove();
    container.data('cards', {});

    var data = {
      startDate: new Date().toISOString(),
      limit: NUM_INITIAL_CARDS,
      userOnly: false,
      publicOnly: false
    };
    loadCards(data, createCardsNAppend);
  };

  var loadMoreCards = function() {
    // Condition check.
    if (container.is('.loading')) {
      console.log('Previous operation not finished.');
      return;
    }
    // Set container state.
    container.addClass('loading');

    var data = {
      startDate: lastTimeissued,
      limit: NUM_ADDITIONAL_CARDS,
      userOnly: false,
      publicOnly: false
    };
    loadCards(data, createCardsNAppend);
  };

  var addQueryJobToCard = function(queryjob) {
    // Condition check.
    if (container.is('loading')) {
      console.log('Previous operation not finished.');
      return;
    }
    // Set container state.
    container.addClass('loading');

    // Animate it.
    var card = createCard(queryjob).css('opacity', 0);
    attachCard(card, true);
    card.animate({
      opacity: 1,
    }, 300, function() {
      container.removeClass('loading');
    });
  };

  var init = function(options) {
    callCancelQueryJob = options.callCancelQueryJob;

    reloadCards();
  };

  return {
    refreshCard: refreshCard,

    loadMoreCards: loadMoreCards,
    addQueryJobToCard: addQueryJobToCard,

    init: init
  };

}());
