angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $auth, $ionicPopup, $window, $log, $state, $http) {

  var validateUser = function(){
    $scope.currentUser = JSON.parse($window.localStorage.getItem('current-user'))
    // console.log("currentUser", $scope.currentUser)
  };


  // Form data for the login modal
  $scope.loginData = {};

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    
    $auth.submitLogin($scope.loginData).then(function(response){
      $window.localStorage.setItem('current-user', JSON.stringify(response));
      validateUser();
      console.log($scope.currentUser)

      $state.go('app.home');

      var valetID = response.id
      var url = "http://localhost:3000/api/v1/valets/" + valetID
      // console.log(url)
      var data = {
        valet: {
          status: 'available'
        }
      }

      $http.patch(url, data).success(function(change_status){
        // console.log(change_status)
      }).error(function(change_status){
        console.log(change_status)
      })
      
      // console.log(response)
    }).catch(function(response){
      // console.log(response)
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
      validateUser();
 
      $state.go('app.home');
      // console.log(response);

    }).catch(function(response){
      // console.log(response)
    })
  }

  $scope.logout = function(){
    $window.localStorage.setItem('current-user', null)
    validateUser();

  };


})

.controller('ProfileCtrl', function($scope, $http){

  var valetID = $scope.currentUser.id
  console.log(valetID)
  var url = "http://localhost:3000/api/v1/valets/" + valetID
  
  $http.get(url).success(function(response){
    console.log (response)
    $scope.valetInfo = response
  }).error(function(response){
    console.log(response)
  })

})

.controller('HomeCtrl', function($scope, $http){
  
})