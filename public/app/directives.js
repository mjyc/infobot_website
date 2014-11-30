'use strict';

angular.module('dubeApp').directive('header', function() {
  return {
    restrict: 'A',
    replace: true,
    scope: {user: '='},
    templateUrl: '/app/views/header.html',
    controller: ['$scope', '$filter', function ($scope, $filter) {
    }]
  };
});
