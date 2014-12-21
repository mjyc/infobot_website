'use strict';

var homeControllers = angular.module('askdubeApp');

homeControllers.controller('logout', ['$window', function($window) {
  $window.location.href = '/logout';
}]);

homeControllers.controller('HomeController', ['$scope', '$http',
  function($scope, $http) {

    // Global variables.
    $scope.RECEIVED = 0;
    $scope.SCHEDULED = 1;
    $scope.RUNNING = 2;
    $scope.SUCCEEDED = 3;
    $scope.CANCELLED = 4;
    $scope.FAILED = 5;

    // Get data from the server.
    $http.get('users/current').success(function(data) {
      $scope.user = data;
    });

    $http.get('queryjobs/list/userall/5/0').success(function(data) {
      $scope.queryjobs = data;
    });

    // User Menu

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


    // Question Options.
    $scope.questionForm = {
      timeissued: null,
      typed_cmd: '',
      notification_sms: false,
      notification_email: false,
      is_public: true,
      deadline: null,
    };
    // Button options.
    $scope.questionOptions = {
      audience: [{
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
      notification: [{
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
    };

    $scope.questionOptionsDesc = {
      audience: 'Who should see this?',
      notification: 'How do you want to be notified?',
    };

    $scope.selectedQuestionOptions = {
      audience: $scope.questionOptions.audience[0],
      notification: $scope.questionOptions.notification[0],
    };

    $scope.setQuestionOption = function(field, options) {
      $scope.selectedQuestionOptions[field] = options;
      $scope.questionForm[options.field] = options.val;
    };

    // Deadline option.
    $scope.questionDeadline = new Date(1970, 0, 1, new Date().getHours() + 1,
      new Date().getMinutes(), 0);

    // Submit function.
    // TODO: also check current "status" of the user's last queryjob
    $scope.submitQuestion = function() {
      // input check
      if ($scope.questionForm.typed_cmd === '') {
        return;
      }
      // setting timestamps
      $scope.questionForm.timeissued = new Date();
      $scope.questionForm.deadline = new Date();
      $scope.questionForm.deadline.setSeconds(0, 0);
      $scope.questionForm.deadline.setHours(
        $scope.questionDeadline.getHours());
      $scope.questionForm.deadline.setMinutes(
        $scope.questionDeadline.getMinutes());
      // checking timestamps
      var d = $scope.questionForm.deadline.getTime();
      var c = $scope.questionForm.timeissued.getTime();
      if (d - 1000 * 60 * 10 * 1 * 1 < c) {
        alert('Deadline is too close! Please give more than 10min for DUB-E ' +
          'to answer your question.');
      }

      // check if the user has an unanswered queryjob
      $http.get('/queryjobs/list/userall/0/0')
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
            alert('Oops, you have an unanswered question. You can only ' +
              'add new question after the current question is answered.');
            $scope.questionForm.typed_cmd = '';
            return;
          }
        });

      $http.post('/queryjobs', $scope.questionForm)
        .success(function(data) {
          var newQueryJob = jQuery.extend(true, {}, $scope.questionForm);
          $scope.queryjobs.unshift(newQueryJob);
          $scope.questionForm.typed_cmd = '';
        })
        .error(function(data) {
          alert('Oops, something went wrong. Please try refreshing the page.');
        });
    };

    // Infinite scroll setup.
    $scope.loadBusy = false;
    $scope.loadMore = function() {
      var qjs = $scope.queryjobs;
      if (qjs && qjs.length > 1) {
        $scope.loadAfter = new Date(qjs[qjs.length-1].timeissued).getTime();
        $scope.loadBusy = true;
        $http.get('/queryjobs/list/userall/5/' + $scope.loadAfter)
          .success(function(data) {
            for (var i = 0; i < data.length; i++) {
              $scope.queryjobs.push(data[i]);
            }
            $scope.loadBusy = false;
          })
          .error(function(data) {
            alert('Oops, something went wrong. Please try refreshing the ' +
              'page.');
          });
      }
    };
  }
]);
