var app = angular.module("swish");

app.controller('HomeCtrl', function ($scope,$routeParams,$timeout,$location,Restangular,Globals) {

    $scope.m = {
        reviewType:0,
        reviews:Globals.reviews
    };
    $scope.g = Globals;
    Globals.selectedReview = undefined;



    $scope.testStuff = function(){
        console.log(Globals.selectedUser)
        Globals.checkIt();
    }


    if(_.has($routeParams,'id')){
        Globals.userID = $routeParams.id;
    }
    Globals.loadData();


    $scope.adminPage = function(user){
        $location.path('/admin');
    }


    $scope.setSelected = function(idx){
        $timeout(function(){
            Globals.updateReviews();
        },100);
        Globals.selectedReview = undefined;
        $scope.m.reviewType = idx;
      
    }
    $scope.selectReview = function(reviewID){
        Globals.selectedReview = _.findWhere(Globals.reviewList,{_id:reviewID});
        //console.log(Globals.selectedReview)
    }

    $scope.saveReview = function(){
        Globals.selectedReview.put().then(function(){
            _.each(Globals.selectedReview.questions,function(q){
                q.save = false;
            });
        });
        
    }

    $scope.needsSave = function(question){
        question.save=true;
        //console.log('here',question)
    }

    $scope.downloadCoachee = function(){
        //this is where we will save all the info a coach would need
        var coacheeID = Globals.selectedReview.revieweeID;

        var doc = new jsPDF();
        //doc.setFont("calibri");
        var specialElementHandlers = {
            '#editor': function (element, renderer) {
                return true;
            }
        };

        var count = 0;
        _.each(Globals.reviewList,function(review,idx){
            if(review.revieweeID!=coacheeID || review.type!='project'){return;}

            if(count>0){doc.addPage();}
            var html = "<h2>"+GlobalsetUserName(review.reviewerID)+":"+review.type+":"+review.status+"</h2>";
            _.each(review.questions,function(q){
                html+= "<h3>"+q.question+"</h3>"+q.answer+"<br><br>";
            });
            doc.fromHTML(html, 15, 15, {
                'width': 170,
                'elementHandlers': specialElementHandlers
            });
            count++;


        });
        doc.save('Coach Summary.pdf');
    }



    $scope.updateReview = function(state){
        //first, check to make sure they answered all the questions
        var failedCheck = false;
        if(_.contains(['submitted','completed'],state)){
            _.each(Globals.selectedReview.questions,function(q){
                if(failedCheck){return;}
                if(q.answer.length==0){
                    alert('you need to answer the question: '+q.question);
                    failedCheck = true;
                }
            });
        }

        //make sure it is after the eop meeting 
        if(_.contains(['completed'],state) && Globals.selectedReview.type=='summary'){
            var dateTxt = _.find(Globals.settings.gOptions.dates,function(d){return d[0]=='EOPMeetingDate'});
            var dueDate = new Date(dateTxt[1]);
            if( dueDate.getTime() - (new Date()).getTime() > 0){
                failedCheck = true;
                alert("Please wait until after the EOP meeting to mark this review as complete.");
            }
        }

        if(!failedCheck){
            if(_.contains(['completed'],state) && Globals.selectedReview.type=='summary'){
                var response = confirm("Making the review as complete will lock editing and cause the review to be visible to the reviewee, are you ready to do this?")
                if(!response){
                    failedCheck=true;
                }
            }
        }


        //make sure that all the project reviews have been complted first
        /*
        if(_.contains(['submitted'],state) && Globals.selectedReview.type=='summary'){
            var coachee = Globals.getUser(Globals.selectedReview.revieweeID); 
            _.each(coachee.reviews,function(r){
                if(r.revieweeID==coachee._id && r.type=='project' && r.status!='approved'){
                    failedCheck = true;
                }
            });
            if(failedCheck){
                alert("You can't submit the coach summary until all the project reviews have been submitted");
            }
        }
        */


        if(_.contains(['completed'],state) && Globals.selectedReview.type=='summary'){
            if(Globals.selectedReview.reviewerID != Globals.selectedUser._id){
                failedCheck = true;
                alert("Only the reviewer can mark a review as complete");
            }
        }

        if(failedCheck){return;}


        Globals.selectedReview.status = state;
        var review = Globals.selectedReview;
        //now, we need to send the correct email
        if(state=='submitted'){
            Globals.email(Globals.getUser(review.revieweeID),review,Globals.settings.gOptions.emails[2][1]);
        }else if(state=='approved'){
            Globals.email(Globals.getUser(review.reviewerID),review,Globals.settings.gOptions.emails[4][1]);
            //we need to check to see if that was the last review to be approved, and if there is a coach 
            //summary that is ready to go



            var coachee = Globals.getUser(review.revieweeID) 
            var allApproved = true; 
            var coachSummary = undefined;
            //console.log('here it is')
            //console.log(coachee.reviews)
            _.each(coachee.reviews,function(r){
                if(r.revieweeID==coachee._id && r.type=='project' && r.status!='approved' && r.id != review._id){
                    allApproved = false;
                }else if(r.revieweeID==coachee._id && r.type=='summary'){
                    coachSummary = r;
                }
            });
            //console.log(allApproved,coachSummary)
            if(allApproved && coachSummary!=undefined){
                //ready to write
                //console.log('sending an email')
                 Globals.email(Globals.getUser(coachSummary.reviewerID),coachSummary,Globals.settings.gOptions.emails[5][1]);
            }




        }else if(state=='rejected'){
            Globals.email(Globals.getUser(review.reviewerID),review,Globals.settings.gOptions.emails[3][1]);
        }else if(state=='completed'){
            Globals.email(Globals.getUser(review.revieweeID),review,Globals.settings.gOptions.emails[4][1]);
        }



        Globals.selectedReview.put().then(function(){
             _.each(Globals.selectedReview.questions,function(q){
                q.save = false;
            });

            if(_.contains(['submitted','approved','rejected','completed'],state)){
                Globals.selectedReview = undefined;
            }
            //now update the user so the screen updatees
            Globals.selectedUser.get().then(function(user){
                //console.log('got user',user);
                Globals.selectedUser.reviews = user.reviews;

                Globals.sortReviews(Globals.selectedUser.reviews)
                $timeout(function(){
                    Globals.updateReviews();
                },100);
            });
        });
    }


});