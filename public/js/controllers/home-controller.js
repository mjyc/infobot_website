'use strict';

var homeControllers = angular.module('askdubeApp');

homeControllers.controller('ModalInstanceCtrl',
  function($scope, $modalInstance, msg) {

    $scope.errorModalMsg = msg;

    $scope.ok = function() {
      $modalInstance.close();
    };
  });

homeControllers.controller('HomeController', ['$scope', '$http', '$modal',
  function($scope, $http, $modal) {

    //
    $scope.afterhoursMode = (new Date().getHours() < 9 ||
      new Date().getHours() > 16) && !dev;

    // ROS.
    $scope.ros = new ROSLIB.Ros({
      url: rosUrl  // rosUrl defined in index.jade
    });
    $scope.ros.connected = false;
    $scope.ros.on('connection', function() {
      $scope.ros.connected = true;
      reloadQueryjobs();  // NOTE: heck to make it work in firefox.
      console.log('Connected to websocket server.');
    });
    $scope.ros.on('error', function(error) {
      $scope.ros.connected = false;
      console.log('Error connecting to websocket server: ', error);
    });
    $scope.ros.on('close', function() {
      $scope.ros.connected = false;
      console.log('Connection to websocket server closed.');
    });

    // Util.
    var reloadQueryjob = function(qidStr) {
      $http.get('queryjobs/' + qidStr).success(function(data) {
        $scope.queryjobs.forEach(function(queryjob, i) {
          if (String(queryjob._id) === qidStr) {
            $scope.queryjobs[i] = convertQueryjob(data);
          }
        });
      });
    };

    // For updating current questions.
    var listener = new ROSLIB.Topic({
      ros: $scope.ros,
      name: '/queryjob',
      messageType: 'sara_uw_website/QueryJob'
    });
    listener.subscribe(function(msg) {
      reloadQueryjob(msg.id);
    });

    // For cancel.
    $scope.cancelQueryjob = function(queryjob) {
      var request = new ROSLIB.ServiceRequest({
        id: queryjob._id
      });
      var addTwoIntsClient = new ROSLIB.Service({
        ros : $scope.ros,
        name : '/cancel_queryjob',
        serviceType : 'sara_uw_website/CancelQueryJob'
      });
      addTwoIntsClient.callService(request, function(result) {
        if (result.success) {
          reloadQueryjob(String(queryjob._id));
        }
      });
    };

    // Result image display.
    $scope.toggleImg = function(queryjob) {
      if (queryjob.resultImgClass === 'result-img-sm') {
        queryjob.resultImgClass = 'result-img-lg';
      } else if (queryjob.resultImgClass === 'result-img-lg') {
        queryjob.resultImgClass = 'result-img-sm';
      }
    };

    $scope.mode = 'cse';
    $scope.setHome = function() {
      $scope.mode = 'userall';
      reloadQueryjobs();
    };
    $scope.setWall = function() {
      $scope.mode = 'cse';
      reloadQueryjobs();
    };

    //==================================================================
    // Constants
    //==================================================================

    // IMPORTANT: make sure to sync with msg/QueryJob.js file!
    var RECEIVED = 0;
    var SCHEDULED = 1;
    var RUNNING = 2;
    var SUCCEEDED = 3;
    var CANCELED = 4;
    var FAILED = 5;


    //==================================================================
    // Functions
    //==================================================================

    // Convert queryjob to template friendly format.
    var convertQueryjob = function(queryjob) {
      var statusToStr = [
        'In Queue', // RECEIVED
        'In Queue', // SCHEDULED
        'Running', // RUNNING
        'Success :)', // SUCCEEDED
        'Canceled', // CANCELED
        'Failed :(' // FAILED
      ];
      var statusToClass = [
        'alert alert-info', // RECEIVED
        'alert alert-info', // SCHEDULED
        'alert alert-warning', // RUNNING
        'alert alert-success :)', // SUCCEEDED
        'alert alert-danger', // CANCELED
        'alert alert-danger :(' // FAILED
      ];
      var statusToIsFinished = [
        false, // RECEIVED
        false, // SCHEDULED
        false, // RUNNING
        true, // SUCCEEDED
        true, // CANCELED
        true // FAILED
      ];
      var statusToTimestamp = [
        queryjob.timeissued, // RECEIVED
        queryjob.timeissued, // SCHEDULED
        queryjob.timestarted, // RUNNING
        queryjob.timecompleted, // SUCCEEDED
        queryjob.timecompleted, // CANCELED
        queryjob.timecompleted // FAILED
      ];
      var statusToText = [
        'Will work on your question as soon as possible...', // RECEIVED
        'Will work on your question as soon as possible...', // SCHEDULED
        'Working on your question!', // RUNNING
        queryjob.result ? queryjob.result.text : '', // SUCCEEDED
        queryjob.result ? queryjob.result.text : '', // CANCELED
        queryjob.result ? queryjob.result.text : '' // FAILED
      ];

      return {
        _id: queryjob._id,
        user: {
          name: queryjob.user.name,
          timestamp: queryjob.timeissued,
          text: queryjob.typed_cmd
        },
        audience: {
          desc: queryjob.is_public ? 'Shared with CSE' : 'Only Me',
          icon: queryjob.is_public ? 'fa fa-users' : 'fa fa-lock'
        },
        notification: {
          desc: queryjob.notification_email ? 'Email' : 'Feed Only',
          icon: queryjob.notification_email ?
            'fa fa-envelope' : 'fa fa-newspaper-o'
        },
        deadline: queryjob.deadline,
        status: {
          desc: statusToStr[queryjob.status * 1],
          class: statusToClass[queryjob.status * 1],
          isFinished: statusToIsFinished[queryjob.status * 1],
          isSucceeded: (queryjob.status === SUCCEEDED),
          isCanceled: (queryjob.status === CANCELED)
        },
        robot: {
          name: 'DUB-E',
          timestamp: statusToTimestamp[queryjob.status * 1],
          text: statusToText[queryjob.status * 1]
        },
        result: queryjob.result,
        resultImgClass: 'result-img-sm',
        comments: [],
        commentForm: {
          timecommented: null,
          text: '',
          qid: queryjob._id
        },
        hearts: [],
        heartClass: ''
      };
    };

    // For modal.
    $scope.openErrorModal = function(msg) {
      var modalInstance = $modal.open({
        templateUrl: 'homeErrorModal.html',
        controller: 'ModalInstanceCtrl',
        resolve: {
          msg: function() {
            return msg;
          }
        }
      });
    };


    //==================================================================
    // Menubar
    //==================================================================

    $http.get('users/current').success(function(data) {
      $scope.user = data;
    });

    $scope.userMenuItems = [{
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
      $http.get('/queryjobs/list/' + $scope.mode + '/' + new Date().getTime() + '/0')
        .success(function(data) {
          var numUnansweredJobs = 0;
          for (var i = data.length - 1; i >= 0; i--) {
            if (data[i].status === RECEIVED || data[i].status === SCHEDULED ||
              data[i].status === RUNNING) {
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
                var json = convertQueryjob(data[0]);
                $scope.queryjobs.unshift(json);
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
    var loadComments = function(queryjob) {
      $http.get('comments/list/' + queryjob._id).success(function(data) {
        queryjob.comments = data;
      });
    };
    var loadHearts = function(queryjob) {
      $http.get('hearts/list/' + queryjob._id).success(function(data) {
        queryjob.hearts = data;
        queryjob.heart = data.filter(function(heart) {
          return $scope.user._id === heart.user.id;
        })[0];
        queryjob.heartClass = queryjob.heart ? 'active color-orange' : '';
      });
    };
    var reloadQueryjobs = function() {
      $http.get('queryjobs/list/' + $scope.mode + '/' + new Date().getTime() + '/20')
        .success(function(data) {
          $scope.queryjobs = data;
          $scope.queryjobs.forEach(loadComments);
          $scope.queryjobs.forEach(loadHearts);
          $scope.queryjobs.forEach(function(v, i) {
            $scope.queryjobs[i] = convertQueryjob(v);
          });
        });
    };
    reloadQueryjobs();

    // Infinite scroll setup.
    $scope.loadBusy = false;
    $scope.loadMore = function() {
      var qjs = $scope.queryjobs;
      if (qjs && qjs.length > 1) {
        $scope.loadAfter = new Date(qjs[qjs.length - 1].user.timestamp).getTime();
        $scope.loadBusy = true;
        $http.get('/queryjobs/list/' + $scope.mode + '/' + $scope.loadAfter + '/10')
          .success(function(data) {
            data.forEach(function(v) {
              $scope.queryjobs.push(v);
            });
            $scope.loadBusy = false;
          })
          .error(function(data) {
            $scope.openErrorModal('Oops, something went wrong. Please try ' +
              'refreshing the page.');
          });
      }
    };

    // Comments setup.
    $scope.submitComment = function(queryjob) {
      // input validation
      if (queryjob.commentForm.text === '') {
        return;
      }
      // setting timestamps
      queryjob.commentForm.timecommented = new Date();

      $http.post('/comments', queryjob.commentForm)
        .success(function(data) {
          queryjob.comments.push(data[0]);
          queryjob.commentForm.text = '';
        })
        .error(function(data) {
          $scope.openErrorModal('Oops, something went wrong. Please try ' +
            'refreshing the page.');
        });
    };

    // Hearts setup.
    $scope.toggleHeart = function(queryjob) {
      if (queryjob.heart) {
        $http.delete('/hearts/' + queryjob.heart._id)
          .success(function(data) {
            loadHearts(queryjob);
          });
      } else {
        $http.post('/hearts', {
          qid: queryjob._id
        }).success(function(data) {
          loadHearts(queryjob);
        });
      }
    };

  }
]);
