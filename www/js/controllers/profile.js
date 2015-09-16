app.controller('ProfileCtrl', function($scope, $http){

  $scope.validateUser();
  var valetID = $scope.currentUser.id;
  var url = $scope.rootURL + "api/v1/valets/" + valetID;

  $http.get(url).success(function(response){

    $scope.valetInfo = response;
  }).error(function(response){

  })

})