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

  // Selector variables.
  var container = null; // must be set from the init function.
  var cancelCallback = null;

  // DOM templates.
  var cardBodyTemplate = $('<div>').addClass('panel-body body')
    .css('padding', '15px 15px 0px');
  var cardFooterTemplate = $('<div>').addClass('panel-footer footer')
    .css('padding', '15px 15px 0px');
  var cardTemplate = $('<div>').addClass('panel panel-default')
    .append(cardBodyTemplate.clone())
    .append(cardFooterTemplate.clone());
  var nameTemplate = $('<span>').addClass('name-text');
  var timeTemplate = $('<span>').addClass('time-text');
  var tagTemplate = $('<button>').addClass('btn btn-xs')
    .css('opacity', 1).attr('disabled', 'disabled');
  var statusTemplate = $('<div>').addClass('alert')
    .css('text-align', 'center')
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
          console.log('Error while posting to /queryjobs/getqueryjobs.');
          alert('Oops, something went wrong. Please try refreshing the page.');
        } else {
          var queryjob = queryjobs[0];
          elem.data('queryjob', queryjob);
          elem.trigger('updateStatus');
        }
      }, 'JSON').fail(function() {
        console.log('Error while posting to /queryjobs/getqueryjobs.');
        alert('Oops, something went wrong. Please try refreshing the page.');
      });
    },

    populate: function(event, queryjob) {
      var elem = $(this);
      // Save queryjob data.
      elem.data('queryjob', queryjob);
      // Create row for a card.
      var bodyRow = elem.children('.body') // body
        .append($('<div>').addClass('row'))
        .children(); // row
      var footerRow = elem.children('.footer') // footer
        .append($('<div>').addClass('row'))
        .children(); // row


      // About User

      // Create user name and issued time.
      var userInfo = $('<p>').addClass('userInfo col-xs-9')
        .appendTo(bodyRow);
      var userName = nameTemplate.clone().addClass('userName')
        .text(queryjob.user_name).append('&nbsp;&nbsp;')
        .appendTo(userInfo);
      var userTime = timeTemplate.clone().addClass('userTime')
        .text(formatTodayYesterday(new Date(queryjob.timeissued)))
        .appendTo(userName);

      // (Not about user) Cancel button on top-left
      var upperLeftButtons = $('<p>')
        .css('text-align', 'right')
        .addClass('upperLeftButtons col-xs-3')
        .appendTo(bodyRow);

      // Create user status tags.
      var userTags = $('<p>').addClass('userTags col-xs-12')
        .appendTo(bodyRow);
      if (!container.data('publicMode')) {
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
      var userCmd = $('<p>').addClass('userCmd lead col-xs-12')
        .css('font-size', '25px')
        .text(queryjob.typed_cmd)
        .appendTo(bodyRow);


      // About Dub-E

      // Create dube name and last update time.
      var dubeInfo = $('<p>').addClass('dubeInfo col-xs-12')
        .css('text-align', 'right')
        .appendTo(bodyRow);

      var dubeTags = $('<p>').addClass('dubeTags col-xs-12')
        .css('text-align', 'right')
        .appendTo(bodyRow);

      // Create response.
      var dubeResp = $('<p>').addClass('dubeResp lead col-xs-12')
        .css('text-align', 'right')
        .css('font-size', '25px')
        .appendTo(bodyRow);

      var dubePic = $('<p>').addClass('dubePic col-xs-12')
        .css('text-align', 'right')
        .appendTo(bodyRow);


      // About Status

      // Status tag.
      var statusTag = $('<p>').addClass('statusTag col-xs-12')
        .appendTo(bodyRow);


      // Comments
      var commentsHist = $('<div>').addClass('commentsHist col-xs-12')
        .css('font-size', '13px')
        .appendTo(footerRow);

      var commentsInput = $('<p>').addClass('commentsInput col-xs-8')
        .appendTo(footerRow);


      // Buttons

      var lowerRightButtons = $('<p>').addClass('lowerRightButtons col-xs-4')
        .css('text-align', 'right')
        .appendTo(footerRow);

      elem.trigger('updateStatus');
    },

    updateStatus: function(event) {
      var elem = $(this);
      var queryjob = elem.data('queryjob');


      // About Status

      // Status tag.
      var statusTag = elem.children().find('p.statusTag');
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
      statusTag.children().remove();
      statusTag.append(tag);


      // About Dub-E

      // Create dube name and last update time.
      var dubeInfo = elem.children().find('p.dubeInfo').show();
      dubeInfo.children().remove();
      var dubeName = nameTemplate.clone().addClass('dubeName')
        .text('DUB-E').append('&nbsp;&nbsp;')
        .appendTo(dubeInfo);
      var dubeTime = timeTemplate.clone();
      if (queryjob.status === RECEIVED || queryjob.status === SCHEDULED) {
        dubeTime
          .text(formatTodayYesterday(new Date(queryjob.timeissued)))
          .appendTo(dubeName);
      } else if (queryjob.status === RUNNING) {
        dubeTime
          .text(formatTodayYesterday(new Date(queryjob.timestarted)))
          .appendTo(dubeName);
      } else if (queryjob.status === SUCCEEDED) {
        dubeTime
          .text(formatTodayYesterday(new Date(queryjob.timecompleted)))
          .appendTo(dubeName);
      } else if (queryjob.status === CANCELLED) {
        dubeTime
          .text(formatTodayYesterday(new Date(queryjob.timecompleted)))
          .appendTo(dubeName);
      } else if (queryjob.status === FAILED) {
        dubeTime
          .text(formatTodayYesterday(new Date(queryjob.timecompleted)))
          .appendTo(dubeName);
      }

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
      var imga = $('<a>').attr('href','#togglesize');
      var img = $('<img>').addClass('img-thumbnail result-img-sm');
      if (queryjob.status === SUCCEEDED) {
        img
          .attr('alt', queryjob.response_img_path)
          .attr('src', queryjob.response_img_path)
          .click(function(event) {
            if (img.is('.result-img-sm')) {
              img.removeClass('result-img-sm');
              img.addClass('result-img-lg');
            } else {
              img.removeClass('result-img-lg');
              img.addClass('result-img-sm');
            }
          });
      } else {
        dubePic.hide();
      }
      dubePic.children().remove();
      dubePic.append(imga.append(img));


      // Buttons

      var upperLeftButtons = elem.children().find('p.upperLeftButtons');
      var btnCancel = $('<button>').addClass('btn btn-default btn-sm')
        .text('Cancel');
      upperLeftButtons.data('btnCancel', btnCancel);
      if (queryjob.status === RECEIVED || queryjob.status === SCHEDULED ||
          queryjob.status === RUNNING) {
        btnCancel.click(function() {
          btnCancel.attr('disabled', 'disabled');
          if (cancelCallback) {
            cancelCallback(queryjob._id, function(srvResult) {
              elem.trigger('refresh');
            });
          }
        });
      } else {
        btnCancel.attr('disabled', 'disabled');
      }
      upperLeftButtons.children().remove();
      upperLeftButtons.append(btnCancel);

      var lowerRightButtons = elem.children().find('p.lowerRightButtons');
      var heartNNum = $('<span>').text(queryjob.hearts.length);
      var btnHeart = $('<button>').addClass('btn btn-default btn-sm')
        .css('outline', 'none')
        .append($('<span>').text('Thank You DUB-E')
          .append('&nbsp;')
          .append($('<i>').addClass('fa fa-heart').append('&nbsp;'))
          .append(heartNNum));
      lowerRightButtons.data('btnHeart', btnHeart);
      var postInput = {
        queryjobID: queryjob._id,
      };
      $.post('/queryjobs/checkheart', postInput, function(result) {
        var heartOn = JSON.parse(result);
        if (heartOn) {
          btnHeart.addClass('active').css('color', '#f50');
        }

        btnHeart.click(function() {
          if (btnHeart.is('.active')) {

            $.post('/queryjobs/removeheart', postInput, function(result) {
              btnHeart.removeClass('active').css('color', 'black');
              heartNNum.text(result.hearts.length);
            }, 'JSON').fail(function() {
              console.log('Error while posting to /queryjobs/removeheart.');
              alert(
                'Oops, something went wrong. Please try refreshing the page.'
              );
            });
          } else {
            $.post('/queryjobs/addheart', postInput, function(result) {
              btnHeart.addClass('active').css('color', '#f50');
              heartNNum.text(result.hearts.length);
            }, 'JSON').fail(function() {
              console.log('Error while posting to /queryjobs/addheart.');
              alert(
                'Oops, something went wrong. Please try refreshing the page.'
              );
            });
          }

        });
      }, 'JSON').fail(function() {
        console.log('Error while posting to /queryjobs/checkheart.');
        alert('Oops, something went wrong. Please try refreshing the page.');
      });
      lowerRightButtons.children().remove();
      lowerRightButtons.append(btnHeart);


      // Comments
      var commentsHist = elem.children().find('div.commentsHist');
      commentsHist.children().remove();
      $.post('/comments/getcomments', postInput, function(comments) {

        $.each(comments, function(index, comment) {
          var commentLine = $('<p>')
            .appendTo(commentsHist);
          var commentUserName = nameTemplate.clone()
            .text(comment.user_name)
            .append('&nbsp;&nbsp;')
            .appendTo(commentLine);

          var commentContent = $('<span>')
            .text(comment.comment)
            .appendTo(commentLine);

          commentLine.append('<br>');
          var commentUserTime = timeTemplate.clone()
            .text(formatTodayYesterday(new Date(comment.timecommented)))
            .appendTo(commentLine);
        });

      }, 'JSON').fail(function() {
        alert(
          'Oops, something went wrong. Please try refreshing the page.'
        );
      });

      var commentsInput = elem.children().find('p.commentsInput');
      var inputComment = $('<input>').addClass('form-control input-sm')
        .css('width', '350px')
        .css('margin-right', '5px')
        .css('box-shadow', 'none')
        .css('border-color', '#cccccc')
        .attr('type', 'text')
        .attr('placeholder', 'Write a comment...');
      var btnComment = $('<button>')
        .addClass('btn btn-default btn-sm')
        .text('Post');
      var formComment = $('<form>')
        .addClass('form-inline')
        .append(inputComment)
        .append(btnComment);
      btnComment.on('click', function(event) {
        event.preventDefault();

        if (inputComment.val() === '') {
          return;
        }

        var postInput = {
          timecommented: new Date().toISOString(),
          comment: inputComment.val(),
          queryjobID: queryjob._id
        };
        $.post('/comments/addcomment', postInput, function(comments) {
          if (comments.length !== 1) {
            console.log('Error while posting to /comments/addcomment.');
            alert(
              'Oops, something went wrong. Please try refreshing the page.');
          } else {
            elem.trigger('refresh');
          }
        }, 'JSON').fail(function() {
          console.log('Error while posting to /comments/addcomment.');
          alert('Oops, something went wrong. Please try refreshing the page.');
        }).always(function() {
          inputComment.val('');
        });

      });
      commentsInput.children().remove();
      commentsInput.append(formComment);


      // Cancel State Treatment
      if (queryjob.status === CANCELLED) {
        elem.css('opacity', '0.5');
        btnCancel.attr('disabled', 'disabled');
        btnHeart.attr('disabled', 'disabled');
        inputComment.attr('disabled', 'disabled');
        btnComment.attr('disabled', 'disabled');
      }
      if (queryjob.status === RECEIVED || queryjob.status === SCHEDULED ||
          queryjob.status === RUNNING) {
        btnHeart.attr('disabled', 'disabled');
      }
      if (container.data('publicMode')) {
        btnCancel.hide();
      }
    }
  };


  // Public Functions

  var reloadCards = function() {
    var postInput = {
      startDate: new Date().toISOString(),
      limit: NUM_INITIAL_CARDS,
      userOnly: !container.data('publicMode'),
      publicOnly: container.data('publicMode')
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
      userOnly: !container.data('publicMode'),
      publicOnly: container.data('publicMode')
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
    var publicMode = options.publicMode || false;
    container = options.container;
    cancelCallback = options.cancelCallback;

    // Container Custom Events

    container.data('lastTimeissued', new Date());
    container.data('publicMode', publicMode);

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
        console.log('Error while posting to /queryjobs/getqueryjobs.');
        alert('Oops, something went wrong. Please try refreshing the page.');
      }).always(function() {
        elem.removeClass('loading');
      });

    });

  };

  return {
    RECEIVED: RECEIVED,
    SCHEDULED: SCHEDULED,
    RUNNING: RUNNING,
    SUCCEEDED: SUCCEEDED,
    CANCELLED: CANCELLED,
    FAILED: FAILED,

    reloadCards: reloadCards,
    loadMoreCards: loadMoreCards,
    addNewCard: addNewCard,
    refreshCard: refreshCard,
    init: init
  };

}());