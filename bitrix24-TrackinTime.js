console.log('\
      Extra options - add to script exec to active option:\n\
        -  add_custom_quick_task_btn = true; => adding save and close btn to qiuck task panel\n\
        \
');

//options vars
var version = '0.4.2 Beta';
var add_custom_quick_task_btn = false;//set to true for adding save and close btn to qiuck task panel

//loading the script
setTimeout(function(){
    $( document ).ready(function() {
      //check if tasks table is on that page and if found run the setup function
      if($(".main-grid-container").length){
        //console.clear();
        console.log('tasks table found');
        console.log('loading tracking buttons script...');
        var running_task;
        var user_id;

        //inject styles
        console.log("inject styles");
        $('head').append("<style>.createTrackBtns{font-size: 13px;background-color: #3c3c3c;padding: 2px;text-align: center;width: 205px;width: fit-content;color: #fff;cursor: pointer;border-right: 1px solid #000;border-bottom: 1px solid #000;border-radius: 0 0 5px 0;}.createTrackBtns:hover{background-color: grey;}span.trackBtn, span.actionBtn {background-color: #3c3c3c;color: #fff;padding: 0 10px;cursor: pointer;}span.trackBtn{border-radius: 10px 0 0 10px;border-right:0.5px solid #fff;}span.actionBtn{border-radius: 0 10px 10px 0;border-left: 0.5px solid #fff;}span.stopTrack {background-color: lightseagreen;color: #000;}span.noProject{background-color:#ff8c00}span.trackBtn:hover, span.actionBtn:hover {background-color: grey;}a.important_task{  color: #fff !important;background-color: red;padding: 5px 10px;border-radius: 20px;}span.important_task_btn {display: none;text-decoration: underline;cursor: pointer;margin-left: 15px;}.main-grid-cell:hover .important_task_btn {display: initial;}</style>")

        //open subtasks to be abel to build buttons for them too
        console.log('trying to expand subtasks rows');
        $('.main-grid-cell-content span.main-grid-plus-button').click();
        //a little delay before building the button until subtask will be created on page
        setTimeout(function(){
          buildTracker();
          rebuild_track_btn();
        }, 2000); 
      }else{
        console.log('no tasks table, no action taken');
      }

      //add costum save-quick-task btn
      if(add_custom_quick_task_btn){
        quick_add_task_btn();
      }
});
},3000);

/***Functions Definition***/
//build tracker btns
function buildTracker(){
  console.log('\nstart building buttons...');
  $(".main-grid-row-body td:nth-child(3)").append('<span class="trackBtn">track</span><span class="actionBtn close">close</span>');
  $(".main-grid-row-body td:nth-child(3)").append('<span class="important_task_btn">mark important</span>');
    //track btn setup
    $(".trackBtn").click(function(){
      var task_name;
      var project_name;
      var bitrix_id = $(this).closest("tr").attr("data-id");

      if($(this).hasClass("stopTrack")){
        $(this).removeClass("stopTrack noProject").text("track");
        stop_tracking(task_name, project_name);
        localStorage.removeItem("bitrix:ttTask:ttEvent-id");
      }else{
        $(this).addClass("stopTrack").text("stop");
        task_name = $(this).parent().find("a.task-title").text();
        //get bitrix task link
        var bitrix_link = 'https://divine.bitrix24.com'+$(this).parent().find("a.task-title").attr('href');
        if($(".profile-menu-info").length){
          project_name = $.trim($(".profile-menu-info").text());
        }else if(parseInt($(this).closest("tr").attr('data-group-id'))){
          var group_id = $(this).closest("tr").attr('data-group-id');
          var project_name = $.trim($('.main-grid-table').find('tr[data-id="group_'+group_id+'"] a').text());
          console.log('group id: '+ group_id);
          console.log('name: '+ project_name);
        }else{
          $(this).addClass("noProject");
        }
        start_tracking(task_name, project_name, bitrix_id, bitrix_link);
      }
    });
    //action btn setup
    $(".actionBtn").click(function(){
      var action;
      var query;
      var task_name
      var project_name
      var bitrix_id = $(this).closest("tr").attr("data-id");

      if($(this).hasClass("close")){
        $(this).removeClass("close").text("open");
        action = "close";
        query = 'https://app.trackingtime.co/api/v4/tasks/close/'+window.running_task;
        localStorage.removeItem("bitrix:ttTask:ttEvent-id");
        console.log('query: '+query);
        console.log('closing task: '+window.running_task);
      }
      //track(action,query,bitrix_id);
    });
    //mark important btn setup
    $(".important_task_btn").click(function(){
      var bitrix_id = $(this).closest("tr").attr("data-id");
      $(this).closest("td a").addClass('important_task');
      console.log('mark as important');
      if($(this).hasClass("close")){
        $(this).removeClass("close").text("open");
        action = "close";
        query = 'https://app.trackingtime.co/api/v4/tasks/close/'+window.running_task;
        localStorage.removeItem("bitrix:ttTask:ttEvent-id");
        console.log('query: '+query);
        console.log('closing task: '+window.running_task);
      }
    });
    console.log('done building buttons');
    //closing sub tasks rows
    $('.main-grid-cell-content span.main-grid-plus-button').click();
    //checking for already running tasks
    getRunningTask();
  }
