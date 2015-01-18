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


    //==================================================================
    // Globals
    //==================================================================

    $scope.RECEIVED = 0;
    $scope.SCHEDULED = 1;
    $scope.RUNNING = 2;
    $scope.SUCCEEDED = 3;
    $scope.CANCELED = 4;
    $scope.FAILED = 5;

    var isQueryJobFinished = function(status) {
      return status > $scope.RUNNING;
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
      console.log(d - 1000 * 60 * 10 * 1 * 1);
      console.log(c);
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
            console.log('data[i].status');
            console.log(data[i].status);
            if (data[i].status === $scope.RECEIVED ||
              data[i].status === $scope.SCHEDULED ||
              data[i].status === $scope.RUNNING) {
              numUnansweredJobs += 1;
            }
          }
          console.log('numUnansweredJobs');
          console.log(numUnansweredJobs);
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
    var processQueryJob = function(i, queryjob) {
      queryjob.isFinished = isQueryJobFinished(queryjob.status);
      queryjob.audienceDesc = (queryjob.is_public) ?
        'Shared with CSE' : 'Only Me';
      queryjob.notificationDesc = (queryjob.notification_email) ?
        'Email' : 'Feed Only';
      //- TODO: make below depends on "status"
      queryjob.robottimestamp = queryjob.timeissued;
    };
    $http.get('queryjobs/list/all/' + new Date().getTime() + '/10')
      .success(function(data) {
        $scope.queryjobs = data;
        jQuery.each($scope.queryjobs, loadComments);
        jQuery.each($scope.queryjobs, loadHearts);
        jQuery.each($scope.queryjobs, processQueryJob);
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


    // Comments control.
    $scope.commentForm = {
      timecommented: null,
      comment: '',
      qid: null,
    };

    $scope.submitComment = function(qid) {
      // input validation
      if ($scope.commentForm.typed_cmd === '') {
        return;
      }
      // setting timestamps
      $scope.commentForm.timecommented = new Date();
      $scope.commentForm.qid = qid;

      $http.post('/comments', $scope.commentForm)
        .success(function(data) {
          $scope.queryjobs.forEach(function(queryjob) {
            if (queryjob._id === qid) {
              queryjob.comments.push(data[0]);
            }
          });
          $scope.commentForm.text = '';
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
