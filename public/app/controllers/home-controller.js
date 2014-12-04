'use strict';

angular.module('askdubeApp').controller('HomeController', ['$scope', '$http',
  function($scope, $http) {
    $http.get('queryjobs/list').success(function(data) {
      $scope.queryjobs = data;
    });
    $http.get('users/current').success(function(data) {
      $scope.user = data;
    });
  }]);
