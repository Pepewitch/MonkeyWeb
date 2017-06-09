console.log("[START] post.js");
var run=function(app,db){
    var events=require("events");
    var fs=require("fs-extra");
    var moment=require("moment");
    var ObjectID=require('mongodb').ObjectID;
    var path=require("path");

    var configDB=db.collection("config");
    var courseSuggestionDB=db.collection("courseSuggestion");
    var hybridSeatDB=db.collection("hybridSeat");
    // var hybridSheetDB=db.collection("hybridSheet");
    var userDB=db.collection("user");

    var gradeBitToString=function(bit){
        var output="",p=false,s=false;
        for(var i=0;i<6;i++){
            if(bit&(1<<i)){
                if(p==false){
                    p=true;
                    output+="P";
                }
                output+=(i+1);
            }
        }
        for(var i=0;i<6;i++){
            if(bit&(1<<(i+6))){
                if(s==false){
                    s=true;
                    output+="S";
                }
                output+=(i+1);
            }
        }
        if(bit&(1<<12))output+="SAT";
        return output;
    };
    var gradeBitToArray=function(bit){
        var output=[];
        for(var i=0;i<13;i++){
            if(bit&(1<<i)){
                output.push(i+1);
            }
        }
        return output;
    };
    var gradeArrayToBit=function(array){
        var output=0;
        for(var i=0;i<array.length;i++){
            output|=(1<<(array[i]-1));
        }
        return output;
    };
    // var gradeStringToBit=function(grade){
    //     var output=0,p=false,s=false;
    //     if(grade[0]=='S'&&grade[1]=='A')return (1<<12);
    //     if(grade[0]=='P'){
    //         for(var i=1;i<grade.length;i++){
    //             output|=(1<<(grade[i]-'1'));
    //         }
    //     }
    //     if(grade[0]=='S'){
    //         for(var i=1;i<grade.length;i++){
    //             output|=(1<<(grade[i]-'1'+6));
    //         }
    //     }
    //     return output;
    // };
    var getCourseDB=function(callback){
        configDB.findOne({},function(err,config){
            callback(db.collection("CR"+config.year+"Q"+config.quarter));
        });
    };
    var getCourseName=function(courseID,callback){
        getCourseDB(function(courseDB){
            courseDB.findOne({_id:courseID},function(err,result){
                var subject=result.subject;
                var grade=result.grade;
                var level=result.level;
                callback(subject+gradeBitToString(grade)+level);
            });
        });
    };
    /*var pagedata=function(fileName){
        var fs=require("fs-extra");
        var data=fs.readFileSync(path.join(__dirname,"../",fileName+".html")).toString();
        return data.replace(/public\//g,"").replace(/\.html/g,"");
    };
    var addPage=function(pageName){
        app.get("/"+pageName,function(req,res){
            console.log("[PAGE REQUEST] "+pageName+" FROM "+req.ip+moment().format(" @ dddDDMMMYYYY HH:mm:ss"));
            res.send(pagedata(pageName))
        });
    };*/
    var addPage=function(page,url){
        if(url==undefined)url="/"+page;
        app.get(url,function(req,res){
            console.log("[PAGE REQUEST] "+page+" FROM "+req.ip+moment().format(" @ dddDDMMMYYYY HH:mm:ss"));
            res.sendFile(path.join(__dirname,"../",page+".html"));
        });
    };

    // addPage("login","/");
    addPage("login");
    addPage("registrationCourse");
    addPage("registrationHybrid");
	addPage("registrationName");
	addPage("registrationSkill");
    addPage("registrationReceipt");
	addPage("studentProfile");
    addPage("home");
    addPage("home2");
    addPage("adminHome");
    addPage("adminAllcourse");
    addPage("adminCoursedescription");
    addPage("adminAllstudent");
    addPage("adminStudentprofile");
    app.get("/testadmin",function(req,res){
        console.log("[PAGE REQUEST] testadmin FROM "+req.ip+moment().format(" @ dddDDMMMYYYY HH:mm:ss"));
        res.sendFile(path.join(__dirname,"testadmin.html"));
    });
    app.get("/firstConfig",function(req,res){
        console.log("[PAGE REQUEST] firstConfig FROM "+req.ip+moment().format(" @ dddDDMMMYYYY HH:mm:ss"));
        res.sendFile(path.join(__dirname,"firstConfig.html"));
    });

    // All post will return {err} if error occurs

    // User Information
    //OK {userID,password} return {verified}
    app.post("/post/password",function(req,res){
        console.log(req.body);
        console.log("[PAGE REQUEST] post/password FROM "+req.ip+moment().format(" @ dddDDMMMYYYY HH:mm:ss"));
        var userID=parseInt(req.body.userID);
        var password=req.body.password;
        userDB.findOne({_id:userID,password:password},function(err,result){
            if(result==null){
                res.send({verified:false});
            }
            else{
                res.send({verified:true});
            }
        });
    });
    //OK {userID} return {firstname,lastname,nickname,firstnameEn,lastnameEn,nicknameEn}
    app.post("/post/name",function(req,res){
        var userID=parseInt(req.body.userID);
        userDB.findOne({_id:userID},function(err,result){
            if(result==null){
                res.send({err:"The requested ID doesn't exist."});
            }
            else{
                res.send({firstname:result.firstname,lastname:result.lastname,nickname:result.nickname,
                    firstnameEn:result.firstnameEn,lastnameEn:result.lastnameEn,nicknameEn:result.nicknameEn
                });
            }
        });
    });
    //OK {userID} return {position}
    app.post("/post/position",function(req,res){
        var userID=parseInt(req.body.userID);
        userDB.findOne({_id:userID},function(err,result){
            if(result==null){
                res.send({err:"The requested ID doesn't exist."});
            }
            else res.send({position:result.position});
        });
    });
    //OK {userID} return {status}
    app.post("/post/status",function(req,res){
        var userID=parseInt(req.body.userID);
        userDB.findOne({_id:userID},function(err,result){
            if(result==null){
                res.send({err:"The requested ID doesn't exist."});
            }
            else if(result.position=="student")res.send({status:result.student.status});
            else res.send({status:result.tutor.status});
        });
    });


    // Student Information
    //OK {} return {student:[{studentID,firstname,lastname,nickname,grade,registrationState,status,inCourse,inHybrid}]}
    app.post("/post/allStudent",function(req,res){
        var output=[];
        var eventEmitter=new events.EventEmitter();
        userDB.find({position:"student"}).sort({_id:1}).toArray(function(err,result){
            var c=0;
            eventEmitter.on("finish",function(){
                if(c==result.length)res.send({student:output});
                c++;
            });
            for(i=0;i<result.length;i++){
                (function(i){
                    getCourseDB(function(courseDB){
                        courseDB.findOne({student:result[i]._id},function(err,course){
                            hybridSeatDB.findOne({"student.studentID":result[i]._id},function(err,hybrid){
                                output[i]={studentID:result[i]._id,
                                    firstname:result[i].firstname,
                                    lastname:result[i].lastname,
                                    nickname:result[i].nickname,
                                    grade:result[i].student.grade,
                                    registrationState:result[i].student.registrationState,
                                    status:result[i].student.status,
                                    inCourse:course!=null,
                                    inHybrid:hybrid!=null
                                };
                                eventEmitter.emit("finish");
                            });
                        });
                    });
                })(i);
            }
            eventEmitter.emit("finish");
        });
    });
    //OK {studentID} return {user.student,post/name,[courseID],[hybridDay]}
    app.post("/post/studentProfile",function(req,res){
        var studentID=parseInt(req.body.studentID);
        var output={};
        userDB.findOne({_id:studentID},function(err,result){
            if(result==null){
                res.send({err:"The requested ID doesn't exist."});
            }
            else{
                if(result.position=="student"){
                    output=result.student;
                    var request=require("request");

                    request.post("http://localhost/post/name",{form:{userID:studentID}},function(err,response,body){

                        body=JSON.parse(body);
                        output=Object.assign(output,body);
                        output=Object.assign(output,{email:result.email,phone:result.phone});
                        output.courseID=[];
                        output.hybridDay=[];
                        getCourseDB(function(courseDB){
                            courseDB.find({student:studentID}).sort({day:1}).toArray(function(err,course){
                                for(var i=0;i<course.length;i++){
                                    output.courseID.push(course[i]._id);
                                }
                                hybridSeatDB.find({"student.studentID":studentID}).sort({day:1}).toArray(function(err,hybrid){
                                    for(var i=0;i<hybrid.length;i++){
                                        var index=hybrid[i].student.findIndex(function(x){
                                            return x.studentID==studentID;
                                        });
                                        output.hybridDay.push({subject:hybrid[i].student[index].subject,day:hybrid[i].day});//TODO
                                    }
                                    res.send(output);
                                });
                            });
                        });
                    });
                }
                else res.send({err:"The requested ID isn't a student."});
            }
        });
    });
    //OK {studentID} return {registrationState}
    app.post("/post/registrationState",function(req,res){
        var studentID=parseInt(req.body.studentID);
        userDB.findOne({_id:studentID},function(err,result){
            if(result==null){
                res.send({err:"The requested ID doesn't exist."});
            }
            else if(result.position=="student")res.send({registrationState:result.student.registrationState});
            else res.send({err:"The requested ID isn't a student."});
        });
    });
    //OK {studentID,registrationState} return {}
    app.post("/post/changeRegistrationState",function(req,res){
        var studentID=parseInt(req.body.studentID);
        var registrationState=req.body.registrationState;
        userDB.findOne({_id:studentID},function(err,result){
            if(result==null){
                res.send({err:"The requested ID doesn't exist."});
            }
            else if(result.position=="student"){
                userDB.updateOne({_id:studentID},{$set:{"student.registrationState":registrationState}},function(){
                    res.send({});
                });
            }
            else res.send({err:"The requested ID isn't a student."});
        });
    });

    // Student Timetable
    //OK {studentID,[courseID]} return {}
    app.post("/post/addStudentCourse",function(req,res){
        var studentID=parseInt(req.body.studentID);
        var courseID=req.body.courseID;
        var eventEmitter=new events.EventEmitter();
        //TODO var errOutput=[];
        userDB.findOne({_id:studentID},function(err,result){
            if(result==null){
                res.send({err:"The requested student ID doesn't exist."});
            }
            else{
                if(result.position=="student"){
                    var c=0;
                    eventEmitter.on("finish",function(){
                        if(c==courseID.length)res.send({});
                        c++;
                    });
                    getCourseDB(function(courseDB){
                        for(var i=0;i<courseID.length;i++){
                            courseDB.updateOne({_id:courseID[i]},{$addToSet:{student:studentID}},function(){
                                eventEmitter.emit("finish");
                            });
                        }
                        eventEmitter.emit("finish");
                    });
                }
                else res.send({err:"The requested ID isn't a student."});
            }
        });
    });
    //OK {studentID,[courseID]} return {}
    app.post("/post/removeStudentCourse",function(req,res){
        var studentID=parseInt(req.body.studentID);
        var courseID=req.body.courseID;
        var eventEmitter=new events.EventEmitter();
        //TODO var errOutput=[];
        userDB.findOne({_id:studentID},function(err,result){
            if(result==null){
                res.send({err:"The requested student ID doesn't exist."});
            }
            else{
                if(result.position=="student"){
                    var c=0;
                    eventEmitter.on("finish",function(){
                        if(c==courseID.length)res.send({});
                        c++;
                    });
                    getCourseDB(function(courseDB){
                        for(var i=0;i<courseID.length;i++){
                            courseDB.updateOne({_id:courseID[i]},{$pull:{student:studentID}},function(){
                                eventEmitter.emit("finish");
                            });
                        }
                        eventEmitter.emit("finish");
                    });
                }
                else res.send({err:"The requested ID isn't a student."});
            }
        });
    });
    //OK {studentID,day,subject} return {}
    app.post("/post/addSkillDay",function(req,res){
        var studentID=parseInt(req.body.studentID);
        var day=parseInt(req.body.day);
        var subject=req.body.subject;
        userDB.findOne({_id:studentID},function(err,result){
            if(result==null){
                res.send({err:"The requested student ID doesn't exist."});
            }
            else{
                if(result.position=="student"){
                    userDB.updateOne({_id:studentID},
                        {$addToSet:{"student.skillDay":{subject:subject,day:day}}},
                        function(){
                            res.send({});
                        }
                    );
                }
                else res.send({err:"The requested ID isn't a student."});
            }
        });
    });
    //OK {studentID,day} return {}
    app.post("/post/removeSkillDay",function(req,res){
        var studentID=parseInt(req.body.studentID);
        var day=parseInt(req.body.day);
        userDB.findOne({_id:studentID},function(err,result){
            if(result==null){
                res.send({err:"The requested student ID doesn't exist."});
            }
            else{
                if(result.position=="student"){
                    userDB.updateOne({_id:studentID},
                        {$pull:{"student.skillDay":{day:day}}},
                        function(){
                            res.send({});
                        }
                    );
                }
                else res.send({err:"The requested ID isn't a student."});
            }
        });
    });
    //OK {studentID,day,subject} return {}
    app.post("/post/addHybridDay",function(req,res){
        var studentID=parseInt(req.body.studentID);
        var day=parseInt(req.body.day);
        var subject=req.body.subject;
        userDB.findOne({_id:studentID},function(err,result){
            if(result==null){
                res.send({err:"The requested student ID doesn't exist."});
            }
            else{
                if(result.position=="student"){
                    hybridSeatDB.updateOne({day:day},
                        {$setOnInsert:{_id:moment(day).format("dddHH")},
                            $addToSet:{student:{studentID:studentID,subject:subject}}
                        },{upsert:true},function(){
                            res.send({});
                        }
                    );
                }
                else res.send({err:"The requested ID isn't a student."});
            }
        });
    });
    //OK {studentID,day} return {}
    app.post("/post/removeHybridDay",function(req,res){
        var studentID=parseInt(req.body.studentID);
        var day=parseInt(req.body.day);
        userDB.findOne({_id:studentID},function(err,result){
            if(result==null){
                res.send({err:"The requested student ID doesn't exist."});
            }
            else{
                if(result.position=="student"){
                    hybridSeatDB.updateOne({day:day},
                        {$pull:{student:{studentID:studentID}}},
                        function(){
                            res.send({});
                        }
                    );
                }
                else res.send({err:"The requested ID isn't a student."});
            }
        });
    });

    // User Management
    //OK {password,firstname,lastname,nickname,firstnameEn,lastnameEn,nicknameEn,email,phone,grade(1-12),phoneParent} return {}
    app.post("/post/addStudent",function(req,res){
        console.log("[REQUEST] addStudent");
        var password=req.body.password;
        var firstname=req.body.firstname;
        var lastname=req.body.lastname;
        var nickname=req.body.nickname;
        var firstnameEn=req.body.firstnameEn;
        var lastnameEn=req.body.lastnameEn;
        var nicknameEn=req.body.nicknameEn;
        var email=req.body.email;
        var phone=req.body.phone;
        var grade=parseInt(req.body.grade);
        var phoneParent=req.body.phoneParent;
        var balance=[{subject:"M",value:0},{subject:"PH",value:0}];
        configDB.findOne({},function(err,config){
            userDB.insertOne({
                _id:config.nextStudentID,password:password,position:"student",
                firstname:firstname,lastname:lastname,nickname:nickname,
                firstnameEn:firstnameEn,lastnameEn:lastnameEn,nicknameEn:nicknameEn,
                email:email,phone:phone,
                student:{grade:grade,registrationState:"unregistered",skillDay:[],balance:balance,phoneParent:phoneParent,status:"active"}
            },function(err,result){
                configDB.updateOne({},{$inc:{nextStudentID:1}});
                // res.send({}); TODO
                res.send(result.ops);
            });
        });
    });
    //OK {studentID} return {}
    app.post("/post/removeStudent",function(req,res){
        console.log("[REQUEST] removeStudent");
        var studentID=parseInt(req.body.studentID);
        userDB.findOne({_id:studentID},function(err,result){
            if(result==null)res.send({err:"The requested ID doesn't exist."});
            else if(result.position!="student")res.send({err:"The requested ID isn't a student."});
            else{
                userDB.deleteOne({_id:studentID},function(){
                    res.send({});
                });
            }
        });
    });
    //TODO ADD editStudent
    //OK {password,firstname,lastname,nickname,email,nicknameEng} return {}
    app.post("/post/addTutor",function(req,res){
        console.log("[REQUEST] addTutor");
        var password=req.body.password;
        var firstname=req.body.firstname;
        var lastname=req.body.lastname;
        var nickname=req.body.nickname;
        var firstnameEn=req.body.firstnameEn;
        var lastnameEn=req.body.lastnameEn;
        var nicknameEn=req.body.nicknameEn;
        var email=req.body.email;
        var phone=req.body.phone;
        configDB.findOne({},function(err,config){
            userDB.insertOne({
                _id:config.nextTutorID,password:password,position:"tutor",
                firstname:firstname,lastname:lastname,nickname:nickname,
                firstnameEn:firstnameEn,lastnameEn:lastnameEn,nicknameEn:nicknameEn,
                email:email,phone:phone,
                tutor:{status:"active"}
            },function(err,result){
                configDB.updateOne({},{$inc:{nextTutorID:1}});
                // res.send({}); TODO
                res.send(result.ops);
            });
        });
    });
    //OK {tutorID} return {}
    app.post("/post/removeTutor",function(req,res){
        console.log("[REQUEST] removeTutor");
        var tutorID=parseInt(req.body.tutorID);
        userDB.findOne({_id:tutorID},function(err,result){
            if(result==null)res.send({err:"The requested ID doesn't exist."});
            else if(result.position!="tutor")res.send({err:"The requested ID isn't a tutor."});
            else{
                userDB.deleteOne({_id:tutorID},function(){
                    res.send({});
                });
            }
        });
    });
    //TODO ADD editTutor

    // Course
    //OK {} return {course:[{courseID,subject,[grade],level,day,[tutor],[student],courseName}]}
    app.post("/post/allCourse",function(req,res){
        var output=[];
        var eventEmitter=new events.EventEmitter();
        getCourseDB(function(courseDB){
            courseDB.find().sort({subject:1,grade:1,level:1,tutor:1}).toArray(function(err,result){
                var c=0;
                eventEmitter.on("finish",function(){
                    if(c==result.length)res.send({course:output});
                    c++;
                });
                for(var i=0;i<result.length;i++){
                    (function(i){
                        getCourseName(result[i]._id,function(courseName){
                            output[i]={courseID:result[i]._id};
                            output[i]=Object.assign(output[i],result[i]);
                            delete output[i]._id;
                            output[i].grade=gradeBitToArray(output[i].grade);
                            delete output[i].submission;
                            output[i].courseName=courseName;
                            eventEmitter.emit("finish");
                        });
                    })(i);
                }
                eventEmitter.emit("finish");
            });
        });
    });
    //OK {grade(1-13)} return {course:[{courseID,courseName,day,[tutor]}]}
    app.post("/post/gradeCourse",function(req,res){
        var grade=parseInt(req.body.grade);
        var output=[];
        var eventEmitter=new events.EventEmitter();
        getCourseDB(function(courseDB){
            courseDB.find({grade:{$bitsAllSet:[grade-1]}}).sort({subject:1,grade:1,level:1,tutor:1}).toArray(function(err,result){
                var c=0;
                eventEmitter.on("finish",function(){
                    if(c==result.length)res.send({course:output});
                    c++;
                });
                for(var i=0;i<result.length;i++){
                    (function(i){
                        getCourseName(result[i]._id,function(courseName){
                            output.push({courseID:result[i]._id,courseName:courseName,day:result[i].day,tutor:result[i].tutor});
                            eventEmitter.emit("finish");
                        });
                    })(i);
                }
                eventEmitter.emit("finish");
            });
        });
    });
    //OK {courseID} return {courseName,day,[tutor],[student]}
    app.post("/post/courseInfo",function(req,res){
        var courseID=req.body.courseID;
        getCourseDB(function(courseDB){
            courseDB.findOne({_id:courseID},function(err,result){
                if(result==null)res.send({err:"No course found."});
                else{
                    getCourseName(courseID,function(courseName){
                        res.send({courseName:courseName,day:result.day,tutor:result.tutor,student:result.student});
                    });
                }
            });
        });
    });
    //OK {grade} return {[course]}
    app.post("/post/listCourseSuggestion",function(req,res){
        var grade=parseInt(req.body.grade);
        var output=[];
        courseSuggestionDB.find({grade:grade}).sort({level:1}).toArray(function(err,result){
            if(result==null)res.send({course:output});
            else{
                for(var i=0;i<result.length;i++){
                    output[i]={level:result[i].level,courseID:result[i].courseID};
                }
                res.send({course:output});
            }
        });
    });
    //OK {grade,level,[courseID]} return {}
    app.post("/post/addCourseSuggestion",function(req,res){
        var grade=parseInt(req.body.grade);
        var level=req.body.level;
        var courseID=req.body.courseID;
        courseSuggestionDB.updateOne({grade:grade,level:level},
            {$setOnInsert:{_id:grade+level},$addToSet:{courseID:{$each:courseID}}},
            {upsert:true},function(){
                res.send({});
            }
        );
    });
    //OK {grade,level,[courseID]} return {}
    app.post("/post/removeCourseSuggestion",function(req,res){
        var grade=parseInt(req.body.grade);
        var level=req.body.level;
        var courseID=req.body.courseID;
        courseSuggestionDB.updateOne({grade:grade,level:level},
            {$pull:{courseID:{$in:courseID}}},function(){
                res.send({});
            }
        );
    });
    //OK {subject,[grade],level,day,[tutor]} return {}
    app.post('/post/addCourse',function(req,res){
        var subject=req.body.subject;
        var grade=req.body.grade;
        for(var i=0;i<grade.length;i++){
            grade[i]=parseInt(grade[i]);
        }
        grade=gradeArrayToBit(grade);
        var level=req.body.level;
        var day=parseInt(req.body.day);
        var tutor=req.body.tutor;
        for(var i=0;i<tutor.length;i++){
            tutor[i]=parseInt(tutor[i]);
        }
        var courseID=new ObjectID().toString();
        getCourseDB(function(courseDB){
            courseDB.insertOne({_id:courseID,subject:subject,grade:grade,level:level,day:day,tutor:tutor,student:[],submission:[]},function(err,result){
                console.log(result.ops);
                res.send(result.ops);//TODO ret {}
            });
        });
    });
    //OK {courseID} return {}
    app.post("/post/removeCourse",function(req,res){
        var courseID=req.body.courseID;
        getCourseDB(function(courseDB){
            courseDB.findOne({_id:courseID},function(err,result){
                if(result==null)res.send({err:"The requested course doesn't exist."});
                else{
                    courseDB.deleteOne({_id:courseID},function(){
                        res.send({});
                    });
                }
            });
        });
    });
    //TODO ADD editCourse

    // Reciept
    //TODO configPath/File {studentID,file} return {}
    app.post("/post/submitReceipt",function(req,res){
        var studentID=parseInt(req.body.studentID);
        var file=req.files[0];
        console.log(file);
        userDB.findOne({_id:studentID},function(err,result){
            if(result==null){
                res.send({err:"The requested student ID doesn't exist."});
            }
            else{
                if(result.position=="student"){
                    configDB.findOne({},function(err,result){
                        var newPath=result.receiptPath;
                        var year=result.year;
                        var quarter=result.quarter;
                        newPath+="CR"+year+"Q"+quarter+"/";
                        var originalName=file.originalname;
                        var originalType=originalName.slice(originalName.lastIndexOf("."));
                        var oldPath=file.path;
                        fs.readFile(oldPath,function(err,data){
                            if(err)res.send({err:err});
                            else fs.writeFile(newPath+studentID+originalType.toLowerCase(),data,function(err){
                                if(err)res.send({err:err});
                                else res.send({});
                            });
                        });
                    });
                }
                else res.send({err:"The requested ID isn't a student."});
            }
        });
    });

    // Configuration
    //OK {} return {_id,year,quarter,courseMaterialPath,receiptPath,nextStudentID,nextTutorID}
    app.post('/post/getConfig',function(req,res){
        configDB.findOne({},function(err,config){
            res.send(config);
        });
    });
    //OK {year,quarter,courseMaterialPath,receiptPath,nextStudentID,nextTutorID,maxHybridSeat} return {}
    app.post('/post/editConfig',function(req,res){
        configDB.updateOne({},{
            year:parseInt(req.body.year),
            quarter:parseInt(req.body.quarter),
            courseMaterialPath:req.body.courseMaterialPath,
            receiptPath:req.body.receiptPath,
            nextStudentID:parseInt(req.body.nextStudentID),
            nextTutorID:parseInt(req.body.nextTutorID),
            maxHybridSeat:parseInt(req.body.maxHybridSeat)
        },function(){
            configDB.findOne({},function(err,config){
                console.log(config);
                res.send({});
            });
        });
    });
    //OK {toAdd} return {}
    app.post('/post/addStudentGrade',function(req,res){
        userDB.updateMany({position:"student"},{$inc:{"student.grade":parseInt(req.body.toAdd)}});
        res.send({});
    });


    app.post("/debug/listUser",function(req,res){
        userDB.find().toArray(function(err,result){
            res.send(result);
        });
    });
    app.post("/debug/listCourse",function(req,res){
        getCourseDB(function(courseDB){
            courseDB.find().toArray(function(err,result){
                res.send(result);
            });
        });
    });
    app.post("/debug/listHybridSeat",function(req,res){
        hybridSeatDB.find().toArray(function(err,result){
            res.send(result);
        });
    });
    app.post("/debug/listCourseSuggestion",function(req,res){
        courseSuggestionDB.find().toArray(function(err,result){
            res.send(result);
        });
    });
    app.get("*",function(req,res){
        res.status(404).send("");
    });
}
module.exports.run=run;
