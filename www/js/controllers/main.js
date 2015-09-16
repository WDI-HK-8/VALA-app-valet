app.controller('AppCtrl', function($scope, $ionicModal, $timeout, $auth, $ionicPopup, $window, $log, $state, $http, $rootScope) {

  $scope.rootURL = "http://vala-api.herokuapp.com/";

  $scope.validateUser = function(){
    $scope.currentUser = JSON.parse($window.localStorage.getItem('current-user'))
  };

  // Form data for the login modal
  $scope.loginData = {};

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {

    $auth.submitLogin($scope.loginData).then(function(response){
      $window.localStorage.setItem('current-user', JSON.stringify(response));
      $scope.validateUser();

      $state.go('app.home');

      var valetID = response.id;
      var url = $scope.rootURL + "api/v1/valets/" + valetID;

      var data = {
        valet: {
          status: 'available'
        }
      };

      $http.patch(url, data).success(function(change_status){

      }).error(function(change_status){
        console.log(change_status);
      })

    }).catch(function(response){

      $ionicPopup.alert({
        title: 'Wrong password',
        template: 'Try again'
      })
    })
  };

  //sign up
  $scope.registrationForm = {};

  $scope.doSignup = function(){
    $auth.submitRegistration($scope.registrationForm).then(function(response){
      $window.localStorage.setItem('current-user', JSON.stringify(response.data.data));
      $scope.validateUser();
      console.log($scope.registrationForm)

      $state.go('app.home');

    }).catch(function(response){
    })
  };

  $scope.logout = function(){
    $window.localStorage.setItem('current-user', null);
    $scope.validateUser();
  };
})
