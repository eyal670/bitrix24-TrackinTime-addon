# bitrix24-TrackinTime-addon
a JavaScript add-on to integrate TrackingTime.co controllers into Bitrix24 projects manager

### setup:
add this function to your execution script:
  ```$.getScript("https://cdn.rawgit.com/eyal670/bitrix24-TrackinTime-addon/master/bitrix24-TrackinTime.js", function () {
    /*set your script options here, for example:*/
    console.log('add_custom_quick_task_btn: '+[add_custom_quick_task_btn = true]);
  });```

### To Do:
* Add live overall duration display for the task
* close btn to mark task as done in bitrix and TrackingTime in one click
