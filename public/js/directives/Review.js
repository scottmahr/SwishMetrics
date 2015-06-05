var app = angular.module("EOP");


app.directive('reviewblock',  function(Globals) {
  return {
    restrict: 'A',
    scope: {
        reviewid: "@",
        curid: "@",
        getname: '&',
    },
    replace:true,
    templateUrl: 'html/review.html',
    link: function(scope, ele, attrs) {
        //console.log('CID',scope.reviewid)
        scope.review = {};
        scope.update = function(){
            if(scope.curid==scope.review.revieweeID){
                scope.name = scope.getname({id:scope.review.reviewerID});
            }else if(scope.curid==scope.review.reviewerID){
                scope.name = scope.getname({id:scope.review.revieweeID});
            }else{
                scope.name = scope.getname({id:scope.review.revieweeID});
            }

            var statuses = {'notOpen':'Not Open','pending':'Pending','started':'Started',
              'submitted':'Submitted','approved':'Approved','rejected':'Rejected','completed':'Completed'};
            var types = {'project':'Project Review','summary':"Coach's Summary"};

            var reviewee = Globals.getUser(scope.review.revieweeID)

            var dateTxt = _.find(scope.dates,function(d){return d[0]==scope.review.type+'Due'});
            var dueDate = new Date(dateTxt[1]);
            var due =  dueDate.getTime() - (new Date()).getTime();
            var days = parseInt(due/(1000*60*60*24)+.5);

            scope.dueIn = days+' days';
            scope.type = types[scope.review.type];
            scope.status = statuses[scope.review.status];
            scope.reviewGroup = reviewee.reviewGroup.slice(0,-1);
            //scope.reviewGroup = scope.review.reviewGroup.slice(0,-1);

        }
      

        scope.$on('updateReviews', function (event, data) {
            
            scope.review = _.findWhere(Globals.reviewList,{_id:scope.reviewid});
            //console.log('curid',scope.reviewid)
           // console.log(scope.review)
            scope.dates = data.dates;
            //console.log('got update',data.dates)
            scope.update();
        });
    }


  }
});