//start tracking task
function start_tracking(task_name, project_name, bitrix_id, bitrix_link){
  var time = get_date();
  var query = 'https://app.trackingtime.co/api/v4/tasks/track?date='+time+'&task_name='+task_name+'&project_name='+project_name+'&stop_running_task=true&return_task=true';
  $.ajax({
    url: query+"&callback=?",
    dataType: 'json',
    async: false,
    type: 'GET',
    success: function (resp) {
      window.running_task = resp.data.id;
      window.user_id = resp.data.user.id;
      var event_id = resp.data.tracking_event.id;
      console.log("\nstart tracking task #: "+window.running_task);
      console.log(resp);
      localStorage.setItem("bitrix:ttTask:ttEvent-id",bitrix_id+':'+window.running_task+':'+event_id);
      //add bitrix link as comment to tt task
      add_bitrix_link(window.running_task, bitrix_link);
    },
    error: function(e) {
        console.log('Error: '+e.data);
    }
  });
}

//stop tracking task
function stop_tracking(task_name, project_name){
  var time = get_date();
  var query = 'https://app.trackingtime.co/api/v4/tasks/stop/'+window.running_task+'?date='+time+'&return_task=true';
  $.ajax({
    url: query+"&callback=?",
    dataType: 'json',
    async: false,
    type: 'GET',
    success: function (resp) {
      console.log("\nstop tracking task #: "+window.running_task);
      console.log(resp);
      window.running_task = null;
      var event_id = resp.data.id;
    },
    error: function(e) {
        console.log('Error: '+e.data);
    }
  });
}

//task action btn
function task_action(action){
  $.ajax({
    url: query+"&callback=?",
    dataType: 'json',
    async: false,
    type: 'GET',
    success: function (resp) {
      console.log(resp);
      running_task = resp.data.id;
      var event_id = resp.data.tracking_event.id;
      console.log(action+" task #: "+running_task);
      if(action == "start"){
       localStorage.setItem("bitrix:ttTask:ttEvent-id",bitrix_id+':'+running_task+':'+event_id); 
      }
    },
    error: function(e) {
        console.log('Error: '+e.data);
    }  
  });
}

//add bitrix link only if there is no comments
function add_bitrix_link(id, link){
  var query = 'https://app.trackingtime.co/api/v4/tasks/'+id+'/comments';
  $.ajax({
    url: query+"?callback=?",
    dataType: 'json',
    async: false,
    type: 'GET',
    success: function (resp) {
      console.log('\nsearching comments in tt task:');
      console.log(resp);
      if(!resp.data.length){
        var comment = 'bitrix link: '+link;
        console.log('no comments, injecting bitrix link comment');
        add_comment(id, comment, );
      }else{
        console.log('comments found, injecting bitrix link to comment canceled')
      }
    },
    error: function(e) {
        console.log('Error: '+e.data);
    }
  });
}

