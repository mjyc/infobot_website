'use strict';

var homeControllers = angular.module('askdubeApp');

homeControllers.controller('ModalInstanceCtrl',
  function ($scope, $modalInstance, msg) {

    $scope.errorModalMsg = msg;

    $scope.ok = function () {
      $modalInstance.close();
    };
  });

homeControllers.controller('HomeController', ['$scope', '$http', '$modal',
  function($scope, $http, $modal) {

    //==================================================================
    // Global Constants
    //==================================================================

    // IMPORTANT: make sure to sync with msg/QueryJob.js file!
    var RECEIVED = 0;
    var SCHEDULED = 1;
    var RUNNING = 2;
    var SUCCEEDED = 3;
    var CANCELED = 4;
    var FAILED = 5;

    var statusToStr = [
      'In Queue',    // RECEIVED
      'In Queue',    // SCHEDULED
      'Running',     // RUNNING
      'Success :)',  // SUCCEEDED
      'Canceled',    // CANCELED
      'Failed :('    // FAILED
    ];

    var statusToClass = [
      'alert alert-info',        // RECEIVED
      'alert alert-info',        // SCHEDULED
      'alert alert-warning',     // RUNNING
      'alert alert-success :)',  // SUCCEEDED
      'alert alert-danger',      // CANCELED
      'alert alert-danger :('    // FAILED
    ];

    var isFinished = [
      false,  // RECEIVED
      false,  // SCHEDULED
      false,  // RUNNING
      true,   // SUCCEEDED
      true,   // CANCELED
      true    // FAILED
    ];


    //==================================================================
    // Global Functions
    //==================================================================

    // For Modal.
    $scope.openErrorModal = function (msg) {

      var modalInstance = $modal.open({
        templateUrl: 'homeErrorModal.html',
        controller: 'ModalInstanceCtrl',
        resolve: {
          msg: function () {
            return msg;
          }
        }
      });
    };

    // For Processing QueryJob.

    var processQueryJob = function(queryjob) {
      queryjob.audienceDesc = (queryjob.is_public) ?
        'Shared with CSE' : 'Only Me';
      queryjob.notificationDesc = (queryjob.notification_email) ?
        'Email' : 'Feed Only';
      queryjob.confidenceDesc = 'Confidence';

      queryjob.statusStr = statusToStr[queryjob.status*1];
      queryjob.statusClass = statusToClass[queryjob.status*1];
      queryjob.isFinished = isFinished[queryjob.status*1];
      queryjob.isSuccess = (queryjob.status === SUCCEEDED);

      if (queryjob.status === RECEIVED ||
          queryjob.status === SCHEDULED) {
        queryjob.robotTimestamp = queryjob.timeissued;
        queryjob.robotText = 'Will work on your question as soon as ' +
          'possible...';
      } else if (queryjob.status === RUNNING) {
        queryjob.robotTimestamp = queryjob.timestarted;
        queryjob.robotText = 'Working on your question!';
      } else {
        queryjob.robotTimestamp = queryjob.timecompleted;
        queryjob.robotText = queryjob.result.text;
        queryjob.robotConfidence = false;
      }
    };


    //==================================================================
    // Menubar
    //==================================================================

    $http.get('users/current').success(function(data) {
      $scope.user = data;
    });

    $scope.userMenuItems = [{
      url: '/profile',
      icon: 'fa fa-user',
      name: 'Profile',
    }, {
      url: '/liveparser',
      icon: 'fa fa-keyboard-o',
      name: 'LiveParser',
    }, {
      url: '/signout',
      icon: 'fa fa-sign-out',
      name: 'Sign Out',
    }, ];


    //==================================================================
    // Question Input Interface
    //==================================================================

    // Question Options.
    $scope.questionForm = {
      timeissued: null,
      typed_cmd: '',
      notification_sms: false,
      notification_email: false,
      is_public: true,
      deadline: null,
    };

    var audienceOption = {
      desc: 'Who should see this?',
      items: [{
        icon: 'fa fa-users',
        name: 'CSE',
        desc: 'Anyone with CSE account.',
        field: 'is_public',
        val: true,
      }, {
        icon: 'fa fa-lock',
        name: 'Only Me',
        desc: '',
        field: 'is_public',
        val: false,
      }],
      selected: null
    };

    var notificationOption = {
      desc: 'How do you want to be notified?',
      items: [{
        icon: 'fa fa-envelope',
        name: 'Email',
        desc: '',
        field: 'notification_email',
        val: true,
      }, {
        icon: 'fa fa-newspaper-o',
        name: 'Feed Only',
        desc: '',
        field: 'notification_email',
        val: false,
      }],
      selected: null
    };

    $scope.questionOptions = {
      audience: audienceOption,
      notification: notificationOption
    };

    $scope.setQuestionOption = function(field, item) {
      $scope.questionOptions[field].selected = item;
      $scope.questionForm[item.field] = item.val;
    };

    // set initial values
    $scope.setQuestionOption('audience', audienceOption.items[0]);
    $scope.setQuestionOption('notification', notificationOption.items[0]);


    // Deadline option.
    $scope.questionDeadline = new Date(1970, 0, 1, new Date().getHours() + 1,
      new Date().getMinutes(), 0);


    // Submit question function.
    $scope.submitQuestion = function() {
      // typed_cmd validation
      if ($scope.questionForm.typed_cmd === '') {
        return;
      }

      // copying deadline
      $scope.questionForm.timeissued = new Date();
      $scope.questionForm.deadline = new Date();
      $scope.questionForm.deadline.setSeconds(0, 0);
      $scope.questionForm.deadline.setHours(
        $scope.questionDeadline.getHours());
      $scope.questionForm.deadline.setMinutes(
        $scope.questionDeadline.getMinutes());

      // deadline validation
      var d = $scope.questionForm.deadline.getTime();
      var c = $scope.questionForm.timeissued.getTime();
      if (d - 1000 * 60 * 10 * 1 * 1 < c) {
        $scope.openErrorModal('Deadline is too close! Please give more than' +
          ' 10min for DUB-E to answer your question.');
        return;
      }

      // user queryjob validation
      $http.get('/queryjobs/list/all/' + new Date().getTime() + '/0')
        .success(function(data) {
          var numUnansweredJobs = 0;
          for (var i = data.length - 1; i >= 0; i--) {
            if (data[i].status === $scope.RECEIVED ||
              data[i].status === $scope.SCHEDULED ||
              data[i].status === $scope.RUNNING) {
              numUnansweredJobs += 1;
            }
          }
          if (numUnansweredJobs >= 1) {
            $scope.openErrorModal('Oops, you have an unanswered question. ' +
              'You can only  add new question after the current question is' +
              ' answered.');
            $scope.questionForm.typed_cmd = '';
            return;
          } else {
            // post!
            $http.post('/queryjobs', $scope.questionForm)
              .success(function(data) {
                processQueryJob(data[0]);
                $scope.queryjobs.unshift(data[0]);
                $scope.questionForm.typed_cmd = '';
              })
              .error(function(data) {
                $scope.openErrorModal('Oops, something went wrong. Please ' +
                  'try refreshing the page.');
              });
          }
        });
    };


    //==================================================================
    // QueryJob Wall
    //==================================================================

    // Load data.
    var loadComments = function(i, queryjob) {
      $http.get('comments/list/' + queryjob._id).success(function(data) {
        queryjob.comments = data;
        queryjob.commentForm = {
          timecommented: null,
          text: '',
          qid: null,
        };
      });
    };
    var loadHearts = function(i, queryjob) {
      $http.get('hearts/list/' + queryjob._id).success(function(data) {
        queryjob.hearts = data;
        queryjob.userHeart = queryjob.hearts.filter(function(heart) {
          return $scope.user._id === heart.user.id;
        });
        queryjob.userHeart = queryjob.userHeart[0];
        if (queryjob.userHeart) {
          queryjob.userHeartActive = 'active';
        } else {
          queryjob.userHeartActive = 'btn';
        }
      });
    };
    $http.get('queryjobs/list/all/' + new Date().getTime() + '/10')
      .success(function(data) {
        $scope.queryjobs = data;
        jQuery.each($scope.queryjobs, loadComments);
        jQuery.each($scope.queryjobs, loadHearts);
        jQuery.each($scope.queryjobs,
          function(i, v) { return processQueryJob(v); });
      });

    // Infinite scroll setup.
    $scope.loadBusy = false;
    $scope.loadMore = function() {
      var qjs = $scope.queryjobs;
      if (qjs && qjs.length > 1) {
        $scope.loadAfter = new Date(qjs[qjs.length - 1].timeissued).getTime();
        $scope.loadBusy = true;
        $http.get('/queryjobs/list/userall/' + $scope.loadAfter + '/10')
          .success(function(data) {
            for (var i = 0; i < data.length; i++) {
              $scope.queryjobs.push(data[i]);
            }
            $scope.loadBusy = false;
          })
          .error(function(data) {
            $scope.openErrorModal('Oops, something went wrong. Please try ' +
            'refreshing the page.');
          });
      }
    };


    $scope.submitComment = function(qid) {
      var queryjob = $scope.queryjobs.filter(function(queryjob) {
        return queryjob._id === qid;
      });
      queryjob = queryjob[0];

      // input validation
      if (queryjob.commentForm.text === '') {
        return;
      }
      // setting timestamps
      queryjob.commentForm.timecommented = new Date();
      queryjob.commentForm.qid = qid;

      $http.post('/comments', queryjob.commentForm)
        .success(function(data) {
          $scope.queryjobs.forEach(function(queryjob) {
            if (queryjob._id === qid) {
              queryjob.comments.push(data[0]);
            }
          });
          queryjob.commentForm.text = '';
        })
        .error(function(data) {
          $scope.openErrorModal('Oops, something went wrong. Please try ' +
            'refreshing the page.');
        });
    };


    // Hearts control.
    $scope.toggleHeart = function(queryjob) {
      if (queryjob.userHeart) {
        $http.delete('/hearts/' + queryjob.userHeart._id)
          .success(function(data) {
            loadHearts(0, queryjob);
          });
      } else {
        $http.post('/hearts', {
          qid: queryjob._id
        }).success(function(data) {
          loadHearts(0, queryjob);
        });
      }
    };

  }
]);
