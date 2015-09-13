// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
var app = angular.module('starter', ['ionic', 'starter.controllers', 'ng-token-auth', 'uiGmapgoogle-maps', 'nemLogging'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, $authProvider) {
  $stateProvider

  .state('app', { //APP MENU
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.landing', {
    url: '/landing',
    views: {
      'menuContent': {
        templateUrl: 'templates/landing.html'
      }
    }
  })

  .state('app.signup', {
    url: '/signup',
    views: {
      'menuContent': {
        templateUrl: 'templates/signup.html'
      }
    }
  })

  .state('app.login', {
    url: '/login',
    views: {
      'menuContent': {
        templateUrl: 'templates/login.html'
      }
    }
  })

  .state('app.profile', {
      url: '/profile',
      views: {
        'menuContent': {
          templateUrl: 'templates/menu/profile.html',
          controller: 'ProfileCtrl'
        }
      }
  })

  .state('app.home', {
    url: '/home',
    views: {
      'menuContent': {
        templateUrl: 'templates/menu/home.html',
        controller: 'HomeCtrl'
      }
    }
  })

  .state('app.pickup', { 
    url: '/pickup',
    views: {
      'menuContent': {
        templateUrl: 'templates/onroute/pickup_page.html',
        controller: 'OnRoutePickUpCtrl'
      }
    }
  })

    .state('app.support', {
      url: '/support',
      views: {
        'menuContent': {
          templateUrl: 'templates/menu/support.html'
        }
      }
  });

  // Valet response to pickup

  // Valet response to dropoff
  // .state('app.dropoff', { 
  //   url: '/dropoff',
  //   views: {
  //     'menuContent': {
  //       templateUrl: 'templates/notification/dropoff_page.html'
  //     }
  //   }
  // });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/landing');

  $authProvider.configure({
    apiUrl: 'http://localhost:3000' ,
      proxyIf:               function() { window.isOldIE() },
      signOutUrl:            '/valets/sign_out',
      emailSignInPath:       '/valets/sign_in',
      emailRegistrationPath: '/valets',
      accountUpdatePath:     '/valets',
      accountDeletePath:     '/valets',
      passwordResetPath:     '/valets/password',
      passwordUpdatePath:    '/valets/password',
      tokenValidationPath:   '/valets/validate_token'   
  });
});