//add comment
function add_comment(id, comment, user_id){
  var time = get_date();
  var query = 'https://app.trackingtime.co/api/v4/tasks/'+id+'/comments/add?text='+comment+'&created_at='+time+'&user_id='+window.user_id;
  $.ajax({
    url: query+"&callback=?",
    dataType: 'json',
    async: false,
    type: 'GET',
    success: function (resp) {
      console.log('\ncomment injected:');
      console.log(resp);
    },
    error: function(e) {
        console.log('Error: '+e.data);
    }  
  });
}

//search already running task and get task object from tt server
function getRunningTask(){
  console.log('\nget already running task from memory');
  var time = get_date();
  var bitrix_tt_id_str = localStorage.getItem("bitrix:ttTask:ttEvent-id");
  if(bitrix_tt_id_str === null){
    console.log('no record of running task');
  }else{
    console.log('task record found, fetching data from tt server');
    var bitrix_tt_id = bitrix_tt_id_str.split(":");
    query = 'https://app.trackingtime.co/api/v4/tasks/sync/'+bitrix_tt_id[1]+'?event_id='+bitrix_tt_id[2]+'&date='+time+'&return_task=true';
    $.ajax({
      url: query+"&callback=?",
      dataType: 'json',
      async: false,
      type: 'GET',
      success: function (resp) {
        if(resp.response.status == 200){
          console.log('task still running')
          console.log(resp);
          window.running_task = resp.data.id;
          var className = 'stopTrack';
          if(resp.data.project_id === null){
            className += ' noProject';
          }
          $('tr[data-id="'+bitrix_tt_id[0]+'"]').find('.trackBtn').addClass(className).text("stop");
        }else if(resp.response.status == 502){
          console.log('task already stoped, remove record from local memory');
          localStorage.removeItem("bitrix:ttTask:ttEvent-id");
        }
      },
      error: function(e) {
          console.log('Error: '+e.data);
          localStorage.removeItem("bitrix:ttTask:ttEvent-id");//work around to delete unused task record because of tt server error
      }  
    });
  }
}

//add btn for recreate tracking buttons
  function rebuild_track_btn(){
    $(".main-grid-container").prepend('<div class="createTrackBtns">Rebuild Tracking Buttons|v'+window.version+'</div>');
    $(".createTrackBtns").click(function(){
      $('.main-grid-cell-content span.main-grid-plus-button').click();
      $('.trackBtn, .actionBtn').remove();
      buildTracker();
    }); 
  }

//get current time for api query
function get_date(){
  var d = new Date();
  var year = d.getFullYear();
  var month = d.getMonth()+1;
  var day = d.getDate();
  var hr = d.getHours();
  var min = d.getMinutes();
  var sec = d.getSeconds();
  return(year+'-'+month+'-'+day+' '+hr+':'+min+':'+sec);
}

//add save and close btn for quick add task panel
function quick_add_task_btn(delayT = 3000){
  console.log('\nadd_custom_quick_task_btn='+add_custom_quick_task_btn);
  $('.tasks-quick-form-button').click(function(){
      $('head').append("<style>span.add_close {cursor: pointer;border: 1px solid darkgray;padding: 10px 7px;font-family: OpenSans-Bold, Helvetica, Arial, sans-serif;font-size: 12px;font-weight: 400;height: 39px;line-height: 39px;color: dimgray;margin-right: 10px;}span.add_close:hover {background-color: lightgray;}</style>");
      if($('.add_close').length != 1){
        $('span.task-top-panel-middle').prepend('<span class="add_close">save and close</span>');
        $('.add_close').click(function(){
          console.log('save and close');
          $('span#task-new-item-save').click();
            setTimeout(function(){
            $('span#task-new-item-cancel, span#task-new-item-notification-hide').click();
            $('.createTrackBtns').click();
          },delayT);
        }); 
      }else{
        console.log('no action');
        return;
      }
  });
}
